import { useState, useEffect } from 'react';

interface TimerPreset {
  id: string;
  label: string;
  minutes: number;
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'preset-5', label: '5 Minutes', minutes: 5 },
  { id: 'preset-15', label: '15 Minutes', minutes: 15 },
  { id: 'preset-25', label: '25 Minutes (Pomodoro)', minutes: 25 },
];

export default function App() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [activeLabel, setActiveLabel] = useState<string>('');
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState('');

  // Load presets and active timer status
  useEffect(() => {
    chrome.storage.local.get(['timerPresets', 'timerEndTime', 'timerLabel'], (result) => {
      if (result.timerPresets) {
        setPresets(result.timerPresets as TimerPreset[]);
      } else {
        setPresets(DEFAULT_PRESETS);
        chrome.storage.local.set({ timerPresets: DEFAULT_PRESETS });
      }

      if (result.timerLabel) {
        setActiveLabel(result.timerLabel as string);
      }
    });

    const checkTimer = () => {
      chrome.storage.local.get(['timerEndTime', 'timerLabel'], (result) => {
        const endTime = result.timerEndTime as number | undefined;
        if (endTime) {
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
          if (remaining > 0) {
            setTimeLeft(remaining);
            if (result.timerLabel) setActiveLabel(result.timerLabel as string);
          } else {
            setTimeLeft(null);
          }
        } else {
          setTimeLeft(null);
        }
      });
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save presets and notify background worker to update context menus
  const savePresets = (updatedPresets: TimerPreset[]) => {
    setPresets(updatedPresets);
    chrome.storage.local.set({ timerPresets: updatedPresets }, () => {
      chrome.runtime.sendMessage({ type: 'REFRESH_CONTEXT_MENU' });
    });
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(newMinutes);
    if (!newLabel.trim() || isNaN(mins) || mins <= 0) return;

    const newPreset: TimerPreset = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      minutes: mins,
    };

    savePresets([...presets, newPreset]);
    setNewLabel('');
    setNewMinutes('');
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
  };

  const startPresetTimer = (preset: TimerPreset) => {
    const durationMinutes = preset.minutes;
    const endTime = Date.now() + durationMinutes * 60 * 1000;

    chrome.alarms.create('activeTimer', { delayInMinutes: durationMinutes });
    chrome.storage.local.set({ timerEndTime: endTime, timerLabel: preset.label });

    setTimeLeft(durationMinutes * 60);
    setActiveLabel(preset.label);
  };

  const cancelTimer = () => {
    chrome.alarms.clear('activeTimer');
    chrome.storage.local.remove(['timerEndTime', 'timerLabel']);
    setTimeLeft(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '16px', width: '260px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 12px 0', textAlign: 'center' }}>React Timer</h3>

      {timeLeft !== null ? (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#aaa' }}>{activeLabel}</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '4px 0' }}>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={cancelTimer}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel Timer
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginBottom: '16px' }}>
          No active timer running.
        </div>
      )}

      <hr style={{ borderColor: '#333', margin: '12px 0' }} />

      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Timer Presets</h4>
      <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '12px' }}>
        {presets.map((preset) => (
          <div
            key={preset.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: '1px solid #2a2a2a',
            }}
          >
            <span style={{ fontSize: '13px' }}>
              {preset.label} ({preset.minutes}m)
            </span>
            <div>
              <button
                onClick={() => startPresetTimer(preset)}
                style={{
                  marginRight: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Start
              </button>
              <button
                onClick={() => handleDeletePreset(preset.id)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  backgroundColor: '#444',
                  color: '#ff6b6b',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddPreset} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
          type="text"
          placeholder="Label (e.g. Tea Timer)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ padding: '6px', fontSize: '12px', borderRadius: '3px', border: '1px solid #444', background: '#222', color: '#fff' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="number"
            step="any"
            placeholder="Mins"
            value={newMinutes}
            onChange={(e) => setNewMinutes(e.target.value)}
            style={{ width: '60px', padding: '6px', fontSize: '12px', borderRadius: '3px', border: '1px solid #444', background: '#222', color: '#fff' }}
          />
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Add Preset
          </button>
        </div>
      </form>
    </div>
  );
}
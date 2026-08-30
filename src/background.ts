export interface TimerPreset {
  id: string;
  label: string;
  minutes: number;
}

// Default presets if the user hasn't created any yet
const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'preset-5', label: '5 Minutes', minutes: 5 },
  { id: 'preset-15', label: '15 Minutes', minutes: 15 },
  { id: 'preset-25', label: '25 Minutes (Pomodoro)', minutes: 25 },
];

// Rebuild the parent and child context menu items
async function updateContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // Parent menu item
    chrome.contextMenus.create({
      id: 'parent-timer-menu',
      title: 'Start Timer',
      contexts: ['all'],
    });

    // Fetch active presets from storage
    chrome.storage.local.get(['timerPresets'], (result) => {
      // Safely fall back to DEFAULT_PRESETS if result.timerPresets is undefined or empty
      const presets: TimerPreset[] = (result.timerPresets as TimerPreset[]) || DEFAULT_PRESETS;

      if (!result.timerPresets) {
        chrome.storage.local.set({ timerPresets: DEFAULT_PRESETS });
      }

      // Add each preset as a child menu item
      presets.forEach((preset) => {
        chrome.contextMenus.create({
          id: `preset-${preset.id}`,
          parentId: 'parent-timer-menu',
          title: preset.label,
          contexts: ['all'],
        });
      });
    });
  });
}

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  updateContextMenus();
});

// Listen for updates from React UI when presets are modified
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'REFRESH_CONTEXT_MENU') {
    updateContextMenus();
  }
});

// Handle right-click context menu selections
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId.toString().startsWith('preset-')) {
    const presetId = info.menuItemId.toString().replace('preset-', '');

    chrome.storage.local.get(['timerPresets'], (result) => {
      const presets: TimerPreset[] = (result.timerPresets as TimerPreset[]) || DEFAULT_PRESETS;
      const selected = presets.find((p) => p.id === presetId);

      if (selected) {
        startTimer(selected.minutes, selected.label);
      }
    });
  }
});

function startTimer(durationMinutes: number, label: string) {
  const endTime = Date.now() + durationMinutes * 60 * 1000;

  chrome.alarms.create('activeTimer', { delayInMinutes: durationMinutes });
  chrome.storage.local.set({ timerEndTime: endTime, timerLabel: label });

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'https://www.google.com/favicon.ico',
    title: 'Timer Started',
    message: `${label} timer is now running.`,
  });
}

// Alarm trigger listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'activeTimer') {
    chrome.storage.local.get(['timerLabel'], (result) => {
      const label = result.timerLabel || 'Timer';
      chrome.storage.local.remove(['timerEndTime', 'timerLabel']);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'https://www.google.com/favicon.ico',
        title: "Time's Up!",
        message: `${label} has completed!`,
      });
    });
  }
});
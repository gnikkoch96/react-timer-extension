import { useState, useEffect } from "react";

export default function App() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Helper function to check remaining time from chrome.storage
    const checkTimer = () => {
      chrome.storage.local.get(["timerEndTime"], (result) => {
        // Cast result.timerEndTime to a number
        const endTime = result.timerEndTime as number | undefined;

        if (endTime) {
          const remaining = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000),
          );
          if (remaining > 0) {
            setTimeLeft(remaining);
          } else {
            setTimeLeft(null);
          }
        } else {
          setTimeLeft(null);
        }
      });
    };

    // Check immediately on open
    checkTimer();

    // Update the UI tick every second
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cancelTimer = () => {
    chrome.alarms.clear("activeTimer");
    chrome.storage.local.remove(["timerEndTime", "timerDuration"]);
    setTimeLeft(null);
  };

  return (
    <div
      style={{
        width: "220px",
        padding: "16px",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0" }}>React Timer</h3>

      {timeLeft !== null ? (
        <div>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", margin: "12px 0" }}
          >
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={cancelTimer}
            style={{
              padding: "6px 12px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel Timer
          </button>
        </div>
      ) : (
        <p style={{ color: "#666", fontSize: "14px" }}>
          No active timer running. Right-click anywhere on a webpage to start
          one!
        </p>
      )}
    </div>
  );
}

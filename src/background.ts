// 1. Create the right-click menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "start-5min-timer",
    title: "Start 5-Minute Timer",
    contexts: ["all"]
  });
});

// 2. Listen for right-click menu item selections
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "start-5min-timer") {
    const durationMinutes = 5;
    const endTime = Date.now() + durationMinutes * 60 * 1000;

    // Set a Chrome alarm to wake up when time is up
    chrome.alarms.create("activeTimer", { delayInMinutes: durationMinutes });

    // Save timer end time to storage so React can read it later
    chrome.storage.local.set({ timerEndTime: endTime, timerDuration: durationMinutes });

    // Send a desktop notification that the timer started
    chrome.notifications.create({
      type: "basic",
      iconUrl: "https://www.google.com/favicon.ico",
      title: "Timer Started",
      message: `Your ${durationMinutes}-minute timer is now running.`
    });
  }
});

// 3. Listen for the alarm to trigger when time expires
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "activeTimer") {
    // Clear storage state
    chrome.storage.local.remove(["timerEndTime", "timerDuration"]);

    // Send completion notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "https://www.google.com/favicon.ico",
      title: "Time's Up!",
      message: "Your timer has completed."
    });
  }
});
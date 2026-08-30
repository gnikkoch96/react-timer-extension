chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PLAY_AUDIO') {
    // Uses a built-in browser sound chime URL or local file
    const audio = new Audio(message.soundUrl || 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play();
  }
});
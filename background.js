const APP_URL = 'app.html';

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL(APP_URL) });
});

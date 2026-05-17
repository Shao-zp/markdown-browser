const APP_URL = 'app.html';

chrome.action.onClicked.addListener(async () => {
  const appUrl = chrome.runtime.getURL(APP_URL);
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(t => t.url === appUrl);

  if (existing) {
    chrome.tabs.update(existing.id, { active: true });
    chrome.windows.update(existing.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: appUrl });
  }
});

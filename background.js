let onfocus = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ onfocus });
});
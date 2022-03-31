// Save inZone variable using storage API
let inZone = false;
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ inZone });
});

// Save blackList variable using storage API
const blackList = [];
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ blackList });
});
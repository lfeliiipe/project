// Save inZone variable using storage API
let inZone = false;
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ inZone });
});

// Save blockList variable using storage API
const blockList = [];
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ blockList });
});
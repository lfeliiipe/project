// Save inZone variable using storage API
let inZone = false;
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ inZone });
});

// Save blackList variable using storage API
const blackList = ["twitter.com", "facebook.com", "youtube.com"];
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ blackList });
});
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


// Listen for changes in storage API
chrome.storage.onChanged.addListener(function (changes, namespace) {
    
    // Turn blocking on and off when changes happen to 'inZone'
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        
        // Add listener for updates on tabs
        if (key === "inZone" && newValue === true) {
            chrome.tabs.onUpdated.addListener(blockingListener);
        }

        // Remove listener for updates on tabs
        if (key === "inZone" && newValue === false) {
            if (chrome.tabs.onUpdated.hasListener(blockingListener)) {
                chrome.tabs.onUpdated.removeListener(blockingListener);
            }
        }
    }
});


// Listen for updates on tabs
async function blockingListener() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Abort injecting script when url is not ready
    if (!tab.url) {
        return;
    }

    // Abort injecting script in the extension's pages
    const notAllowedUrls = ["chrome://", "chrome-extension://"];
    for (site of notAllowedUrls) {
        if (tab.url.includes(site)) {
            return;
        }
    }
    
    chrome.storage.sync.get("blockList", ({ blockList }) => {
        for (site of blockList) {

            // Insert script in sites from the block list
            if (tab.url.includes(site)) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: blockSites,
                });
            }
        }
    });
}


// The body of this function will be executed as a content script inside the current page
function blockSites() {
    let url = chrome.runtime.getURL("block.html");
    location.assign(url);
}

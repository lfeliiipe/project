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


// Listen for web navigation changes (url changes)
chrome.webNavigation.onCommitted.addListener((details) => {

    // Retrieve all items from storage API
    chrome.storage.sync.get(null, (items) => {

        // Abort injecting script in the extension's pages
        const notAllowedUrls = ["chrome://", "chrome-extension://"];
        for (site of notAllowedUrls) {
            if (details.url.includes(site)) {
                console.log(details.url + " contem " + site + " por isso nao injetou");
                return;
            }
        }

        console.log("items", items);

        // Redirect if current url is in the block list and inZone mode is on
        for (site of items.blockList) {
            if (details.url.includes(site) && (items.inZone)) {
                console.log("listener de navegação ouviu e injetou script ao acessar: ", details.url);
        
                chrome.scripting.executeScript({
                    target: { tabId: details.tabId },
                    function: blockSites,
                });
            }
        }
    });
});


// This function will be executed as a content script inside the chosen tab
function blockSites() {
    let url = chrome.runtime.getURL("block.html");
    location.assign(url);
}

// Import login/authentication and API related functions
import { uploadSession, notify, resetStorageObjs } from "./helpers.js";
import { initCache } from "./oauth.js";

// Initialize user info cache and necessary objects using storage API
chrome.runtime.onInstalled.addListener(() => {

    // Retrieve all items from storage API
    chrome.storage.sync.get(null, async (items) => {
        console.log("entrou no listener e no storage get no oninstalled");

        // Initialize inZone object
        if(!items.inZone) {
            await resetStorageObjs("inZone");  
        }

        // Initialize blockList
        if(!items.blockList) {
            await resetStorageObjs("blockList");
            
        }

        // Initialize file settings
        if(!items.fileSettings) {
            await resetStorageObjs("fileSettings");
            
        }

        // Initialize cache on session storage
        await initCache();
    });
});


// Listen for web navigation changes (url changes)
chrome.webNavigation.onCommitted.addListener((details) => {

    // Retrieve all items from storage API
    chrome.storage.sync.get(null, (items) => {

        // Abort injecting script in the extension's pages
        const notAllowedUrls = ["chrome://", "chrome-extension://"];
        for (let site of notAllowedUrls) {
            if (details.url.includes(site)) {
                return;
            }
        }

        console.log("items", items);

        // Abort if there's no block list
        if (!items.blockList) {
            return;
        }

        // Redirect if current url is in the block list and inZone mode is on
        for (let site of items.blockList) {
            if (details.url.includes(site) && (items.inZone.isOn)) {
                console.log("listener de navegação ouviu e injetou script ao acessar: ", details.url);
        
                chrome.scripting.executeScript({
                    target: { tabId: details.tabId },
                    function: () => {
                        let url = chrome.runtime.getURL("block.html");
                        location.assign(url);
                    },
                });
            }
        }
    });
});


// Listen for alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {

    // Deal with chrome.alarms bug when service worker goes idle (alarm triggering twice)
    let { inZone } = await chrome.storage.sync.get("inZone"); 
    if(inZone.lastAlarmName === alarm.name) return;
    inZone.lastAlarmName = alarm.name;
    chrome.storage.sync.set({ inZone });
    
    // Alarm for DEFINED time setting
    if(alarm.name === "defined") {
        endZoneTime(true);
        notify("Session is over!");
        await uploadSession();
    }

    // Alarms for POMODORO time setting
    else if(alarm.name.includes("pomo")) {

        // Narrow pomodoro possibilities to three options (zone, break, last)
        let pomoIndex = alarm.name.slice(alarm.name.indexOf(" ") + 1);
        if(pomoIndex !== "last" && parseInt(pomoIndex) % 2 == 0) pomoIndex = "zone";
        else if(pomoIndex !== "last" && parseInt(pomoIndex) % 2 != 0) pomoIndex = "break";
        
        // Update inZone and notify user
        switch(pomoIndex) {
            case "zone":
                endZoneTime();
                notify("Zone time is over!\nTake a break!");
                break;
            
            case "break":
                endBreakTime();
                notify("Break time is over!\nGet in the zone!");
                break;

            case "last":
                endBreakTime(true);
                notify("Pomodoro session is over!");
                await uploadSession();
                break;
        }
    }
});


// Initialize session cache on startup (initCache from oauth.js)
chrome.runtime.onStartup.addListener(initCache);


// Update inZone object when zone time is over
function endZoneTime(completed=false) {
    chrome.storage.sync.get("inZone", ({ inZone }) => {

        // Completed true means DEFINED time setting (session is over), in this case pomoStatus doesn't change 
        if(completed) {
            inZone.isCompleted = true;
        } else {
            inZone.pomoStatus.push("break");
        }

        inZone.isOn = false;
        chrome.storage.sync.set({ inZone });
    });
}


// Update inZone object when break time is over
function endBreakTime(completed=false) {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        
        // Completed true means pomodoro session is over
        if(completed) {
            inZone.isCompleted = true;
            inZone.isOn = false;
            inZone.pomoStatus.push("end");
        } else {
            inZone.pomoStatus.push("zone");
            inZone.isOn = true;
        }

        chrome.storage.sync.set({ inZone });
    });
}

// Import login/authentication related functions
import { initCache } from "./oauth.js";


// Initialize inZone object and blockList using storage API
chrome.runtime.onInstalled.addListener(() => {

    // Retrieve all items from storage API
    chrome.storage.sync.get(null, (items) => {
        console.log("entrou no listener e no storage get no oninstalled");

        // Initialize inZone object
        if (!items.inZone) {
            const inZone = {
                isOn: false, 
                isCompleted: false,
                started: false,
                startDateTime: "", 
                endDateTime: "",
                timeSetting: "",
                definedSettings: {},
                pomoSettings: {},
                pomoStatus: [],
                pomoDates: [],
            };
            chrome.storage.sync.set({ inZone });
            console.log("objeto inzone criado", inZone);
        }

        // Initialize blockList
        if (!items.blockList) {
            const blockList = [];
            chrome.storage.sync.set({ blockList });
            console.log("array blocklist criado", blockList);
        }

        // Initialize cache on session storage
        initCache();
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
                console.log(details.url + " contem " + site + " por isso nao injetou");
                return;
            }
        }

        console.log("items", items);

        // Abort if there's no block list
        if (!items.blockList) {
            console.log("nao injetou pq nao existe blocklist");
            return;
        }

        // Redirect if current url is in the block list and inZone mode is on
        for (site of items.blockList) {
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
chrome.alarms.onAlarm.addListener((alarm) => {
    
    // Alarm for DEFINED time setting
    if(alarm.name === "defined") {
        endZoneTime(true);
        notify("Session is over!");
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
                notify("Zone time is over!");
                break;
            
            case "break":
                endBreakTime();
                notify("Break time is over!");
                break;

            case "last":
                endBreakTime(true);
                notify("Pomodoro session is over!");
                break;
        }
    }
});


// Initialize session cache on startup (initCache from oauth.js)
chrome.runtime.onStartup.addListener(initCache);


// Update inZone object when zone time is over
function endZoneTime(completed=false) {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        
        // Completed true means DEFINED time setting, in this case pomoStatus doesn't change 
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


// Notify user with messages to indicate end of zone or break time
function notify(msg) {
    chrome.notifications.create({
        iconUrl: "test.png",
        type: "basic",
        title: "Focus Helper and Studdy Logger",
        message: msg,
        buttons: [
          { title: "Keep it Flowing." }
        ],
        priority: 0
      });
}

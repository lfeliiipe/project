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
                pomoTimeouts: [],
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

    });
    
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


// Listen for messages
let timeout = 0;
chrome.runtime.onMessage.addListener((inZone, sender, sendResponse) => {

    console.log("mensagem recebida de: ", sender);
    // Clear defined routine timeout
    if(inZone.isCompleted && inZone.timeSetting === "defined") {
        clearTimeout(timeout);
        sendResponse({b: 1});
        return;
    }

    // Clear pomodoro timeouts
    else if(inZone.isCompleted && inZone.timeSetting === "pomodoro") {
        for(let i = 0, len = inZone.pomoTimeouts.length; i < len; i++) {
            clearTimeout(inZone.pomoTimeouts[i]);
            sendResponse({b: 2});
        }
        return;
    }

    // Set timers based on time setting
    switch(inZone.timeSetting) {
        case "defined":
            definedRoutine(inZone);
            sendResponse({a: 1});
            break;
        
        case "pomodoro":
            pomodoroRoutine(inZone);
            sendResponse({a: 2});
            break;

        default:
            break;
    }
    
});


function pomodoroRoutine(inZone) {

    // Declare variables 
    let breakMinutes = inZone.pomoSettings.breakMinutes;
    let zoneMinutes = inZone.pomoSettings.zoneMinutes;
    let zoneSeconds = zoneMinutes * 60;
    let cicles = inZone.pomoSettings.cicles;
    let cicleMinutes = breakMinutes + zoneMinutes;
    let cicleSeconds = cicleMinutes * 60;
    let periods = cicles * 2;

    // Set first period on (first zone time)
    inZone.pomoStatus[0] = "zone";
    chrome.storage.sync.set({ inZone });

    // Set timeouts dates to sync with zone page
    const now = new Date();
    const blank = new Date();

    // Set timeouts to change settings when its zone time or break time
    for(let i = 0, j = 0; i < periods; i += 2, j++) {

        // End of ZONE TIME
        // Set background timeout
        inZone.pomoTimeouts[i] = setTimeout(() => {
            inZone.isOn = false;
            inZone.pomoStatus[i + 1] = "break";
            chrome.storage.sync.set({ inZone });
            console.log("END OF ZONE TIME");
        }, ((j * cicleSeconds) + zoneSeconds) * 1000);

        // Set timeout dates to sync with zone page
        blank.setTime(now.getTime() + (((j * cicleSeconds) + zoneSeconds) * 1000));
        inZone.pomoDates[i] = blank.toString();


        // End of LAST BREAK TIME   
        // Set background timeout
        if(i + 1 === periods - 1) {
            inZone.pomoTimeouts[i + 1] = setTimeout(() => {
                inZone.isOn = false;
                inZone.isCompleted = true;
                inZone.started = false;
                inZone.pomoStatus[i + 2] = "end";
                chrome.storage.sync.set({ inZone });
                console.log("END OF POMODORO");
            }, ((j * cicleSeconds) + cicleSeconds) * 1000);

            // Set timeout dates to sync with zone page
            blank.setTime(now.getTime() + (((j * cicleSeconds) + cicleSeconds) * 1000));
            inZone.pomoDates[i + 1] = blank.toString();
        }
        
        // End of REGULAR BREAK TIME
        // Set background timeout
        else {
            inZone.pomoTimeouts[i + 1] = setTimeout(() => {
                inZone.isOn = true;
                inZone.pomoStatus[i + 2] = "zone";
                chrome.storage.sync.set({ inZone });
                console.log("END OF BREAK TIME");
            }, ((j * cicleSeconds) + cicleSeconds) * 1000);

            // Set timeout dates to sync with zone page
            blank.setTime(now.getTime() + (((j * cicleSeconds) + cicleSeconds) * 1000));
            inZone.pomoDates[i + 1] = blank.toString();
        }
    }

    // Update changes to storage API
    chrome.storage.sync.set({ inZone });

}


function definedRoutine(inZone) {
    const now = new Date();
    const endDate = Date.parse(inZone.endDateTime);
    let totalSeconds = Math.trunc(endDate / 1000) - Math.trunc(now.getTime() / 1000);

    timeout = setTimeout(endRoutine(inZone), totalSeconds * 1000);
}


function endRoutine(inZone) {
    return () => {
        console.log("ENTROU NA FUNCTION ENDROUTINE");
        inZone.isOn = false;
        inZone.isCompleted = true;
        chrome.storage.sync.set({ inZone });
    }  
}
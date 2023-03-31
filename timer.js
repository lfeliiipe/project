// Import time related functions
import { getDurationVariables, durationToString, uploadSession, resetStorageObjs, notify } from "./helpers.js";

let interval = 0;
const div_time = document.getElementById("div_time");
const session_info = document.getElementById("session_info");
async function main(changes) {

    // Retrieve inzone object from storage API
    const { inZone } = await chrome.storage.sync.get("inZone");

    // Prevent double call
    if ((!changes?.inZone?.oldValue?.started && changes?.inZone?.newValue?.started) || (!changes && !interval)) {
        
        // Show zone mode
        updateZoneStatus();

        // Show information about the session
        showSessionInfo(inZone);

        // Set timers based on time settings
        switch(inZone.timeSetting) {
            case "undefined":
                undefinedRoutine(inZone);
                break;
            case "pomodoro":
                pomodoroRoutine(inZone);
                break;
            case "defined":
                definedRoutine(inZone);
                break;
            default:
                break;
        }
    }
}

// Turn zone mode off using button
const zoneOff = document.getElementById("zoneOff");
zoneOff.addEventListener("click", finishSession);

// Call functions to react to storage changes
chrome.storage.sync.onChanged.addListener((changes) => {
    createPeriods(0, 0, 0, changes);
    finishSession(changes);
    updateZoneStatus(changes);
    main(changes);
})


// Calculate and display time for undefined time setting
function undefinedRoutine(inZone) {
    
    // Show timer 
    routine();

    // Zone interval timer
    interval = setInterval(routine, 1000);

    function routine() {
        
        // Store hours, minutes and seconds since user is in the zone in variables
        const now = new Date();
        const t = getDurationVariables(now.toString(), inZone.startDateTime);
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);
    }
}


// Calculate and display timers for pomodoro time setting
function pomodoroRoutine(inZone) {

    // Create periods nodes
    let currentPeriod = inZone.pomoStatus.length - 1;
    let periods = inZone.pomoSettings.cicles * 2;
    createPeriods(periods, currentPeriod, "create");

    // Show timer
    routine();

    // Set interval to display pomdoro timers
    interval = setInterval(function pomodoroTimer() {

        // Show zone mode
        updateZoneStatus();

        // Show timer
        const t = routine();
        let h = t[0], m = t[1], s = t[2];

        // (Base Case) Stop the interval when the current period is over and there's no more periods to count
        if (s == 0 && m == 0 && h == 0 && currentPeriod >= inZone.pomoDates.length - 1) {
            createPeriods(0, 0, "create");
            clearInterval(interval);
            interval = 0;
            updateZoneStatus();
        }

        // (Recursive case) Call itself when period is over and update current period and periods nodes
        else if (s == 0 && m == 0 && h == 0 && currentPeriod <= inZone.pomoDates.length - 1) {
            currentPeriod++;
            createPeriods(periods, currentPeriod, "update");
            pomodoroTimer();
        }
    }, 1000);

    function routine() {

        // Get hour, minute and second to the end of the period in variables
        const now = new Date();
        const t = getDurationVariables(inZone.pomoDates[currentPeriod], now.toString());
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);

        return t;
    }
}


// Create and update pomodoro period indicator
async function createPeriods(periods, currentPeriod, mode, changes=undefined) {

    // Show div when a session is started
    const div_periods = document.getElementById("div_periods");
    const { inZone } = await chrome.storage.sync.get("inZone");
    if (changes?.inZone?.newValue?.started || inZone?.started) {
        div_periods.style.display = "block";
    }

    // Hide div periods when a session is not started
    else if (!changes?.inZone?.newValue?.started && !inZone?.started) {
        div_periods.style.display = "none";
        div_periods.innerHTML = "";
    }
    
    // Create dots to indicate current period in pomodoro session
    const unchecked = "rounded-circle p-2 m-1 bg-light";
    const checked = "rounded-circle p-2 m-1 bg-dark-subtle";
    const checking = "rounded-circle p-2 m-1 border border-4 border-dark-subtle bg-light";
    if (mode === "create") {
        div_periods.innerHTML = "";
        for (let i = 0; i < periods; i++) {
            const button = document.createElement("button");
            button.className = unchecked;
            button.disabled = true;
            if (i < currentPeriod) {
                button.className = checked;
            } else if (i == currentPeriod) {
                button.className = checking;
            }
            div_periods.appendChild(button);
        }
    }

    // Update periods
    else if (mode === "update") {
        for (let i = 0; i < periods; i++) {
            if (i < currentPeriod) {
                div_periods.childNodes[i].className = checked;
            } else if (i == currentPeriod) {
                div_periods.childNodes[i].className = checking;
            }
        }
    }
}


// Calculate and display time for defined time setting
function definedRoutine(inZone) {

    // Show timer
    routine();

    // Zone interval timer
    interval = setInterval(function() {

        // Show timer
        const t = routine();
        let h = t[0], m = t[1], s = t[2];

        // Stop timer when time is over
        if (s <= 0 && m <= 0 && h <= 0) {
            clearInterval(interval);
            interval = 0;
            updateZoneStatus();
        }
    }, 1000);

    function routine() {

        // Store hours, minutes and seconds to the end of zone time in variables
        const now = new Date();
        const t = getDurationVariables(inZone.endDateTime, now.toString());
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);

        return t;
    }
}


// Stop timers using button
async function finishSession(changes) {

    console.log("this: ", this);

    // Onclick behavior
    if (this?.id === "zoneOff") {
        
        // Prevent uploading empty session
        const { inZone } = await chrome.storage.sync.get("inZone"); 
        if (!inZone?.started) {
            return;
        }

        // Update session info
        const d = new Date();
        inZone.endDateTime = d.toString();
        inZone.isOn = false;
        inZone.isCompleted = true;
        inZone.stopped = true;
        chrome.storage.sync.set({ inZone });
        
        // Stop timers
        clearInterval(interval);
        interval = 0;
        durationToString(0, 0, 0, div_time);
        chrome.alarms.clearAll();

        // Show zone mode
        updateZoneStatus();

        // Notify end of session
        notify("Session is over!");

        // Upload to drive if user authorized and reset inZone
        const userInfo = await chrome.storage.session.get();
        if (userInfo?.authorized){
            await uploadSession();
        }
        else if (!userInfo?.authorized) {
            await resetStorageObjs("inZone");
        }
    }

    // Show button when a session starts
    else if (changes?.inZone?.newValue?.started && !changes?.inZone?.oldValue?.started) {
        console.log("mostrou botao     changes: ", changes);
        zoneOff.className = zoneOff.className.replace(" d-none", "");
    }

    // Hide button when a session is not started
    else if (!changes?.inZone?.newValue?.started && changes?.inZone?.oldValue?.started) {
        console.log("escondeu botao     changes: ", changes);
        zoneOff.className += " d-none";
    }
}


// Show information about the session
function showSessionInfo(inZone) {
    session_info.innerHTML = "<span>Session Name: " + inZone.sessionName + " </span>" +
                             "<span>Session Type: " + inZone.timeSetting + " </span>";
}


// Update text to indicate to users if they are in zone time, break or finished sesison
async function updateZoneStatus(changes) {

    if (!changes) {
        const { inZone } = await chrome.storage.sync.get("inZone");
        const zoneStatus = document.getElementById("zone_status");
        if(inZone.isCompleted) {
            zoneStatus.innerHTML = "You've finished ";
            zoneStatus.setAttribute("aria-expanded", "false");
            div_time.style.display = "none";
            div_periods.style.display = "none";
        } else if(inZone.started && !inZone.isOn) {
            zoneStatus.innerHTML = ">> <b><i>BREAK</i></b> << Time";
        } else if(inZone.started && inZone.isOn) {
            zoneStatus.innerHTML = "You're in the >> <b><i>ZONE</i></b> <<";
        } else if(!inZone.started) {
            zoneStatus.style.display = "none";
        } 

        if (inZone.started) {
            zoneStatus.style.display = "block";
            div_periods.style.display = "block";
            div_time.style.display = "block";
        }
    }
}


// Execute main function
main();

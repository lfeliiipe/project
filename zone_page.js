// Import time related functions
import { getDurationVariables, durationToString, uploadSession } from "./helpers.js";

let interval = 0;
const div_time = document.getElementById("div_time");
const session_info = document.getElementById("session_info");
chrome.storage.sync.get("inZone", ({ inZone }) => {

    // Show zone mode
    updateZoneStatus();

    // Show information about the session
    showSessionInfo(inZone);
    
    // Turn zone mode off using button
    document.getElementById("zoneOff").addEventListener("click", finishSession(inZone));

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
});


// Calculate and display time for undefined time setting
function undefinedRoutine(inZone) {
    
    // Zone interval timer
    interval = setInterval(function() {
        
        // Store hours, minutes and seconds since user is in the zone in variables
        const now = new Date();
        const t = getDurationVariables(now.toString(), inZone.startDateTime);
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);
    }, 1000);
}


// Calculate and display timers for pomodoro time setting
function pomodoroRoutine(inZone) {

    // Create periods nodes
    let currentPeriod = inZone.pomoStatus.length - 1;
    let periods = inZone.pomoSettings.cicles * 2;
    createPeriods(periods, currentPeriod, "create");

    // Set interval to display pomdoro timers
    interval = setInterval(function pomodoroTimer() {

        // Show zone mode
        updateZoneStatus();

        // Get hour, minute and second to the end of the period in variables
        const now = new Date();
        const t = getDurationVariables(inZone.pomoDates[currentPeriod], now.toString());
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);

        // (Base Case) Stop the interval when the current period is over and there's no more periods to count
        if (s == 0 && m == 0 && h == 0 && currentPeriod >= inZone.pomoDates.length - 1) {
            updateZoneStatus();
            clearInterval(interval);
        }

        // (Recursive case) Call itself when period is over and update current period and periods nodes
        else if (s == 0 && m == 0 && h == 0 && currentPeriod <= inZone.pomoDates.length - 1) {
            currentPeriod++;
            createPeriods(periods, currentPeriod, "update");
            pomodoroTimer();
        }
    }, 1000);

}


// Create and update pomodoro period indicator
function createPeriods(periods, currentPeriod, mode) {

    let div_periods = document.getElementById("div_periods");
    if (mode === "create") {
        for(let i = 0; i < periods; i++) {
            const checkbox = document.createElement("input");
            checkbox.type = "radio";
            checkbox.disabled = true;
            if(i <= currentPeriod) {
                checkbox.checked = true;
            }
            div_periods.appendChild(checkbox);
        }
    }

    else if (mode === "update") {
        for(let i = 0; i < periods; i++) {
            if(i <= currentPeriod) {
                div_periods.childNodes[i].checked = true;
            }
        }
    }
    
}


// Calculate and display time for defined time setting
function definedRoutine(inZone) {

    // Zone interval timer
    interval = setInterval(function() {

        // Store hours, minutes and seconds to the end of zone time in variables
        const now = new Date();
        const t = getDurationVariables(inZone.endDateTime, now.toString());
        let h = t[0], m = t[1], s = t[2];

        // Display timer
        durationToString(h, m, s, div_time);

        // Stop timer when time is over
        if (s == 0 && m == 0 && h == 0) {
            clearInterval(interval);
            updateZoneStatus();
        }
    }, 1000);
}


// Stop timers using button
function finishSession(inZone) {
    return async function() {

        // Update inZone 
        const d = new Date();
        inZone.endDateTime = d.toString();
        inZone.isOn = false;
        inZone.isCompleted = true;
        inZone.stopped = true;
        chrome.storage.sync.set({ inZone });
        
        // Stop timers
        clearInterval(interval);
        durationToString(0, 0, 0, div_time);
        chrome.alarms.clearAll();

        // Show zone mode
        updateZoneStatus();

        // Upload to drive
        await uploadSession();
    }
}


// Show information about the session
function showSessionInfo(inZone) {
    session_info.innerHTML = "<span>Session Name: " + inZone.sessionName + " </span>" +
                             "<span>Session Type: " + inZone.timeSetting + " </span>";
}


// Update text to indicate to users if they are in zone time, break or finished sesison
function updateZoneStatus() {

    chrome.storage.sync.get("inZone", ({ inZone }) => {

        const zoneStatus = document.getElementById("zone_status");
        if(inZone.isCompleted) {
            zoneStatus.innerHTML = "You've finished ";
            document.getElementById("div_time").style.display = "none";
            div_periods.style.display = "none";
            document.getElementById("zoneOff").disabled = "true";
        } else if(inZone.started && !inZone.isOn) {
            zoneStatus.innerHTML = ">> <b><i>BREAK</i></b> << Time";
        } else if(inZone.started && inZone.isOn) {
            zoneStatus.innerHTML = "You're in the >> <b><i>ZONE</i></b> <<";
        } else if(!inZone.started) {
            zoneStatus.style.display = "none";
        } 
    });
}

// Enable link to zone page when zone time is started
const timer_img = document.getElementById("timer_img");
chrome.storage.sync.get("inZone", ({ inZone }) => {
    if(inZone.started) {
        timer_img.parentElement.classList.remove("disabled");
    }
});


// Display block list in a div element
const list_collapse = document.getElementById("list_collapse");
function showList() {

    // Get blockList from storage variable
    chrome.storage.sync.get("blockList", ({ blockList }) => {

        // Create block list table rows
        const len = blockList.length;
        if (!len) return;

        // Create and append nodes with blocked sites
        for (let i = 0; i < len; i++) {

            appendSite(blockList[i], i);
        }

        // // Add click events to remove websites' collapses and delete buttons
        // for (let i = 0; i < len; i++) {
        //     document.getElementById("div" + i).addEventListener("hidden.bs.collapse", deleteCollapse);
        //     document.getElementById("button" + i).addEventListener("click", hideButton);
        // }
                
    });
}
showList();


// Hide delete button at collapse
function hideButton () {
    this.style.display = "none";
}


// Hide zoneButton when radio buttons are not checked
const zoneButton = document.getElementById("zoneButton");
const und = document.getElementById("und_radio");
const pomo = document.getElementById("pomo_radio");
const def = document.getElementById("def_radio");
if (!und.checked && !pomo.checked && !def.checked) {
    zoneButton.style.display = "none";
}


// Add listeners on radio buttons
const inputs = document.getElementsByTagName("input");
async function updateRadios () {

    // Retrieve data from storage 
    const { inZone } = await chrome.storage.sync.get("inZone");
    for (const input of inputs) {
        if (input.type === "radio" && input.name.includes("set_time")) {

            // Disable radio buttons in zone mode
            if(inZone.started) input.disabled = true;
    
            input.onchange = showSettings;
        }
    }
}
updateRadios();


// Hide divs
const div_pomodoro = document.getElementById("div_pomodoro");
const div_defined = document.getElementById("div_defined");
div_pomodoro.style.display = "none";
div_defined.style.display = "none";

// Display settings when any radio button is clicked
async function showSettings() {

    // Display time settings
    switch(this.id) {
        case "und_radio":
            div_pomodoro.style.display = "none";
            div_defined.style.display = "none";
            zoneButton.style.display = "block";
            break;
        
        case "pomo_radio":
            div_pomodoro.style.display = "block";
            div_defined.style.display = "none";
            zoneButton.style.display = "block";
            break;
        
        case "def_radio":
            div_pomodoro.style.display = "none";
            div_defined.style.display = "block";
            zoneButton.style.display = "block";
            break;
    }
}

// Remove websites from block list
function deleteCollapse() {

    // Search and remove a specific website from the list
    const deleteSite = this.title.toLowerCase();

    chrome.storage.sync.get("blockList", ({ blockList }) => {

        // Remove website from storage api
        let len = blockList.length;
        for (let i = 0; i < len; i++) {
            if (blockList[i] === deleteSite) {
                
                blockList.splice(i, 1);
                chrome.storage.sync.set({ blockList });

                // Remove website div from block list
                this.remove();
            }
        }
    });
}


// When the button is clicked update inZone and fileSettings object
zoneButton.addEventListener("click", () => {

    // inZone updates
    chrome.storage.sync.get("inZone", async ({ inZone }) => {

        // Quit in case of double starting
        if (inZone.started) return;
        
        // Turn zone on
        inZone.isOn = true;
        inZone.isCompleted = false;
        inZone.started = true;
        
        // Save time setting
        let timeSetting = "";
        if (und.checked) {
            timeSetting = "undefined";
        } else if (pomo.checked) {
            timeSetting = "pomodoro";
        } else if (def.checked) {
            timeSetting = "defined";
        }
        inZone.timeSetting = timeSetting;

        // Save start date and time
        const date = new Date();
        inZone.startDateTime = date.toString();

        // Calculate end time based on time settings
        let milis = 0;
        const endDate = new Date();
        switch (inZone.timeSetting) {

            case "pomodoro":
                let zoneMinutes = parseInt(document.getElementById("zone_minutes").value);
                let breakMinutes = parseInt(document.getElementById("break_minutes").value);
                let cicles = parseInt(document.getElementById("sessions").value);
                let cicleMinutes = zoneMinutes + breakMinutes;
                milis = cicles * cicleMinutes * 60 * 1000;
                endDate.setTime(date.getTime() + milis);
                inZone.endDateTime = endDate.toString();

                inZone.pomoSettings.zoneMinutes = zoneMinutes;
                inZone.pomoSettings.breakMinutes = breakMinutes;
                inZone.pomoSettings.cicles = cicles;

                // Persist changes
                chrome.storage.sync.set({ inZone });

                // Set pomodoro alarms
                createAlarm("pomodoro", [zoneMinutes, breakMinutes, cicles, inZone]);
                break;

            case "defined":
                let minutes = parseInt(document.getElementById("minutes").value);
                let hours = parseInt(document.getElementById("hours").value);
                milis = ((hours * 60) + minutes) * 60 * 1000;
                endDate.setTime(date.getTime() + milis);
                inZone.endDateTime = endDate.toString();

                inZone.definedSettings.hours = hours;
                inZone.definedSettings.minutes = minutes;
                
                // Persist changes
                chrome.storage.sync.set({ inZone });

                // Set alarm for defined time setting
                createAlarm("defined", [hours, minutes]);   
                break;
        }
        
        // Filter user input to save session name
        let sessionName = document.getElementById("session_label").value;
        sessionName = sessionName.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"").trim();
        inZone.sessionName = sessionName;

        // Persist changes
        chrome.storage.sync.set({ inZone });

        // Update fileSettings lastSessionName
        const { fileSettings } = await chrome.storage.sync.get("fileSettings");
        fileSettings.lastSessionName = sessionName;
        chrome.storage.sync.set({ fileSettings });

        // Redirect user to zone page
        let url = chrome.runtime.getURL("zone_page.html");
        location.assign(url);
    });
});


// Calculate and set alarms for DEFINED and POMODORO time settings
function createAlarm(type, values) {
    
    // Create alarm for time setting DEFINED
    if(type === "defined") {

        // Organzize variables
        let hours = values[0], minutes = values[1];

        // Create alarm
        chrome.alarms.create(type, {delayInMinutes: minutes + (hours * 60)});
    } 
    
    // Create alarms for time setting POMODORO
    else if(type === "pomodoro") {

        // Organize variables
        let zoneMinutes = values[0], breakMinutes = values[1], cicles = values[2], inZone = values[3];
        let cicleMinutes = zoneMinutes + breakMinutes;
        let periods = cicles * 2;

        // Set first period on (first zone time)
        inZone.pomoStatus[0] = "zone";
        const now = new Date(Date.parse(inZone.startDateTime));
        const blank = new Date();
        
        // Create different alarms for zone time, break time and last break time
        for(let i = 0, j = 0; i < periods; i += 2, j++) {

            // END of ZONE TIME alarms
            chrome.alarms.create("pomo " + i.toString(), {delayInMinutes: (j * cicleMinutes) + zoneMinutes});
            
            // END of BREAK TIME alarms (the last break has a hint in its name)
            let breakString = (i + 1 == periods - 1) ? "pomo last" : "pomo " + (i + 1).toString();
            chrome.alarms.create(breakString, {delayInMinutes: (j * cicleMinutes) + cicleMinutes});

            // Set END of ZONE TIME dates to inZone object
            blank.setTime(now.getTime() + ((j * cicleMinutes * 60) + (zoneMinutes * 60)) * 1000);
            inZone.pomoDates[i] = blank.toString();

            // Set END of BREAK TIME dates to inZone object
            blank.setTime(now.getTime() + ((j * cicleMinutes * 60) + (cicleMinutes * 60)) * 1000);
            inZone.pomoDates[i + 1] = blank.toString();
        }

        // Persist changes
        chrome.storage.sync.set({ inZone });
    }
}


// Add sites to block list when button is clicked
let form1 = document.getElementById("form1");
form1.addEventListener("submit", function (event) {

    // Prevent page reloading
    event.preventDefault();

    // Filter characters from user input
    const input1 = document.getElementById("input1");
    let value = input1.value.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"").trim().toLowerCase();

    // Make sure field is not empty
    if (!value) {
        return;
    }

    chrome.storage.sync.get("blockList", ({ blockList }) => {

        // Check if value already in the list
        for (let i = 0, len = blockList.length; i < len; i++) {
            if (blockList[i] === value) {
                alert(blockList[i] + " already in the block list!");
                input1.value = "";
                return;
            }
        }
        
        // Update list
        blockList.push(value);
        chrome.storage.sync.set({ blockList });

        // Update div to show block list
        const list = document.querySelectorAll(".site-collapse");
        let index = list.length > 0 ? parseInt(list[list.length - 1].id.split("v")[1]) + 1: 0;
        appendSite(value, index);

        input1.value = "";
    });
});


// Append new website node to block list
function appendSite(site, i) {

    // Create a div with website name and delete button
    const div = document.createElement("div");
    div.id = "div" + i;
    div.className = "row border-2 border-end border-bottom rounded p-2 m-3 " +
                    "collapse collapse-horizontal show shadow-lg site-collapse";
    div.title = site;
    div.addEventListener("hidden.bs.collapse", deleteCollapse);
    list_collapse.appendChild(div);

    // Create inner div with website name in a span
    const span_div = document.createElement("div");
    span_div.className = "col-6";
    div.appendChild(span_div);

    const span = document.createElement("span");
    const maxChar = 15;
    span.className = "align-middle";
    span.innerHTML = site.length > maxChar ? site.slice(0, maxChar) + "..." : site;
    span_div.appendChild(span);

    // Create inner div with delete button
    const button_div = document.createElement("div");
    button_div.className = "col-6";
    div.appendChild(button_div);

    const delButton = document.createElement("button");
    delButton.innerHTML = "Delete";
    delButton.id = "button" + i;
    delButton.title = "Remove from block list"
    delButton.className = "btn btn-danger float-end";
    delButton.setAttribute("data-bs-toggle", "collapse");
    delButton.setAttribute("data-bs-target", "#div" + i);
    delButton.setAttribute("aria-controls", "div" + i);
    delButton.addEventListener("click", hideButton);
    button_div.appendChild(delButton);
}


// Add last session name to session name field
document.addEventListener("DOMContentLoaded", async () => {
    const { fileSettings } = await chrome.storage.sync.get("fileSettings");
    const session_label = document.getElementById("session_label");
    
    if (fileSettings.lastSessionName) {
        session_label.value = fileSettings.lastSessionName;
    }
});


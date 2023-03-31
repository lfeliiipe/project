// Load important functions
function main() {
    showList();
    updateRadios();
    hideTimeDivs();
    rememberSession();
}


// Display block list in a div element
const list_collapse = document.getElementById("list_collapse");
chrome.storage.sync.onChanged.addListener(showList);
function showList(changes) {
    
    // Page load (List all items)
    if (!changes) {

        // Get blockList from storage variable
        chrome.storage.sync.get("blockList", ({ blockList }) => {

            // Create and append nodes with blocked sites
            for (let i = 0, len = blockList.length; i < len; i++) {
                appendSite(blockList[i], i);
            }                
        });
    }

    // Add new item(s)
    const site_divs = document.querySelectorAll(".site-collapse");
    if (changes?.blockList?.newValue.length > changes?.blockList?.oldValue.length) {

        // Add new values in an array
        const toAdd = [];
        for (let i = 0, len = changes.blockList.newValue.length; i < len; i++) {
            let belongs = false;
            for (let j = 0, l = changes.blockList.oldValue.length; j < l; j++) {
                if (changes.blockList.newValue[i] === changes.blockList.oldValue[j]) {
                    belongs = true;
                    break;
                }
            }

            if (!belongs) {
                toAdd.push(changes.blockList.newValue[i]);
            }
        }

        // Append new div for every new item in the block list
        let index = site_divs.length > 0 ? parseInt(site_divs[site_divs.length - 1].id.split("v")[1]) + 1: 0;
        for (let i = 0, len = toAdd.length; i < len; i++) {
            appendSite(toAdd[i], index + i);
        }
    }

    // Remove item(s)
    else if (changes?.blockList?.oldValue.length > changes?.blockList?.newValue.length) {

        // Add old items to an array
        const toRemove = [];
        for (let i = 0, len = changes.blockList.oldValue.length; i < len; i++) {
            let belongs = false;
            for (let j = 0, l = changes.blockList.newValue.length; j < l; j++) {
                if (changes.blockList.oldValue[i] === changes.blockList.newValue[j]) {
                    belongs = true;
                    break;
                }
            }

            if (!belongs) {
                toRemove.push(changes.blockList.oldValue[i]);
            }
        }

        // Remove divs
        for (let i = 0, len = site_divs.length; i < len; i++) {
            for (let j = 0, l = toRemove.length; j < l; j++) {
                if (site_divs[i].title === toRemove[j]) {
                    site_divs[i].remove();
                }
            }
        }
    }
}


// Hide divs and zone button
const zoneButton = document.getElementById("zoneButton");
const und = document.getElementById("und_radio");
const pomo = document.getElementById("pomo_radio");
const def = document.getElementById("def_radio");
const div_pomodoro = document.getElementById("div_pomodoro");
const div_defined = document.getElementById("div_defined");
chrome.storage.sync.onChanged.addListener(hideTimeDivs);
function hideTimeDivs(changes) {
    if (!changes && !und.checked && !pomo.checked && !def.checked || changes?.inZone?.newValue?.started) {
        zoneButton.style.display = "none";
        div_pomodoro.style.display = "none";
        div_defined.style.display = "none";    
    }
}


// Add listeners on radio buttons
const inputs = document.querySelectorAll("input[name='set_time']");
chrome.storage.sync.onChanged.addListener(updateRadios);
function updateRadios (changes) {

    // When the function is called explicitly
    if (!changes?.inZone) {

        // Retrieve data from storage
        chrome.storage.sync.get("inZone", ({ inZone }) => {

            // Disable radio buttons in zone mode
            for (const input of inputs) {
                if(inZone.started) {
                    input.disabled = true;
                    input.checked = false;
                }
        
                // Add listener to inputs
                input.onchange = showSettings;
            }
        })
    }

    // Disable radios when a session is started
    else if (changes?.inZone?.newValue?.started) {
        for (const input of inputs) {
            input.disabled = true;
            input.checked = false;
        }
    }

    // Enable radios when a session is completed
    else if (!changes?.inZone?.newValue?.started) {
        for (const input of inputs) {
            input.disabled = false;
        }
    }
}


// Display settings when any radio button is clicked
function showSettings() {

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
zoneButton.addEventListener("click", async (event) => {

    // Prevent page from reloading
    event.preventDefault();

    // inZone updates
    const { inZone } = await chrome.storage.sync.get("inZone");

    // Prevent double starting
    if (inZone.started) return;

    // Prevent not allowed setting values
    const zone_minutes = document.getElementById("zone_minutes");
    const break_minutes = document.getElementById("break_minutes");
    const sessions = document.getElementById("sessions");
    const d_minutes = document.getElementById("minutes");
    const d_hours = document.getElementById("hours");
    let zoneMinutes = 0;
    let breakMinutes = 0;
    let cicles = 0;
    let minutes = 0;
    let hours = 0;
    try {
        zoneMinutes = parseInt(zone_minutes.value);
        breakMinutes = parseInt(break_minutes.value);
        cicles = parseInt(sessions.value);
        minutes = parseInt(d_minutes.value);
        hours = parseInt(d_hours.value);
        if ((pomo.checked && (!zoneMinutes || !breakMinutes || !cicles)) || (def.checked && (!minutes && !hours))) {
            alert("Not allowed");
            console.log("if do try");
            return;
        }
    }
    catch {
        console.log("caiu no catch");
        alert("Not Allowed");
        return;
    }
    
    // Turn zone session on
    inZone.isOn = true;
    inZone.isCompleted = false;
    inZone.started = true;
    
    // Save time setting
    if (und.checked) {
        inZone.timeSetting = "undefined";
    } else if (pomo.checked) {
        inZone.timeSetting = "pomodoro";
    } else if (def.checked) {
        inZone.timeSetting = "defined";
    }

    // Save start date and time
    const date = new Date();
    inZone.startDateTime = date.toString();

    // Calculate end time based on time settings
    let milis = 0;
    const endDate = new Date();
    switch (inZone.timeSetting) {

        case "pomodoro":

            // End time for pomodoro
            let cicleMinutes = zoneMinutes + breakMinutes;
            milis = cicles * cicleMinutes * 60 * 1000;
            endDate.setTime(date.getTime() + milis);
            inZone.endDateTime = endDate.toString();

            // Pomodoro important data
            inZone.pomoSettings.zoneMinutes = zoneMinutes;
            inZone.pomoSettings.breakMinutes = breakMinutes;
            inZone.pomoSettings.cicles = cicles;

            // Persist changes
            chrome.storage.sync.set({ inZone });

            // Set pomodoro alarms
            createAlarm("pomodoro", [zoneMinutes, breakMinutes, cicles, inZone]);
            break;

        case "defined":

            // End time for defined
            milis = ((hours * 60) + minutes) * 60 * 1000;
            endDate.setTime(date.getTime() + milis);
            inZone.endDateTime = endDate.toString();

            // Defined important data
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
    const escape = /([^a-z0-9\.\/:,#_-]|^[\/\'\":#;.\*])/igm;
    sessionName = sessionName.replace(escape, "").trim();
    inZone.sessionName = sessionName;

    // Persist changes
    chrome.storage.sync.set({ inZone });

    // Update fileSettings lastSessionName
    const { fileSettings } = await chrome.storage.sync.get("fileSettings");
    fileSettings.lastSessionName = sessionName;
    chrome.storage.sync.set({ fileSettings });

    // Slide to second carousel
    const carousel = new bootstrap.Carousel(document.querySelector("#carousel_main"));
    carousel.to(1);
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


// Add sites to block list
let form1 = document.getElementById("form1");
form1.addEventListener("submit", function (event) {

    // Prevent page reloading
    event.preventDefault();

    // Filter characters from user input
    const input1 = document.getElementById("input1");
    const escape = /([^a-z0-9\.\/:,#_-]|^[\/\'\":#;.\*])/igm;
    let value = input1.value.replace(escape, "").trim().toLowerCase();

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

        // Clear text box
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
    span_div.className = "col-6 align-self-center";
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
    delButton.addEventListener("click", function() {this.style.display = "none"});
    button_div.appendChild(delButton);
}


// Add last session name to session name field
async function rememberSession() {
    const { fileSettings } = await chrome.storage.sync.get("fileSettings");
    const session_label = document.getElementById("session_label");
    
    if (fileSettings.lastSessionName) {
        session_label.value = fileSettings.lastSessionName;
    }
    else {
        session_label.value = "Session";
    }
}


// Execute main functions
main();

// Import login/authentication related functions
import { tokenRequired, initCache } from "./oauth.js";

// Append link to zone page when zone time is on
const zone_page_link = document.getElementById("zone_page_link");
chrome.storage.sync.get("inZone", ({ inZone }) => {
    if(inZone.started) {
        const zp_link = document.createElement("a");
        zp_link.href = "zone_page.html";
        zp_link.innerHTML = "ZONE TIMER";
        zone_page_link.appendChild(zp_link);
    }
});


// Display block list in a div element
let listDiv = document.getElementById("listDiv");
function showList() {

    // Get blockList from storage variable
    chrome.storage.sync.get("blockList", ({ blockList }) => {

        // Create block list header
        const len = blockList.length;
        if (len > 0) {
            let p = document.createElement("p");
            let pText = document.createTextNode("BLOCK LIST");
            p.appendChild(pText);
            p.style.textAlign = "center";
            p.style.backgroundColor = "white";
            listDiv.appendChild(p);
        }

        // Create and append nodes with blocked sites
        for (let i = 0; i < len; i++) {
            
            // Create a div for span with website name and delete button
            const div = document.createElement("div");
            div.id = "div" + i;
            listDiv.appendChild(div);

            // Create span with website from block list
            const span = document.createElement("span");
            const spanText = document.createTextNode(blockList[i].toUpperCase());
            span.appendChild(spanText);
            div.appendChild(span);

            // Create delete button
            const delButton = document.createElement("button");
            const delButtonText = document.createTextNode("Delete");
            delButton.appendChild(delButtonText);
            delButton.id = "button" + i;
            delButton.style.backgroundColor = "red";
            div.appendChild(delButton);
        }

        // Add click events to buttons
        for (let i = 0; i < len; i++) {
            document.getElementById("button" + i).addEventListener("click", deleteButton);
        }
    });
}
showList();


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
function deleteButton() {

    // Search and remove a specific website from the list
    const deleteSite = this.previousSibling.innerHTML.toLowerCase();
    chrome.storage.sync.get("blockList", ({ blockList }) => {

        let len = blockList.length;
        for (let i = 0; i < len; i++) {
            if (blockList[i] === deleteSite) {
                blockList.splice(i ,1);
            }
        }
        chrome.storage.sync.set({ blockList });

        // Update the page's html
        removeNodes(listDiv);
        showList();
    });
}


// Remove all child nodes from an element
function removeNodes(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}


// When the button is clicked update inZone and fileSettings object
zoneButton.addEventListener("click", async () => {

    // inZone updates
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        
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
        inZone.sessionName = sessionName.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"").trim();

        // Persist changes
        chrome.storage.sync.set({ inZone });

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
form1.addEventListener("submit", function () {

    // Filter characters from user input
    let value = document.getElementById("input1").value.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"").trim();

    // Make sure field is not empty
    if (value === "") {
        return;
    }

    // Remove old nodes from listDiv
    removeNodes(listDiv);
    
    chrome.storage.sync.get("blockList", ({ blockList }) => {
        
        // Update list
        blockList.push(value);
        chrome.storage.sync.set({ blockList });

        // Update div to show block list
        showList();
    });
});


// --- LOGIN RELATED CODE ---


// Get an authorization token from the user then load information
async function login() {

    // True parameter means authorization token request in interactive mode (initCache from oauth.js)
    await initCache(true);
    loadUserInfo();
}


// Log user out (Function decorated by tokenRequired from oauth.js)
function revokeAccess(token) {
    
    // Revoke token from google database
    fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token);

    // Remove token from cache
    chrome.identity.removeCachedAuthToken({token: token}, () => {
        alert("You have been removed");
    });

    // Remove user info from cache
    chrome.storage.session.clear();

    // Refresh page
    location.reload();
}
revokeAccess = tokenRequired(revokeAccess);
 

// Load user related info
async function loadUserInfo() {
    
    // Populate user info from cache
    const userInfo = await chrome.storage.session.get();

    // Load content for user not logged into the extension
    if(!userInfo.logged) {
        const loginButton = document.getElementById("login_button");
        let userinfo = await chrome.identity.getProfileUserInfo({accountStatus: "ANY"});
        loginButton.innerHTML = "Login";
        loginButton.onclick = login;

        // Show option to log using the same email logged into the chrome browser
        if(userinfo.email) {
            loginButton.innerHTML += " with " + userinfo.email;
            loginButton.title = "Login using the account logged in chrome"
        }
        return;
    }

     // Load image
     const img = document.getElementById("profile_pic");
     img.src = userInfo.img;
     img.style.display = "inline";

     // Display info
     const profile_div = document.getElementById("profile_div");
     profile_div.style.display = "inline";
     profile_div.innerHTML = "<p style='display:inline'>" + userInfo.name + "</p>";

     // Change button
     const loginButton = document.getElementById("login_button");
     loginButton.innerHTML = "Logout";
     loginButton.onclick = revokeAccess;
}


// Load user info when the page finishes loading
document.addEventListener("DOMContentLoaded", loadUserInfo);
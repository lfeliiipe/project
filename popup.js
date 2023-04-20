// Import authentication related functions
import { tokenRequired, initCache, resetStorageObjs } from "./helpers.js";

// Create and append profile and navbar elements
async function main () { 
    createProfile();
    loadUserInfo();
    updateNavbar();
}
main();


function createProfile() {

    // Profile div
    const profile = document.getElementById("profile");
    profile.className = "mb-2";

    // Profile image 
    const img = document.createElement("img");
    img.className = "rounded-circle";
    img.setAttribute("aria-controls", "options");
    img.setAttribute("aria-expanded", "true");
    img.setAttribute("data-bs-target", "#options");
    img.setAttribute("data-bs-toggle", "collapse");
    img.setAttribute("id", "profile_pic");
    img.setAttribute("title", "Authorize/Revoke authorization");
    img.setAttribute("type", "button");
    profile.appendChild(img);

    // Profile name
    const kbd = document.createElement("kbd");
    kbd.className = "ms-1 d-none";
    kbd.setAttribute("id", "profile_name");
    profile.appendChild(kbd);

    // Authorization collapse
    const options = document.createElement("div");
    options.className = "collapse m-1";
    options.setAttribute("id", "options");
    profile.appendChild(options);

    const options_button = document.createElement("button");
    options_button.className = "btn btn-light";
    options_button.setAttribute("id", "authorization_button");
    options_button.setAttribute("type", "button");
    options.appendChild(options_button);
}


// Highlight current page in navbar
const navbar = document.querySelector(".nav-main");
const anchors = navbar.querySelectorAll("a");
const items = document.querySelectorAll(".carousel-item");
const carousel = document.querySelector("#carousel_main");
async function updateNavbar() {

    // Enable timer button when a session is started
    const { inZone } = await chrome.storage.sync.get("inZone");
    if (inZone?.started) {

        // Set initial page to timer page
        for (let i = 0, len = items.length; i < len; i++) {
            if (items[i].className.includes("active")) {
                items[i].className = items[i].className.replace(" active", "");
            } else if (i == 1) {
                items[i].className += " active";
            }
        }
    }

    // Update navbar on page load
    changeNav();
}


// Update navbar after slide
carousel.addEventListener("slid.bs.carousel", changeNav);


// Change navbar buttons to highlight the current slide
function changeNav() {
    
    // Control navbar style based on the carousel content
    const activeClasses = "active rounded-top border border-bottom-0";
    for (let i = 0, len = items.length; i < len; i++) {

        // Remove highlight from last button
        if (anchors[i].className.includes(activeClasses)) {
            anchors[i].className = anchors[i].className.replace(activeClasses, "");
            toggleTab(anchors[i].innerHTML.split("<")[0].trim().toLowerCase(), false);
        }

        // Highlight current button
        if (items[i].className.includes("active")) {
            anchors[i].className += " " + activeClasses;
            toggleTab(anchors[i].innerHTML.split("<")[0].trim().toLowerCase());
        }
    }
}


// Enable or disable javascript for an especific navbar tab
async function toggleTab(tab, on=true) {

    switch (tab) {
        case "timer":

            // Retrieve inzone object from storage API
            const { inZone } = await chrome.storage.sync.get("inZone");

            // Enable timer button if a session is started
            const nav_timer = document.getElementById("nav_timer");
            if (inZone?.started) {
                nav_timer.className = nav_timer.className.replace("disabled", "");
            } 
            
            // Disable timer button if a session has ended 
            else if (!inZone?.started || inZone?.isCompleted) {
                nav_timer.className += " disabled";
            }
            break;
    }


}


// --- AUTHORIZATION RELATED CODE ---


// Get an authorization token from the user then load information
async function authorize() {

    // True parameter means authorization token request in interactive mode (initCache from helpers.js)
    await initCache(true);
    loadUserInfo();
}


// Revoke authorization token (Function decorated by tokenRequired from oauth.js)
function revokeAccess(token) {
    
    // Revoke token from google database
    fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token);

    // Remove token from cache
    chrome.identity.removeCachedAuthToken({token: token}, () => {
        alert("You have been removed");
    });

    // Remove user info from cache
    chrome.storage.session.clear();

    // Reset file info
    resetStorageObjs("fileSettings");

    // Refresh page
    location.reload();
}
revokeAccess = tokenRequired(revokeAccess);
 

// Load user related info
async function loadUserInfo() {
    
    // Populate user info from cache
    const userInfo = await chrome.storage.session.get();

    // Load content for user with no authorization
    if(!userInfo.authorized) {
        const authorizationButton = document.getElementById("authorization_button");
        let userinfo = await chrome.identity.getProfileUserInfo({accountStatus: "ANY"});
        document.getElementById("profile_pic").src = "./imgs/default_picture.png"
        authorizationButton.innerHTML = "Authorize";
        authorizationButton.onclick = authorize;

        // Show option to authorize the email logged into the chrome browser
        if(userinfo.email) {
            authorizationButton.innerHTML += " with " + userinfo.email;
            authorizationButton.title = "Use your chrome browser account to log your sessions on google drive";
        }
        return;
    }

     // Load image
     const img = document.getElementById("profile_pic");
     img.src = userInfo.img;

     // Display info
     const profile_name = document.getElementById("profile_name");
     profile_name.innerHTML = userInfo.name;
     profile_name.classList.remove("d-none");
     profile_name.classList.add("d-inline");

     // Change button behavior
     const authorizationButton = document.getElementById("authorization_button");
     authorizationButton.innerHTML = "Revoke Authorization\n";
     authorizationButton.onclick = revokeAccess;
     const revoke_img = document.createElement("img");
     revoke_img.className = "icon-18-black";
     revoke_img.setAttribute("src", "./bootstrap/icons/logout.png");
     authorizationButton.appendChild(revoke_img);
}

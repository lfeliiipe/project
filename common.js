// Import login/authentication related functions
import { tokenRequired, initCache } from "./oauth.js";

// Create and append profile and navbar elements
async function main () {
    
    createProfile();
    loadUserInfo();
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
    img.setAttribute("title", "Login/Logout");
    img.setAttribute("type", "button");
    profile.appendChild(img);

    // Profile name
    const kbd = document.createElement("kbd");
    kbd.className = "ms-1 d-none";
    kbd.setAttribute("id", "profile_name");
    profile.appendChild(kbd);

    // Login/Logout collapse
    const options = document.createElement("div");
    options.className = "collapse m-1";
    options.setAttribute("id", "options");
    profile.appendChild(options);

    const options_button = document.createElement("button");
    options_button.className = "btn btn-light";
    options_button.setAttribute("id", "login_button");
    options_button.setAttribute("type", "button");
    options.appendChild(options_button);
}


// Highlight current page in navbar
function updateNavbar() {
    const navbar = document.querySelector(".nav-main");
    const anchors = navbar.querySelectorAll("a");
    const currentPage = location.pathname.split("/")[1];

    for (let a of anchors) {
        if (a.attributes.href.nodeValue === currentPage) {
            a.className += " active rounded-top border border-bottom-0";
            return;
        }
    }
}
updateNavbar();


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
        document.getElementById("profile_pic").src = "./imgs/default_picture.png"
        loginButton.innerHTML = "Login";
        loginButton.onclick = login;

        // Show option to log using the same email logged into the chrome browser
        if(userinfo.email) {
            loginButton.innerHTML += " with " + userinfo.email;
            loginButton.title = "Login using the account logged in google chrome browser"
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
     const loginButton = document.getElementById("login_button");
     loginButton.innerHTML = "Logout\n";
     loginButton.onclick = revokeAccess;
     const logout_img = document.createElement("img");
     logout_img.className = "icon-18-black";
     logout_img.setAttribute("src", "./bootstrap/icons/logout.png");
     loginButton.appendChild(logout_img);
}


// Load user info when the page finishes loading
// document.addEventListener("DOMContentLoaded", loadUserInfo);
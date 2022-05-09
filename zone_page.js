
chrome.storage.sync.get("inZone", ({ inZone }) => {
    console.log("inZone: ", inZone);
});

// Turn inZone mode off using button
const zoneOff = document.getElementById("zoneOff");
zoneOff.addEventListener("click", () => {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        inZone = false;
        hour = 0;
        minute = 0;
        second = 0;
        showTimer();
        chrome.storage.sync.set({ inZone });
        clearInterval(interval);
    });
});

// Turn off inZone mode after timeout
const timeout = setTimeout(() => {

    clearInterval(interval);
    let inZone = false;
    chrome.storage.sync.set({ inZone });
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        console.log("inZone: ", inZone);
    });

}, ((1 * 60) + 1) * 1000);


// Display timer
let hour = 0, minute = 1, second = 0;
const div_time = document.getElementById("div_time");
function showTimer() {
    div_time.innerHTML = hour.toString().padStart(2, "0") + " : " + 
                         minute.toString().padStart(2, "0") + " : " +
                         second.toString().padStart(2, "0");
}
showTimer();

// Time counting code
const interval = setInterval(() => {

    second --;
    if (second < 0) {
        second = 59;
        minute--;
    }
    if (minute < 0) {
        minute = 59;
        hour--;
    }
    if (hour < 0) {
        hour = 23;
    }

    showTimer();

}, 1000);


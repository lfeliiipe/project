// Initialize button with user's preferred color
let b1 = document.getElementById("b1");

// Change b1 color background based on storage variable inZone
function changeButtonColor() {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        if (inZone) {
            b1.style.backgroundColor = "red";
            b1.innerHTML = "IN THE ZONE";
        } else {
            b1.style.backgroundColor = "blue";
            b1.innerHTML = "GET IN THE ZONE";
        }
    });
}
changeButtonColor();

// When the button is clicked change storage variable inZone and button color
b1.addEventListener("click", function () {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        inZone = !inZone;
        chrome.storage.sync.set({ inZone });
        changeButtonColor();
    });
});

// When the button is clicked, inject setPageBackgroundColor into current page
b1.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: blockSites,
    });
});
  
// The body of this function will be executed as a content script inside the
// current page
function blockSites() {
    chrome.storage.sync.get("blackList", ({ blackList }) => {
        // Check if the current page is not in the black list
        blackList.forEach(function (value) {
            alert("item: " + value + " da blacklist e hostname: " + window.location.hostname + " são iguais: " + 
            (window.location.hostname.includes(value)));
            if (window.location.hostname.includes(value)) {
                alert("eh pra redirecionar");
                window.location.href = "chrome-extension://hknjekbcijhgckhennogkgpigbndefph/block.html";
            }
        });
    });
}
// Display black list with paragraphs in a div element
let div1 = document.getElementById("div1");
function showList() {

    // Get blackList from storage variable
    chrome.storage.sync.get("blackList", ({ blackList }) => {
    
        // Create and append paragraph nodes with blocked sites
        for (site of blackList) {
            const p = document.createElement("p");
            const text = document.createTextNode(site);
            p.appendChild(text);
            div1.appendChild(p);
        }
    });
}
showList();

// Change b1 color background based on storage variable inZone
let b1 = document.getElementById("b1");
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

// When the button is clicked, inject blockSites into current page
b1.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: blockSites,
    });
});
  
// The body of this function will be executed 
// as a content script inside the current page
function blockSites() {
    chrome.storage.sync.get("blackList", ({ blackList }) => {

        // Check if the current page is in the black list then block
        blackList.forEach(function (value) {
            if (window.location.hostname.includes(value)) {
                let url = chrome.runtime.getURL("block.html");
                location.assign(url);
            }
        });
    });
}

// Add sites to black list when button is clicked
let bf1 = document.getElementById("bf1");
bf1.addEventListener("click", function () {
    let value = document.getElementById("input1").value;

    // Make sure field is not empty
    if (value === "") {
        return;
    }

    // Remove old paragraphs from div1
    while (div1.firstChild) {
        div1.removeChild(div1.firstChild);
    }
    
    chrome.storage.sync.get("blackList", ({ blackList }) => {
        
        // Update list
        blackList.push(value);
        chrome.storage.sync.set({ blackList });

        // Clear field
        document.getElementById("input1").value = "";

        // Update div to show black list
        showList();
    });
});

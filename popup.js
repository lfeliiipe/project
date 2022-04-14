// Display black list in a div element
let listDiv = document.getElementById("listDiv");
function showList() {

    // Get blackList from storage variable
    chrome.storage.sync.get("blackList", ({ blackList }) => {

        // Create block list header
        const len = blackList.length;
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
            const spanText = document.createTextNode(blackList[i].toUpperCase());
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


// Remove websites from block list
function deleteButton() {

    // Search and remove an specific website from the list
    const deleteSite = this.previousSibling.innerHTML.toLowerCase();
    chrome.storage.sync.get("blackList", ({ blackList }) => {

        let len = blackList.length;
        for (let i = 0; i < len; i++) {
            if (blackList[i] === deleteSite) {
                blackList.splice(i ,1);
            }
        }
        chrome.storage.sync.set({ blackList });

        // Update the page's html
        removeNodes(listDiv);
        showList();
    });
}


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

    // Remove old nodes from listDiv
    removeNodes(listDiv);
    
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


// Remove all child nodes from an element
function removeNodes(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

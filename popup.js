// Redirect to zone page when inZone mode is on
chrome.storage.sync.get("inZone", ({ inZone }) => {
    if (inZone) {
        let url = chrome.runtime.getURL("zone_page.html");
        window.location.assign(url);
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

// Hide zoneButton
const zoneButton = document.getElementById("zoneButton");
const und = document.getElementById("und_radio");
const pomo = document.getElementById("pomo_radio");
const def = document.getElementById("def_radio");
if (!und.checked && !pomo.checked && !def.checked) {
    zoneButton.style.display = "none";
    console.log("apagou o botaozao");
}

console.log("undefined checked", und.checked);
console.log("pomodoro checked", pomo.checked);
console.log("defined checked", def.checked);


// Add listeners on radio buttons
const inputs = document.getElementsByTagName("input");
for (const input of inputs) {
    if (input.type === "radio") {
        console.log("input type é: ", input.type);
        input.onchange = showTimeSettings;
    }
}

const div_pomodoro = document.getElementById("div_pomodoro");
const div_defined = document.getElementById("div_defined");

div_pomodoro.style.display = "none";
div_defined.style.display = "none";

// Show zoneButton when any radio button is clicked
function showTimeSettings() {
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

        default:
            break;
    }
}

// Remove websites from block list
function deleteButton() {

    // Search and remove an specific website from the list
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


// When the button is clicked set inZone to true
zoneButton.addEventListener("click", () => {
    chrome.storage.sync.get("inZone", ({ inZone }) => {
        inZone = true;
        chrome.storage.sync.set({ inZone });
        let url = chrome.runtime.getURL("zone_page.html");
        window.location.assign(url);
    });
});


// Add sites to block list when button is clicked
let form1 = document.getElementById("form1");
form1.addEventListener("submit", function () {
    let value = document.getElementById("input1").value;

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

        // Clear field
        document.getElementById("input1").value = "";

        // Update div to show block list
        showList();
    });
});


// Remove all child nodes from an element
function removeNodes(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

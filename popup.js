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

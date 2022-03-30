// Initialize button with user's preferred color
let b1 = document.getElementById("b1");

// Change b1 color background based on storage variable onfocus
function changeButtonColor() {
    chrome.storage.sync.get("onfocus", ({ onfocus }) => {
        if (onfocus) {
            b1.style.backgroundColor = "red";
            b1.innerHTML = "IN THE ZONE";
        } else {
            b1.style.backgroundColor = "blue";
            b1.innerHTML = "GET IN THE ZONE";
        }
    });
}
changeButtonColor();

// When the button is clicked change storage variable onfocus and button color
b1.addEventListener("click", function () {
    chrome.storage.sync.get("onfocus", ({ onfocus }) => {
        onfocus = !onfocus;
        chrome.storage.sync.set({ onfocus });
        changeButtonColor();
    });
});
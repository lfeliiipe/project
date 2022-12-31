// Import reset function
import { resetStorageObjs } from "./helpers.js";

// Add event listeners to buttons
document.getElementById("reset_list").addEventListener("click", resetButtons);
document.getElementById("reset_file").addEventListener("click", resetButtons);
document.getElementById("reset_inzone").addEventListener("click", resetButtons);

// Control what buttons reset
async function resetButtons(element) {
    switch(element.srcElement.id) {
        case "reset_list":
            await resetStorageObjs("blockList");
            alert("Block list was reset");
            break;

        case "reset_file":
            await resetStorageObjs("fileSettings");
            alert("File settings were reset");
            break;

        case "reset_inzone":
            await resetStorageObjs("inZone");
            alert("A brand new session is ready");
            break;
    }
}
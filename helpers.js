// Resets/Creates necessary objects 
async function resetStorageObjs(objName) {

    console.log("entrou pra resetar: ", objName);
    switch(objName) {
        case "inZone":
            const inZone = {
                isOn: false,
                isCompleted: false,
                started: false,
                stopped: false,
                startDateTime: "",
                endDateTime: "",
                timeSetting: "",
                sessionName: "",
                lastAlarmName: "",
                definedSettings: {},
                pomoSettings: {},
                pomoStatus: [],
                pomoDates: []
            };
            await chrome.storage.sync.set({ inZone });
            console.log("inZone depois do reset: ", inZone);
            break;

        case "blockList":
            const blockList = [];
            await chrome.storage.sync.set({ blockList });
            break;
            
        case "fileSettings":
            const fileSettings = {
                folderId: "",
                fileId: "",
                folderName: "Focus Helper and Study Logger",
                fileName: "",
                lastFileCreatedDate: "",
                lastSessionName: ""
            };
            await chrome.storage.sync.set({ fileSettings });
            break;
    }
}


// Return the diference of two dates in hour, minute and second variables (in an array)
function getDurationVariables(endDateString, startDateString) {
    const end = Date.parse(endDateString);
    const start = Date.parse(startDateString);
    let totalSecs = Math.trunc((end - start)/1000);
    
    let h = Math.trunc(Math.trunc(totalSecs / 60) / 60);
    let m = Math.trunc(totalSecs / 60) - (h * 60);
    let s = totalSecs % 60;
    
    return [h, m, s];
}


// Format duration variables into a single string and optionally update an element with it
function durationToString(h, m, s, element=false) {
    let string = h.toString().padStart(2, "0") + ":" + 
                 m.toString().padStart(2, "0") + ":" +
                 s.toString().padStart(2, "0");

    if(element) {
        element.innerHTML = string;
    } else {
        return string;
    }
}


// Notify user with messages using notifications API
function notify(msg, button=false) {

    // Configure notification
    const init = {
        iconUrl: "./imgs/icon.png",
        type: "basic",
        title: "Focus Helper and Studdy Logger",
        message: msg,
        priority: 0,
    }

    // Add button option if requested
    if (button) {
        init.buttons = [{title: "Open File"}]
    }

    // Create button
    chrome.notifications.create(init);
}


// Make fetch calls for google drive and spreadsheets APIs
async function fetchCalls(type, token) {

    // Retrieve info from storage api
    const { fileSettings } = await chrome.storage.sync.get("fileSettings");
    const { inZone } = await chrome.storage.sync.get("inZone");

    // Set common variables for fetch calls
    let url = "https://www.googleapis.com/drive/v3/files";
    const init = {
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    }

    // Configure fetch calls based on each type of call
    switch(type) {

        case "create folder":
            init.method = "POST";
            init.body = JSON.stringify({
                "mimeType": "application/vnd.google-apps.folder",
                "name": "Focus Helper and Study Logger"
            });
            break;

        case "create file":

            // Create file name based on the session start date (month and year)
            const date = new Date(inZone.startDateTime);
            let fileName = date.toDateString().split(" ");
            fileSettings.fileName = fileName[3] + " " + fileName[1];

            init.method = "POST";
            init.headers.Accept = 'application/json';
            init.body = JSON.stringify({
                "mimeType": "application/vnd.google-apps.spreadsheet",
                "name": fileSettings.fileName,
                "parents": [fileSettings.folderId]
            });
            break;

        case "create headers":
            url = "https://sheets.googleapis.com/v4/spreadsheets/" + fileSettings.fileId + ":batchUpdate";
            init.method = "POST";
            init.headers.Accept = "application/json";
            init.body = JSON.stringify({ "requests": [
                
                // Insert spreadsheet headers' values
                {
                    "updateCells": {
                        "range": {
                            "endRowIndex": 4,
                            "endColumnIndex": 7
                        },
                        "rows": [

                            // First row
                            {
                                "values": [
                                    {"userEnteredValue": {"stringValue": "Focus Helper and Study Logger"}},
                                ]
                            },

                            // Second row
                            {
                                "values": [
                                    {"userEnteredValue": {"stringValue": "Date and Time"}},
                                    {},
                                    {"userEnteredValue": {"stringValue": "Sessions"}},
                                    {},
                                    {"userEnteredValue": {"stringValue": "Subject"}},
                                    {"userEnteredValue": {"stringValue": "Duration"}},
                                    {"userEnteredValue": {"stringValue": "Duration (No Breaks)"}},
                                ]
                            },

                            // Third row
                            {
                                "values": [
                                    {"userEnteredValue": {"stringValue": "Start"}},
                                    {"userEnteredValue": {"stringValue": "End"}},
                                    {"userEnteredValue": {"stringValue": "Type"}},
                                    {"userEnteredValue": {"stringValue": "Cicles"}}
                                ]
                            },

                            // Fourth row
                            {
                                "values": [
                                    {"userEnteredValue": {"stringValue": "TOTAL >>>"}},
                                    {},
                                    {"userEnteredValue": {"stringValue": "-"}},
                                    {"userEnteredValue": {"formulaValue": "=SOMA(D5:D)"}},
                                    {"userEnteredValue": {"stringValue": "-"}},
                                    {"userEnteredValue": {"formulaValue": "=SOMA(F5:F)"}},
                                    {"userEnteredValue": {"formulaValue": "=SOMA(G5:G)"}},
                                    
                                ]
                            }
                        ],
                        "fields": "*"
                    }
                },

                // Multiple merge requests
                // Merge 7 columns on first row
                {
                    "mergeCells": {
                        "range": {
                            "endColumnIndex": 7,
                            "endRowIndex": 1
                        },
                        "mergeType": "MERGE_ROWS"
                    }
                },

                // Merge columns A and B on second row
                {
                    "mergeCells": {
                        "range": {
                            "startRowIndex": 1,
                            "endRowIndex": 2,
                            "endColumnIndex": 2
                        },
                        "mergeType": "MERGE_ROWS"
                    }
                },
                
                // Merge columns C and D on second row
                {
                    "mergeCells": {
                        "range": {
                            "startRowIndex": 1,
                            "endRowIndex": 2,
                            "startColumnIndex": 2,
                            "endColumnIndex": 4
                        },
                        "mergeType": "MERGE_ROWS"
                    }
                },

                // Merge rows 2 and 3 on columns E, F, G
                {
                    "mergeCells": {
                        "range": {
                            "startRowIndex": 1,
                            "endRowIndex": 3,
                            "startColumnIndex": 4,
                            "endColumnIndex": 7
                        },
                        "mergeType": "MERGE_COLUMNS"
                    }
                },

                // Merge columns A and B on row 4
                {
                    "mergeCells": {
                        "range": {
                            "startRowIndex": 3,
                            "endRowIndex": 4,
                            "endColumnIndex": 2
                        },
                        "mergeType": "MERGE_ROWS"
                    }
                },

                // Freeze header rows
                {
                    "updateSheetProperties": {
                        "properties": {
                            "gridProperties": {
                                "frozenRowCount": 4
                            }
                        },
                        "fields": "gridProperties.frozenRowCount"
                    }
                },

                // Bold header rows
                {
                    "repeatCell": {
                        "range": {
                            "endRowIndex": 4
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "horizontalAlignment": "CENTER",
                                "verticalAlignment": "MIDDLE",
                                "wrapStrategy": "WRAP",
                                "textFormat": {
                                    "bold": true
                                },
                            }
                        },
                        "fields": "userEnteredFormat.textFormat.bold, userEnteredFormat.horizontalAlignment, userEnteredFormat.verticalAlignment, userEnteredFormat.wrapStrategy"
                    }
                },

                // Format duration cells
                {
                    "repeatCell": {
                        "range": {
                            "startRowIndex": 4,
                            "startColumnIndex": 4,
                            "endColumnIndex": 6
                        },
                        "cell": {
                            "userEnteredFormat": {
                                "numberFormat": {
                                    "pattern": "hh:mm:ss",
                                    "type": "DATE_TIME"
                                }
                            }
                        },
                        "fields": "userEnteredFormat.numberFormat"
                    }
                }
            ]});
            break;

        case "create line":
        
            // Treat duration variables before inserting
            const start = new Date(inZone.startDateTime);
            const end = new Date(inZone.endDateTime);

            // Duration with breaks (wb) and duration no breaks (nb)
            let wb = [], nb = [];

            // Defined and undefined sessions durations
            if(inZone.timeSetting === "defined" || inZone.timeSetting === "undefined") {
                nb = getDurationVariables(inZone.endDateTime, inZone.startDateTime);                
                wb = nb;
            }

            // Pomodoro uninterrupted session duration
            else if(inZone.timeSetting === "pomodoro" && !inZone.stopped) {
                let totalMinutes = (inZone.pomoSettings.zoneMinutes * inZone.pomoSettings.cicles);
                let hours = Math.trunc(totalMinutes / 60);
                let minutes = totalMinutes % 60;
                let seconds = 0;
                nb = [hours, minutes, seconds];
                wb = getDurationVariables(inZone.endDateTime, inZone.startDateTime);
            }

            // Pomodoro interrupted session duration
            else if(inZone.timeSetting === "pomodoro" && inZone.stopped) {
                wb = getDurationVariables(inZone.endDateTime, inZone.startDateTime);

                let period = inZone.pomoStatus.length - 1;
                let currentZone = 0, totalMinutes = 0, hours = 0, minutes = 0, seconds = 0;

                // Interrupted during first zone period
                if(period === 0) {
                    nb = wb;
                }

                // Interrupted during break
                else if(inZone.pomoStatus[period] === "break") {
                    currentZone = Math.trunc((period + 1) / 2);
                    totalMinutes = (inZone.pomoSettings.zoneMinutes * currentZone);
                    hours = Math.trunc(totalMinutes / 60);
                    minutes = totalMinutes % 60;
                    nb = [hours, minutes, seconds];
                }

                // Interrupted during zone (not the first zone)
                else if(inZone.pomoStatus[period] === "zone" && period !== 0) {
                    currentZone = Math.trunc(period / 2);
                    totalMinutes = (inZone.pomoSettings.zoneMinutes * currentZone);
                    
                    let lastBreakDate = Date.parse(inZone.pomoDates[period - 1]);
                    let lastZoneSeconds = Math.trunc((Date.parse(end) - lastBreakDate) / 1000);
                    let totalSeconds = (totalMinutes * 60) + lastZoneSeconds;

                    hours = Math.trunc(Math.trunc(totalSeconds / 60) / 60);
                    minutes = Math.trunc(totalSeconds / 60) - (hours * 60);
                    seconds = totalSeconds % 60;
                    nb = [hours, minutes, seconds];
                }                    
            }

            url = "https://sheets.googleapis.com/v4/spreadsheets/" + fileSettings.fileId + ":batchUpdate";
            init.method = "POST";
            init.headers.Accept = "application/json";
            init.body = JSON.stringify({ "requests": [

                // Insert row of values of the session to the spreadsheet
                {
                    "appendCells": {
                        "rows": [
                            {
                                "values": [
                                
                                    // First column (Start Date)
                                    {"userEnteredValue": {"stringValue": start.toLocaleString()}},

                                    // Second column (End Date)
                                    {"userEnteredValue": {"stringValue": end.toLocaleString()}},

                                    // Third column (Session Type)
                                    {"userEnteredValue": {"stringValue": inZone.timeSetting.toUpperCase()}},

                                    // Fourth column (Session Quantity)
                                    {"userEnteredValue": {
                                        "numberValue": (inZone.timeSetting === "pomodoro") ? inZone.pomoSettings.cicles : 1}
                                    },

                                    // Sixth column (Subject)
                                    {"userEnteredValue": {"stringValue": inZone.sessionName}},

                                    // Fifth column (Duration)
                                    {
                                        "userEnteredValue": {
                                            "formulaValue": "=TIME(" + wb[0] + ";" + wb[1] + ";" + wb[2] + ")"
                                        },
                                        "userEnteredFormat": {
                                            "numberFormat": {
                                                "pattern": "hh:mm:ss",
                                                "type": "DATE_TIME"
                                            }
                                        }
                                    },

                                    // Seventh column (Duration (No Break))
                                    {
                                        "userEnteredValue": {
                                            "formulaValue": "=TIME(" + nb[0] + ";" + nb[1] + ";" + nb[2] + ")"
                                        },
                                        "userEnteredFormat": {
                                            "numberFormat": {
                                                "pattern": "hh:mm:ss",
                                                "type": "DATE_TIME"
                                            }
                                        }
                                    }
                                ]
                            }
                        ],
                        "fields": "*"
                    }
                }
            ]});
            console.log("init.body: ", init.body);
            break;
    }

    // Repeat fetch in case of a bad response 
    let count = 0;
    let response = {};
    do {
        count++;

        // Make the fetch call and get response
        response = await fetch(url, init);
        
        // Check response status
        if(!response.ok) {
            console.log("Problem fetching data: ", response.status);
            console.log(await response.json());

            // Quit after two bad responses
            if(count > 1) return false;
        }
    }    
    while(!response.ok);

    // Get response body
    response = await response.json();

    // Treat response body based on each type of fetch call
    switch(type) {
        
        case "create folder":

            // Check response 
            if(!response.id) {
                console.log("Couldn't create folder");
                return false;
            }

            // Save folder id in storage sync fileSettings
            fileSettings.folderId = response.id;
            break;

        case "create file":

            // Check response
            if(!response.id) {
                console.log("Couldn't create file");
                return false;
            }

            // Save file id in storage sync fileSettings
            fileSettings.fileId = response.id;
            const now = new Date();
            fileSettings.lastFileCreatedDate = now.toString(); 
            break;

        case "create headers":
            return true;

        case "create line":
            await resetStorageObjs("inZone");
            return true;
    }

    // Persist changes
    await chrome.storage.sync.set({ fileSettings });
    return true;
}


// Upload session to spreadsheet in user's gdrive (Decorated by tokenRequired)
async function uploadSession(token) {

    // Retrieve file information
    const  { fileSettings } = await chrome.storage.sync.get("fileSettings");

    // Force a creation of new file for a different month or year
    let hasFolder = fileSettings?.folderId, hasFile = fileSettings?.fileId;
    let lineCreated = false, headersCreated = false, newFileNeeded = false;
    if(fileSettings.lastFileCreatedDate) {
        let now = new Date();
        let lastDate = new Date(fileSettings.lastFileCreatedDate);
        if(lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear()) {
            newFileNeeded = true;
        }
    }
    
    // Create folder if needed
    if(!hasFolder) {
        hasFolder = await fetchCalls("create folder", token);
        if(hasFolder) {
            notify("Focus Logger folder created");
        } else {
            notify("There was a problem creating the new folder");
        }
    }

    // Create file if needed
    if(!hasFile || newFileNeeded) {
        hasFile = await fetchCalls("create file", token);
        if(hasFile) {
            notify("File created");

            // Create spreadsheet headers
            headersCreated = await fetchCalls("create headers", token);
            if(headersCreated) {
                notify("Headers created");
            } else {
                notify("There was a problem creating the spreadsheet headers");
            }
        } else {
            notify("There was a problem creating the new file");
        }
    }

    // Insert new line once folder and a file are set
    if(hasFolder && hasFile) {
        lineCreated = await fetchCalls("create line", token);
        if(lineCreated) {
            notify("New line added to spreadsheet", true);
        } else {
            notify("There was a problem uploading the new session");
        }
    }
}
uploadSession = tokenRequired(uploadSession);


// -- Authentication related functions --
// Function decorator to require authorization token
function tokenRequired(fn) {
    return async function(...args) {
        try {
            
            // Pass a parameter true to the decorated function to set interactive to true
            let itc = (args[0] === true) ? true : false;
            let tokenResult = await chrome.identity.getAuthToken({interactive: itc});
            return fn(tokenResult.token);
        } 
        
        // If the user isn't logged a token is not returned
        catch(err) {
            console.log("tokenRequired Exception: ", err);
        }
    }
}


// Cache user info in storage.session (Decorated by tokenRequired)
async function initCache(token) {

     // Get user info from google (name, picture)
     let init = {
        method: 'GET',
        async: true,
        headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
        },
        'contentType': 'json'
    };
    await fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token' + token, init)
    .then((response) => response.json())
    .then((data) => {

        // Quit if response data doesn't have this property
        if(!data.email_verified === true) return;

        // Populate cache
        const cacheUser = { authorized: true };
        cacheUser.name = data.name;
        cacheUser.img = data.picture;
        chrome.storage.session.set(cacheUser);
    })
}
initCache = tokenRequired(initCache);


// Export functions to extension's pages
export {
    getDurationVariables, durationToString, fetchCalls, uploadSession, notify, resetStorageObjs, initCache, tokenRequired
};
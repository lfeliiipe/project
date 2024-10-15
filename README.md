# Focus Helper and Study Logger

## Video Demo: [https://youtu.be/70c3Jk3zcSk](https://youtu.be/70c3Jk3zcSk)

## Description: 
<div align=center>
    <img width=70% src="https://github.com/user-attachments/assets/e1996bca-edf2-4c4f-bb46-30e4be16033e">
</div>

Focus Helper and Study Logger is a chrome extension that allows the user to block distracting websites, set timers for study/work sessions, and if desired, log those sessions in spreadsheets via Google Drive.

### How it works:
[In this link](https://developer.chrome.com/docs/extensions/mv3/getstarted/extensions-101/#extension-files) you can find what is the general purpose of chrome extension files like: the manifest, the service worker, content scripts, the popup and other pages.

To achieve a better understanding of how it works, this extension can be splited in two main parts: The background and The popup page.

The background is a [service worker](https://developer.chrome.com/docs/extensions/mv3/service_workers/) that listens to events (and reacts to them) mainly related to the timers set in the popup, and other events like when the extension is installed or updated, when the user navigates on the web, or when the browser is started. [background.js](/background.js) is the service worker in this extension.

The user interacts with the extension through the [popup page](https://developer.chrome.com/docs/extensions/mv3/user_interface/#popup), which is the [popup.html](popup.html) file. To control and give dynamism to the popup page, the following javascript files were added: [popup.js](popup.js), [home.js](home.js), [timer.js](timer.js) and [options.js](options.js). To style the popup page the Bootstrap v5.3 library was used ([bootstrap.bundle.min.js](bootstrap/bootstrap.bundle.min.js), [bootstrap.min.js](bootstrap/bootstrap.min.css)), along with [styles.css](styles.css). Some [icons](/bootstrap/icons/) and [images](/imgs/) were also used.

### Files:

### **- [manifest.json](manifest.json)**
The [manifest](https://developer.chrome.com/docs/extensions/mv3/manifest/) is an obligatory file in every chrome extension. It sets configuration for the extension via key-value pairs.

Important settings in this [manifest.json](manifest.json) file and the reason behind them:

- Name, description, extension version
- Icons paths
- Manifest version:
    - Set to 3. [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) is the lastest manifest version. Previous versions are being deprecated.
- Action:
    - Set the extension default popup to the [popup.html](popup.html) file.
- Background/Service worker:
    - Set to [background.js](background.js) file. Key "type" set to "module" to allow the service worker to use functions imported from the [helpers.js](helpers.js) file.
- Options page:
    - Set to [options.html](options.html) file. More info about options page [here](https://developer.chrome.com/docs/extensions/mv3/options/).
- Oauth 2.0:
    - Necessary configuration to enable user authorization for their gmail profile data and Google Drive. It allows the use of [chrome.identity](https://developer.chrome.com/docs/extensions/reference/identity/) API and [Google Drive]() API.
    - Client Id key not set for privacy/security reasons. [Here](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid) is how to get a client id.
    - The values set for the "scopes" key allow the request of specific user info like: email, name, picture, and access to google drive files created by this extension.
- Permissions:
    - The list of values for this key allows functionality related to a certain chrome extension API.
    - [Alarms](https://developer.chrome.com/docs/extensions/reference/alarms/) API makes possible to schedule code.
    - [Identity](https://developer.chrome.com/docs/extensions/reference/identity/) API (and identity.email permission) gets access tokens and email info from a user logged into google chrome browser.
    - [Notifications](https://developer.chrome.com/docs/extensions/reference/notifications/) API allows the use of browser notifications to be shown to users in the system tray.
    - [Storage](https://developer.chrome.com/docs/extensions/reference/storage/) API permission is needed to implement funcionalities like the block list, and to store other user important data like study sessions settings.
    - [Scripting](https://developer.chrome.com/docs/extensions/reference/scripting/) API is used to change the current page to a blank one and prevent the user to access a block listed website.
    - [WebNavigation](https://developer.chrome.com/docs/extensions/reference/webNavigation/) API is used to listen to navigation changes, and if needed insert a script to prevent access to a blocked website.
- Host permissions:
    - Set to the match pattern "<all_urls>" which allows any url to be a host to the block website script. More info about host permissions [here](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/).
- Web Accessible Resources:
    - Allows extension files to be accessed by web pages or other extensions. More info [here](https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/).
    - "resources" key set to [block.html](block.html) file to allow it to replace a blocked web page.
    - "matches" key set to "<all_urls>" to make possible to use the [block.html](block.html) file in all urls.

### **- [helpers.js](helpers.js)**
During the development of this extension, some functions were necessary in different contexts, like the popup and the background. To address this necessity, [helpers.js](helpers.js) was created, allowing it to hold those common functions and to export them to the requiring files. Following are the functions contained in this file and their descriptions.

- `resetStorageObjs`: Resets important objects to the running of the extension. These objects are stored locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/). `inZone` object stores information about sessions, `blockList` stores the list of blocked websites and `fileSettings` stores information about files to log sessions.
- `getDurationVariables`: Calculates the hours, minutes and seconds between two string dates. It returns a list of values.
- `durationToString`: Formats time values into a string and optionally attaches this string to an html element.
- `notify`: Creates notifications using the [chrome.notifications API](https://developer.chrome.com/docs/extensions/reference/notifications/).
- `fetchCalls`: Automates the proccess of making a fetch call to google drive API. Four types of fetch call are present in this function: `"create folder"`, `"create file"`, `"create headers"`, `"create line"`. It also needs an access token to make the fetch calls.
- `uploadSession`: Treats the information in the `fileSettings` object (stored locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)), and if needed, creates a folder, or a file, or headers to a spreadsheet, or just adds a new line in an existing spreadsheet (creates one spreadsheet monthly). To perform all these actions, the `fetchCalls` function is called, and for fetch calls to be made it's required an access token. That is why `uploadSession` is decorated by `tokenRequired`.
- `tokenRequired`: Is a decorator function and uses the [chrome.identity.getAuthToken API method](https://developer.chrome.com/docs/extensions/reference/identity/#method-getAuthToken) to get an access token from a user logged in google chrome browser. `tokenRequired` won't allow a decorated function to be called if there is not a valid access token. To decorate a function using `tokenRequired` the function to be decorated can be reassigned to `tokenRequired(exampleFunction)`, this way, the function passed as a parameter will be executed only if a valid token is returned. If no error is catched by `tokenRequired`, then the function runs with a token passed as a parameter.
- `initCache`: Retrieves user information via a fetch call to a google API and caches it using the [chrome.storage.session API](https://developer.chrome.com/docs/extensions/reference/storage/#storage-areas). To do so, it needs an access token, therefore this function is decorated by `tokenRequired`.

### **- [background.js](background.js)**
The background page contains important event listeners that allow the extension to work properly. In it's beginnig, it imports four functions from [helpers.js](helpers.js): `uploadSession`, `notify`, `resetStorageObjs` and `initCache`.

On it's first linstener, the [chrome.runtime.onInstalled event listener](https://developer.chrome.com/docs/extensions/reference/runtime/#event-onInstalled) was used to react to the first launch of the extension (or extension updates). It uses the `resetStorageObjs` function to set three objects using start values and stores them locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/). It also calls `initCache` to cache user information locally, possibiliting the popup to have access to this data.

The second event listener reacts to navigation requests and injects a script in the current page being navigated if it's in the block list, and there is a session running. The script then redirects to [block.html](block.html). The event being listened is [chrome.webNavigation.onCommitted](https://developer.chrome.com/docs/extensions/reference/webNavigation/#event-onCommitted), and the method used to inject the script is [chrome.scripting.executeScript](https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript).

The third event listener reacts to [chrome.alarms.onAlarm](https://developer.chrome.com/docs/extensions/reference/alarms/#event-onAlarm) events. When an alarm (set in the popup) fires, then code for two types of session can run: pomodoro or defined. If a defined time type of session gets to its end, then its alarm will trigger and it will call the `endZoneTime` function to update the `inZone` object to indicate the session is over. If an alarm for a pomodoro session triggers, then a switch conditional will call `endZoneTime` and `endBreakTime` functions in different contexts. These contexts are: end of a focus period, end of a break period and end of full pomodoro session. The objective of those functions is to update the `inZone` object to indicate the current state of the session based on the context. This event listener is also used to notify the user of the last update on the session state, like: end of zone (focus) time, end of break time, end of session (pomodoro or defined). If the user chose to log files for their sessions, then `uploadSession` will be called at the end of the session. 

To react to the [chrome.runtime.onStartup](https://developer.chrome.com/docs/extensions/reference/runtime/) event the `initCache` function is passed as a callback. This allows user data to be available to the popup since the moment chrome starts running.

To allow the extension user to have easy access to the spreadsheet when a session is over and uploaded, the [chrome.notifications.onButtonClicked] event listener is used. When the user clicks on the notification button the `fileSettings` object is retrived from local storage. In possession of the file id, the [chrome.tabs.create](https://developer.chrome.com/docs/extensions/reference/tabs/#method-create) method creates a new browser tab to access the spreadsheet via its url.

### **- [popup.html](popup.html)**
The popup page is the interface in which the user interacts with the extension. In the head tag of the [popup.html](popup.html) file, the bootstrap files ([bootstrap.min.css](bootstrap/bootstrap.min.css) and [bootstrap.bundle.min.js](bootstrap.bundle.min.js)) were added, along with [styles.css](styles.css) to help styling the page.

The div tag with `id="profile"` is empty in this file, but its content is created dynamically through javascript in the file [popup.js](popup.js), which is linked in the end of the body tag.

Inside the next div tag with `class="carousel-main"` is most of the page content. In this [carousel](https://getbootstrap.com/docs/5.3/components/carousel/), controled by a [navbar](https://getbootstrap.com/docs/5.3/components/navs-tabs/), are three main divs (each inside a div tag with `class="carousel-item"`), but only one div content is shown at a time. In the home div is html content related to block list and the creation of a new study/work session. In the timer div is html related to session timers. In the options div there is content related to extension options.

To control how the popup works and to control each of those three main divs, there are, at the end of the body tag, four links to javascript files. [popup.js](popup.js) for the general work of the popup page, like profile info, navbar controlling and authorization code. [home.js](home.js), [timer.js](timer.js) and [options.js](options.js) are meant to control content related to their respective divs.

### **- [popup.js](popup.js)**
In this javscript file is the code for controlling the navbar and carousel and for controlling and displaying user info on the popup page ([popup.html](popup.html)). To control the carousel via the navbar there are three functions: `changeNav`, `updateNavbar` and `toggleTab`. `updateNavbar` is called in the `main` function to set the initial state of the navbar, and it will enable the timer tab during a session. `changeNav`, which uses `toggleTab`, enables/disables the timer tab by changing the classes assigned to the navbar tabs. `changeNav` is also passed as a callback function to a carousel slide event listener, so after a carousel slide, `changeNav` can set the appropriate classes to the navbar tabs.

There are four functions in this file that are related to authorization and displaying of user data: `createProfile`, `authorize`, `revokeAccess` and `loadUserInfo`. The `createProfile` function creates html elements to display user info and it's called in the main function before `loadUserInfo`. `loadUserInfo` checks for user data stored locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/), and, if there's data, it will be displayed into the html elements created in `createProfile`. `loadUserInfo` is called in the main function to load the user information when the page loads. `authorize` is a function used as a callback to the click event of the button tag with `id="authorization_button"`. This function calls the imported function from [helpers.js](helpers.js) `initCache` passing a `true` parameter to indicate an interactive authorization flow, that means the user is going to be prompted to authorize the extension to have access to their data, and after the authorization is given, the data is cached and loaded in the popup. `revokeAccess` is decorated by `tokenRequired`, which means that `revokeAccess` only works with an access token. In possession of the token, `revokeAccess` then revokes the token via a fetch call to google servers, the user information is cleared from the `chrome.storage.session` and the `resetStorageObjs` imported function resets any user information related to files and stored in a `fileSettings` object.

### **- [home.js](home.js)**
This file contains javascript code related to the home tab in the [popup.html](popup.html) carousel. The functions contained in [home.js](home.js) are meant to give dynamism and to submit information about sessions and block list through forms. The `main` function calls four functions related to displaying data and to change the style of html elements: `showList`, `updateRadios`, `hideTimeDivs` and `rememberSession`. Some of these functions are also used as callback for the [chrome.storage.sync.onChanged](https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea) event listener, this way they can react instantly to changes in the storage variables they are dependent.

`showList` displays the user's block list inside the div element with `id="list_collapse"`. The `blockList` array stored locally is used along with the `appendSite` function to populate the list to be displayed using div elements. `showList` also reacts to changes in the storage area "sync", which allows to add and remove div items when the block list changes.

`updateRadios` hides and shows settings related to session timers, deppending on what radio option is clicked. This function reacts to changes in the `inZone` object to hide setting divs when a session is running. The `showSettings` function is set as callback to the `onchange` attribute of the radio buttons.

The `hideTimeDivs` function hides the timer options when the user still hasn't selected a radio button.

`rememberSession` retrieves the `fileSettings` object from storage and displays the name used to label the last session. The name is displayed in the input element with `type="text"` and `id="session_label"`.

The form element with `id="form1"` is used to add websites to the block list. A listener to submit events is used, and in this function a regular expression is used to filter the user input, after that, if the value entered by the user is not empty, then this value gets added to the block list (`blockList` object) using the [chrome.storage.sync.set](https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea) method. 

To start a new session, after choosing their time settings, the user will click on the button element with `id="zoneButton`. To listen to this click event, a function will control what happens next. In this function, the time settings will be stored in the `inZone` object, and the session name too (after being filtered). Start and end dates will be calculated, and if the session is type pomodoro or type defined, then, the `createAlarm` function will be called to calculate and set the alarm(s) using the [chrome.alarms.create](https://developer.chrome.com/docs/extensions/reference/alarms/#method-create) method. After all relevant information about the session is stored locally in the `inZone` object, a carousel instance is created, allowing to use the method [to](https://getbootstrap.com/docs/5.3/components/carousel/#methods), which slides the carousel to the next item (timer tab).

### **- [timer.js](timer.js)**
This file is related to the timer tab in the [popup.html](popup.html) carousel. In this file are functions to display and control session timers. Right in the beggining of the file, five functions are imported from [helpers.js](helpers.js). These functions are: `getDurationVariables`, `durationToString`, `uploadSession`, `resetStorageObjs` and `notify`. The `main` function is used to display the right type of timer according to the type of session set by the user.
The `main` function calls the `updateZoneStatus` function to display what period in the session they are (like zone time, break time, session finished) via the element with `id="zone_status"`. After that, in the `main` function, the `showSessionInfo` function is called to display information about the session in the div element with `id="session_info"`. Then, based on the time settings, the `main` function can call one of these three functions: `undefinedRoutine`, `definedRoutine` or `pomodoroRoutine`.

The `undefinedRoutine` calculates and displays the timer for the undefined time setting by using the `setInterval` javascript function with `getDurationVariables` and `durationToString`.

The `definedRoutine` function calculates and displays the timer for the defined time setting, and it uses the `setInterval` and `clearInterval` javascript functions with `updateZoneStatus`, `getDurationVariables` and `durationToString`.

The `pomodoroRoutine` calculates and displays timers for the pomodoro time setting. It uses the function `createPerdiods` to indicate to the user in which period of the pomodoro session they are curretly in, and for that, the div element with `id="div_periods"` is utilized. `pomodoroRoutine` also uses the `setInterval` and `clearInterval` javascript functions with `updateZoneStatus`, `getDurationVariables` and `durationToString`.

The user can stop the session before it ends if they click on the button element with `id="zoneOff"`. The function to react to the click event is `finishSession`. This function updates the `inZone` object to indicate the session is over, stops the timers using `clearInterval`, stops the alarms using [chrome.alarms.clearAll](https://developer.chrome.com/docs/extensions/reference/alarms/#method-clearAll), calls `updateZoneStatus`, and uses `notify` to notify the user that the session is over.

To the html elements in the [popup.html](popup.html) get more dynamic in relation to the information in the `inZone` object, a function that listens for [chrome.storage.sync.onChanged](https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea) was added.
In this function, the changes that happen in the sync storage area are passed as a parameter to the `createPeriods`, `finishSession`, `updateZoneStatus` and `main` so that they can react to the changes properly.

### **- [options.js](options.js)**
This file is related to the html content in the options tab in the [popup.html](popup.html) carousel, and it is also related to the html content in the [options.html](options.hmtl) file. [options.js](options.js) imports only one function from the [helpers.js](helpers.js) file: `resetStorageObjs`. The only function created in [options.js](options.js) is `resetButtons` which resets `blockList`, `fileSettings` or `inZone` deppending on which button was clicked. 

### **- [options.html](options.html)**
This file is meant to give the user the option to reset some settings. Three settings are able to be reset: session settings, file settings and the block list.

The [options.html](options.html) file is used as the [options page](https://developer.chrome.com/docs/extensions/mv3/options/) in this extension.

### **- [block.html](block.html)**
The extension uses this file to replace the current page the user is navegating if this page is in the block list and there is a session running.

### **- [styles.css](styles.css)**
This is used by [popup.html](popup.html) and [options.html](options.html) for style purposes. It uses tags, classes and ids as selectors. It also uses some [bootstrap v5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/) classes and attributes to achieve a better style. 













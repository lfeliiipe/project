# Focus Helper and Study Logger

## Video Demo: [url_here]()

## Description: 

Focus Helper and Study Logger is a chrome extension that allows the user to block distracting websites, set timers for study/work sessions, and if desired, log those sessions in spreadsheets via Google Drive.

### How it works:
[In this link](https://developer.chrome.com/docs/extensions/mv3/getstarted/extensions-101/#extension-files) you can find what is the general purpose of chrome extension files like: the manifest, the service worker, content scripts, the popup and other pages.

To achieve a better understanding of how it works, this extension can be splited in two main parts: The background and The popup page.

The background is a [service worker](https://developer.chrome.com/docs/extensions/mv3/service_workers/) that listens to events (and reacts to them) mainly related to the timers set in the popup, and other events like when the extension is installed or updated, when the user navigates on the web, or when the browser is started. [background.js](/background.js) is the service worker in this extension.

The user interacts with the extension through the [popup page](https://developer.chrome.com/docs/extensions/mv3/user_interface/#popup), which is the [popup.html](popup.html) file. To control and give dynamism to the popup page, it were added the javascript files: [popup.js](popup.js), [home.js](home.js), [timer.js](timer.js) and [options.js](options.js). To style the popup page the Bootstrap v5.3 library was used ([bootstrap.bundle.min.js](bootstrap/bootstrap.bundle.min.js), [bootstrap.min.js](bootstrap/bootstrap.min.css)), along with [styles.css](styles.css). Some [icons](/bootstrap/icons/) and [images](/imgs/) were also used.

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

- `resetStorageObs`: Resets important objects to the running of the extension. These objects are stored locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/). `inZone` object stores information about sessions, `blockList` stores the list of blocked websites and `fileSettings` stores information about files to log sessions.
- `getDurationVariables`: Calculates the hours, minutes and seconds between two string dates. It returns a list of values.
- `durationToString`: Formats time values into a string and optionally attaches this string to an html element.
- `notify`: Creates notifications using the [chrome.notifications API](https://developer.chrome.com/docs/extensions/reference/notifications/).
- `fetchCalls`: Automates the proccess of making a fetch call to google drive API. Four types of fetch call are present in this function: `"create folder"`, `"create file"`, `"create headers"`, `"create line"`. It also needs an access token to make the fetch calls.
- `uploadSession`: Treats the information in the `fileSettings` object, and if needed, creates a folder, or a file, or headers to a spreadsheet, or just adds a new line in an existing spreadsheet (creates one spreadsheet monthly). To perform all these actions, the `fetchCalls` function is called, and for fetch calls to be made it's required an access token. That is why `uploadSession` is decorated by `tokenRequired`.
- `tokenRequired`: Is a decorator function and uses the [chrome.identity.getAuthToken API method](https://developer.chrome.com/docs/extensions/reference/identity/#method-getAuthToken) to get an access token from a user logged in google chrome browser. `tokenRequired` won't allow a decorated function to be called if there is not a valid access token. To decorate a function using `tokenRequired` the function to be decorated can be reassigned to `tokenRequired(exampleFunction)`, this way, the function passed as a parameter will be executed only if a valid token is returned. If no error is catched by `tokenRequired`, then the function runs with a token passed as a parameter.
- `initCache`: Retrieves user information via a fetch call to a google API and caches it using the [chrome.storage.session API](https://developer.chrome.com/docs/extensions/reference/storage/#storage-areas). To do so, it needs an access token, therefore this function is decorated by `tokenRequired`.

### **- [background.js](background.js)**


### **- [popup.html](popup.html)**
The popup page is the interface in which the user interacts with the extension. In the head tag of the [popup.html](popup.html) file, the bootstrap files ([bootstrap.min.css](bootstrap/bootstrap.min.css) and [bootstrap.bundle.min.js](bootstrap.bundle.min.js)) were added, along with [styles.css](styles.css) to help styling the page.

The div tag with `id="profile"` is empty in this file, but its content is created dynamically through javascript in the file [popup.js](popup.js), which is linked in the end of the body tag.

Inside the next div tag with `class="carousel-inner"` is most of the page content. In this [carousel](https://getbootstrap.com/docs/5.3/components/carousel/), controled by a [navbar](https://getbootstrap.com/docs/5.3/components/navs-tabs/), are three main divs (each inside a div tag with `class="carousel-item"`), but only one div content is shown at a time. In the home div is html content related to block list and the creation of a new study/work session. In the timer div is html related to session timers. In the options div there is content related to extension options.

To control how the popup works and to control each of those three main divs, there are, at the end of the body tag, four links to javascript files. [popup.js](popup.js) for the general work of the popup page, like profile info, navbar controlling and authorization code. [home.js](home.js), [timer.js](timer.js) and [options.js](options.js) are meant to control content related to their respective divs.

### **- [popup.js](popup.js)**
In this javscript file is the code for controlling the navbar and carousel and for controlling and displaying user info on the popup page ([popup.html](popup.html)). To control the carousel via the navbar there are three functions: `changeNav`, `updateNavbar` and `toggleTab`. `updateNavbar` is called in the `main` function to set the initial state of the navbar, and it will enable the timer tab if there is a session on. `changeNav`, which uses `toggleTab`, enables/disables the timer tab by changing the classes assigned to the navbar tabs. `changeNav` is also passed as a callback function to a carousel slide event listener, so after a carousel slide, `changeNav` can set the appropriate classes to the navbar tabs.

There are four functions in this file that are related to authorization and displaying of user data: `createProfile`, `authorize`, `revokeAccess` and `loadUserInfo`. The `createProfile` function creates html elements to display user info and it's called in the main function before `loadUserInfo`. `loadUserInfo` checks for user data stored locally using the [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/), and, if there's data, displays their data into the html elements created in `createProfile`. `loadUserInfo` is called in the main function to load the user information when the page loads. `authorize` is a function used as a callback to the click event of the button tag with `id="authorization_button"`. This function calls the imported function from [helpers.js](helpers.js) `initCache` passing a `true` parameter to indicate an interactive authorization flow, that means the user is going to be prompted to authorize the extension to have access to their data, and after the authorization is given, the data is cached and loaded in the popup. `revokeAccess` is decorated by `tokenRequired`, which means that `revokeAccess` only works with an access token. In possession of the token, `revokeAccess` then revokes the token via a fetch call to google servers, the user information is cleared from the `chrome.storage.session` and the `resetStorageObjects` imported function resets any user information related to files and stored in a `fileSettings` object.














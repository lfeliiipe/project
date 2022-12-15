// Function decorator to require login (authorization token)
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
            return fn("");
        }
    }
}


// Cache user info in storage.session (Decorated by tokenRequired)
async function initCache(token) {

    // Quit if user is not logged (there's not a token)
    if(!token) return;

     // Get user info from google (name, email, picture...)
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
    .then(function(data) {

        // Quit if google data doesn't have this property
        if(!data.email_verified === true) return;

        // Populate cache
        const cacheUser = { logged: true };
        cacheUser.name = data.name;
        cacheUser.email = data.email;
        cacheUser.img = data.picture;
        chrome.storage.session.set(cacheUser);
    })
}
initCache = tokenRequired(initCache);


// Export functions to background.js and popup.js
export { tokenRequired, initCache };
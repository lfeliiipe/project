// Function decorator to require login
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

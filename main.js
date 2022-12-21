// Import libraries for making requests
const https = require('https');

// Create map for storing activities
var storedActivities = new Map();

// Create set for storing unique activities as cache
var cache = new Set();

// Create object where we will have request options
const authorizationKey = 'MTUwOmNHRjFpRHQ0VjE5OGNXbjFyNjZDSjVvaGRoTE5pZE9lS1JGUUcxMWw1YTA9';
const getOptions = {
    'headers': {
        'Content-Type': 'application/json',
        'Authorization' : 'Basic ' + authorizationKey
    }
}
const postOptions = {
    'method': 'POST',
    'headers': {
        'Content-Type': 'application/json',
        'Authorization' : 'Basic ' + authorizationKey
    }
}

// Sort all activities by first_seen_at
// Since we are using JavaScript's sort function, the time complexity is O(n log n)
function sortByFirstSeenAt(activities) {
    activities.sort((a, b) => {
        if(a.first_seen_at < b.first_seen_at) { 
            return -1; 
        }
        if(a.first_seen_at > b.first_seen_at) { 
            return 1; 
        }
        return 0;
    });
}

// Post all activities to endpoint
// This is an async function, so the time complexity is O(n)
function postActivities(activitiesJSON) {
    return new Promise(resolve => {
        const req = https.request("https://api.slangapp.com/challenges/v1/activities/sessions", postOptions, (res) => {
            console.log('Post status Code:', res.statusCode);

            res.on('data', (d) => {
                console.log(d);
              });
        });

        req.on('error', (e) => {
            resolve(e);
        });

        req.write(JSON.stringify(activitiesJSON));
        req.end();
    })
}

// Get all activities from API
// This is an async function, so the time complexity is O(n)
function getActivities() {
    return new Promise(resolve => {
        https.get('https://api.slangapp.com/challenges/v1/activities', getOptions, (res) => {
            let data = '';
        
            res.on('data', (chunk) => {
                data += chunk;
            });
        
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    })
}

// Create a new session object
// We are only declaring variables here, so the time complexity is O(1)
function createSessionObject(activity) {
    let newSession = {
        'ended_at': '',
        'started_at': '',
        'activity_ids': [],
        'duration_seconds': 0, 
    };
    // Add started_at and ended_at to session object
    newSession.started_at = activity.first_seen_at;
    newSession.ended_at = activity.answered_at;
    // Calculate duration of session
    newSession.duration_seconds = (new Date(activity.answered_at) - new Date(activity.first_seen_at)) / 1000;
    // Add activity id to session object
    newSession.activity_ids.push(activity.id);
    // return new session object
    return newSession;
}

// Process all activities
// This function has 2 cases: if activity is not in cache, and if activity is in cache. To check what case we are working for, we only need
// to check if the activity is in the cache, so the time complexity is O(1) due to sets having constant time complexity for checking if an element is in the set.
// If the activity is not in the cache, we are creating a new session object and adding it to the map. This is O(1) due to maps having constant time complexity for adding elements.
// If the activity is in the cache, we are checking if the activity is in the same session. This is O(1) due to maps having constant time complexity for getting the last element in the map.
// But, since we are in fact iterating over all activities, the time complexity is O(n) where n is the number of activities.
function processActivities(activities) {
    for(const i of activities) {
        // If activity is not in cache, add it to cache and create new activity object in map
        if(!cache.has(i.user_id)) {
            // Add activity to cache
            cache.add(i.user_id);
            // Create new session object
            storedActivities.set(i.user_id, [createSessionObject(i)]);
        }
        // If activity is in cache, check if it is in the same session
        else {
            // Get last session object from stored activities
            let lastSession = storedActivities.get(i.user_id)[storedActivities.get(i.user_id).length - 1];
            // Check if activity is in the same session
            if((new Date(i.first_seen_at) - new Date(lastSession.ended_at)) / 1000 < 300) {
                // Add activity to session
                lastSession.duration_seconds += (new Date(i.answered_at) - new Date(lastSession.ended_at)) / 1000;
                lastSession.ended_at = i.answered_at;
                lastSession.activity_ids.push(i.id);
            }
            // If activity is not in the same session, create new session object
            else {
                storedActivities.get(i.user_id).push(createSessionObject(i));
            }
        }
    }
    let processedActivities = {};
    for(key of cache) {
        processedActivities[key] = storedActivities.get(key);
    }
    return processedActivities;
};

async function main() {
    // Get all activities from API
    var fetchedActivities = await getActivities();
    // Sort activities by first_seen_at
    sortByFirstSeenAt(fetchedActivities.activities);
    // Create object where we will store all user sessions and send to endpoint
    var user_sessions = { "user_sessions": processActivities(fetchedActivities.activities) };
    // Send user sessions to endpoint
    console.log(await postActivities(user_sessions));
}

main();



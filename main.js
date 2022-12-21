// Import HTTPS module for making requests
const https = require('https');
const { start } = require('repl');

// Create map for storing activities
var storedActivities = new Map();

// Create set for storing unique activities as cache
var cache = new Set();

// Create objecct where we will have request options
const authorizationKey = 'MTUwOmNHRjFpRHQ0VjE5OGNXbjFyNjZDSjVvaGRoTE5pZE9lS1JGUUcxMWw1YTA9';
const options = {
    'headers': {
        'Content-Type': 'application/json',
        'Authorization' : 'Basic ' + authorizationKey
    }
}

// Sort all activities by first_seen_at
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

// Get all activities from API
function getActivities() {
    return new Promise(resolve => {
        https.get('https://api.slangapp.com/challenges/v1/activities', options, (res) => {
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
    console.log(user_sessions.user_sessions['wthp9bag']);
}

main();



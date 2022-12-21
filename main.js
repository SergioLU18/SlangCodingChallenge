// Import HTTPS module for making requests
const https = require('https');

// Create map for storing activities
var activities = new Map();

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

// Template object for user session
const sessionTemplate = {
    'ended_at': '',
    'started_at': '',
    'activity_ids': [],
    'duration_seconds': 0,
}

// Creates new activity object
function createActivityObject(map, name) {
    map.set(name, [])
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
                // let sessions = JSON.parse(data)['activities'];
                resolve(JSON.parse(data));
            });
            
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    })
}

// Process all activities
function processActivities(activities) {
    return [];
};

async function main() {
    // Get all activities from API
    var fetchedActivities = await getActivities();
    // Sort activities by first_seen_at
    sortByFirstSeenAt(fetchedActivities);
    // Create object where we will store all user sessions and send to endpoint
    var user_sessions = { "user_sessions": processActivities(fetchedActivities) };
}

main();



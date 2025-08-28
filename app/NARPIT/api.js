const authKey = "V3i857s3hLtePEnhqMeSFUSxaqRJeiXIUyHMEEcNXhRkLTYEDbUS4ngKwDiBrj2b";
const nexusKey = "_ZDfr-B2ds6_-cz5500I2SeNgnQ"

async function generateMatchAPIUrl(eventKey, teamNumber, authKey) {
    return "https://www.thebluealliance.com/api/v3/team/frc" + teamNumber + "/event/" + 
    eventKey + "/matches/simple?X-TBA-Auth-Key=" + authKey;
}

async function generateTeamsAPIUrl(eventKey, authKey) {
    return "https://www.thebluealliance.com/api/v3/event/" + 
    eventKey + "/teams/simple?X-TBA-Auth-Key=" + authKey;
}

async function generateEventAPIUrl(eventKey, authKey) {
    return "https://www.thebluealliance.com/api/v3/event/" + 
    eventKey + "/rankings?X-TBA-Auth-Key=" + authKey;
}

async function fetchNexusData(eventKey, nexusKey) {
    // const response = await fetch(`https://frc.nexus/api/v1/event/${eventKey}`, {
    const response = await fetch(`https://frc.nexus/api/v1/event/2025galileo`, {
        method: 'GET',
        headers: {
          'Nexus-Api-Key': nexusKey,
        },
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Error getting live event status:', errorMessage);
        return;
    }

    const data = await response.json();
    console.log('Successfully got live event status', data);
    
    return data;
}

async function fetchTBAData(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (response.status === 404) {
            throw new Error("Event Path not Found on TBA");
        }
        var allData = await response.json();
        allData = JSON.parse(JSON.stringify(allData));
        
        return allData != null ? allData : -1;
    } catch (error) {
        console.error(error);
        return -1;
    }
}
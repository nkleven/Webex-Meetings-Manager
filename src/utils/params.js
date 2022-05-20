const dotenv = require('dotenv');

try {
    if(process.env.NODE_ENV !=='production'){
        dotenv.config(`${__dirname}/../../.env`)
    }
} catch (error){
    console.log(`error: ${error}`);
}

function processEnv(env) {
    let result = env;
    if (!Number.isNaN(Number(result))) result = Number(result);
    if (result === 'true') result = true;
    if (result === 'false') result = false;
    if (result === 'null') result = null;
    return result;
}

const appName = process.env.APP_NAME;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const port = process.env.PORT;
const redirectURI = process.env.REDIRECT_URI;
const scopes = 'meeting:admin_preferences_write meeting:admin_schedule_write meeting:admin_preferences_read meeting:admin_schedule_read spark:kms spark-admin:people_read meeting:admin_participants_read';
const state = process.env.STATE_SECRET;
const sessionSecret = processEnv(process.env.SESSION_SECRET) || 'please-change-me-to-a-session-secret';
const sessionTimeout = processEnv(process.env.SESSION_TIMEOUT) || 600000; // Default 10mins


const initialURL = `https://webexapis.com/v1/authorize?&client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectURI,
    )}&scope=${encodeURIComponent(scopes)}&state=${state}`;

module.exports = {
    appName,
    clientId,
    clientSecret,
    initialURL,
    port,
    redirectURI,
    sessionSecret,
    sessionTimeout
};
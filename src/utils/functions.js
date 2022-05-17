const params = require('./params');

const scopes = [
    'meeting:admin_preferences_write',
    'meeting:admin_schedule_write',
    'meeting:admin_preferences_read',
    'meeting:admin_schedule_read',
    'spark:kms'
];

const apiUri = "https://webexapis.com/v1/authorize?"
const redirectUri = "http://127.0.0.1:4000";

function createAuthUri (){

    // let scopeString = '';
    // scopes.forEach(scope => {;
    //     scope = scope.replaceAll(':', '%3A');
    //     scope = `${scope}%20`;
    //     scopeString = `${scopeString}${scope}`;
    // });
    // scopeString = scopeString.substring(0, scopeString.length - 3);
    // let redirectString = redirectUri.replaceAll(':', '%3A');
    // redirectString = redirectString.replaceAll('/', '%2F');
    // let apiUrl = apiUri.replaceAll(':', '%3A');
    // apiUrl = apiUrl.replaceAll('/', '%2F');

    // authUri = `${apiUri}client_id=${params.clientId}&response_type=code&redirect_uri=${redirectString}&scope=${scopeString}`;
    return params.initialURL;

}

module.exports = {
    createAuthUri
};
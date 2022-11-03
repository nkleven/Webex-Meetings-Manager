const params = require('./params');

const scopes = [
    'meeting:admin_preferences_write',
    'meeting:admin_schedule_write',
    'meeting:admin_preferences_read',
    'meeting:admin_schedule_read',
    'spark:kms'
];

const apiUri = "https://webexapis.com/v1/authorize?"
const redirectUri = `http://127.0.0.1:${params.port}`;

function createAuthUri (){

    return params.initialURL;

}

function parseRoles (roles) {
    const roleNames = [];
    roles.forEach(role => {
        
        switch (role) {
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvaWRfdXNlcl9hZG1pbg':
                roleNames.push('User Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvaWRfcmVhZG9ubHlfYWRtaW4':
                roleNames.push('Read-Only Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvYXRsYXMtcG9ydGFsLnN1cHBvcnQ':
                roleNames.push('Support Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvYXRsYXMtcG9ydGFsLnBhcnRuZXIuaGVscGRlc2suYWR2YW5jZWQ':
                roleNames.push('Advanced Help Desk Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvaWRfZGV2aWNlX2FkbWlu':
                roleNames.push('Device Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvYXRsYXMtcG9ydGFsLnBhcnRuZXIuc2FsZXNhZG1pbg':
                roleNames.push('Sales Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvYXRsYXMtcG9ydGFsLnBhcnRuZXIuaGVscGRlc2s':
                roleNames.push('Help Desk Administrator');
                break;
            case 'Y2lzY29zcGFyazovL3VzL1JPTEUvaWRfZnVsbF9hZG1pbg':
                roleNames.push({
                    name: 'Full Administrator',
                    id: 'Y2lzY29zcGFyazovL3VzL1JPTEUvaWRfZnVsbF9hZG1pbg'
                });
                break;
            default:
                break;
        }

    });
    return roleNames;
}

module.exports = {
    createAuthUri,
    parseRoles
};
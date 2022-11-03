const axios = require('axios');
const axiosRetry = require('axios-retry');
const functions = require('../utils/functions');
const rateLimit = require('axios-rate-limit');
const qs = require('qs');
const params = require('../utils/params');
const session = require('express-session');
const logger = require('../utils/logger')('webexService');

const wxAxios = rateLimit(axios.create({ timeout: params.apiTimeout }),
  { maxRPS: 5 });

axios.interceptors.request.use(request => {
  console.log('Starting Request', JSON.stringify(request, null, 2))
  return request
})
  
axios.interceptors.response.use(response => {
  console.log('Response:', JSON.stringify(response, null, 2))
  return response
})

axiosRetry(wxAxios, {
  retries: 5,
  retryDelay: (retryCount, error) => {
    if (error.response) {
      const retryTimeout = error.response.headers['retry-after'];
      if (retryTimeout) {
        logger.debug(`retry-after time: ${retryTimeout}`);
        // Add Small Buffer
        return retryTimeout * 1200;
      }
    }
    if (error.message === 'ECONNABORTED') {
      return 15000;
    }
    if (error.code) {
      if (error.code === 'ECONNABORTED') {
        logger.debug('ECONNABORTED, try after 5sec');
        return 5000;
      }
    }
    return axiosRetry.exponentialDelay(retryCount, error);
  },
  retryCondition: (e) => {
    const retry = axiosRetry.isNetworkOrIdempotentRequestError(e) || e.code === 'ECONNABORTED';
    if (e.response) {
      logger.debug(`Axios Retry Invoked. ${e.response.status}`);
      // if (e.response.status === 404) { return false; }
      if (e.response.status === 429 || retry) {
        return true;
      }
    } else if (retry) {
      logger.debug('Axios Retry Invoked.');
      return true;
    }
    return false;
  },
});

function webexService() {

  function addParticipant(meetingId, emailAddress, hostEmail, access_token) {
    return new Promise((resolve, reject)=>{
      const options = {
        method: 'POST',
        url: 'https://webexapis.com/v1/meetingInvitees',
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        data : {
          meetingId: meetingId,
          email: emailAddress,
          sendEmail: false,
          hostEmail: hostEmail
        },
        json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data);
      });
    });
  }

  function addPmrCoHost(userEmail, coHostEmail, pmr, access_token){
    return new Promise((resolve, reject)=>{
      const options= {
        method: 'PUT',
        url: `https://webexapis.com/v1/meetingPreferences/personalMeetingRoom?userEmail=${userEmail}`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        data: {
          topic: pmr.topic,
          hostPin: pmr.hostPin,
          enableAutoLock: pmr.enabledAutoLock,
          autoLockMinutes: pmr.autoLockMinutes,
          enableNotifyHost: pmr.enabledNotifyHost,
          supportCoHost: pmr.supportCoHost,
          supportAnyoneAsCoHost: pmr.supportAnyoneAsCoHost,
          allowFirstUserToBeCoHost: pmr.allowFirstUserToBeCoHost,
          allowAuthenticatedDevices: pmr.allowAuthenticatedDevices,
          coHosts : [
            {
            email : coHostEmail
            }
          ]
        },
        json: true
      }

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data);
      })
    })
  }

  function getMe(access_token) {
    return new Promise((resolve, reject)=> {
      const options = {
        method: 'GET',
        url: 'https://webexapis.com/v1/people/me',
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        json: true,
      };

      wxAxios
        .request(options)
        .then((response)=>{
          if(!response.data){
            logger.debug(
              'missing data in response.',
            );
            reject(new Error('invalid json data'));
          }
          try{
            logger.debug('personal data received');
            const me = {};
            if (response.data.roles){
                me.displayName = response.data.displayName;
                me.emailAddress = response.data.emails[0];
                me.roles = functions.parseRoles(response.data.roles);
            }

            resolve(me);
          }
          catch{
            logger.debug('unable to retrieve displayName');
            reject(error);
          }
        })
        .catch((error) =>{
          reject(error);
        });
    });
  }

  //Get details of a specific meetingId
  function getMeeting(meetingId, meetingPassword, access_token){
    return new Promise((resolve, reject) => {
      const options = {
      method: 'GET',
      url: `https://webexapis.com/v1/meetings/${meetingId}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`,
        password: meetingPassword
      },
      json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data);
        //TODO ADD EXCEPTION HANDLING
      })
    });
  }

  function getNextOccurrence(meetingSeriesId, password, access_token) {
    return new Promise((resolve, reject)=>{
      const options = {
        method: 'GET', 
        url: `https://webexapis.com/v1/meetings?meetingSeriesId=${meetingSeriesId}`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'password': password
        },
        json: true,
      };

      wxAxios
        .request(options)
        .then((response)=>{
          const nextOccurrence = {
            start: response.data.items[0].start,
            end: response.data.items[0].end
          }
          resolve(nextOccurrence);
        });
    });
  }

  function getPayload(apiName, params, access_token){

    return new Promise((resolve, reject)=>{
      const options = {
        method: 'GET',
        url: `https://webexapis.com/v1/${apiName}/`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        params: params,
        json: true
      };
      //This change is just a test
      wxAxios
        .request(options)
        .then((response)=>{
          resolve(response.data)
        })
      });
  }

  //Get Personal Meeting Room details for a given email address
  function getPersonalMeetingRoom(userEmail, access_token){
    return new Promise ((resolve, reject)=>{
      const options = {
        method: 'GET',
        url: `https://webexapis.com/v1/meetingPreferences/personalMeetingRoom?userEmail=${userEmail}`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        json: true
      };

      wxAxios
        .request(options)
        .then((response)=>{
          resolve(response.data)
        })
      });
  }

  function getPersonalMeetingRoomState(pmrLink, access_token){
    const encodedUri = encodeURIComponent(pmrLink);
    return new Promise((resolve, reject) => {
      const options = {
      method: 'GET',
      url: `https://webexapis.com/v1/meetings?meetingType=meeting&webLink=${pmrLink}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data.items[0].state);
        //TODO ADD EXCEPTION HANDLING
      })
    });
  }

  // Get a list of people invited to a meeting.  Invitees are people invited, participants are people in the meeting
  function listInvitees(meetingId, hostEmail, access_token){

    return new Promise((resolve, reject)=>{
      const options = {
        method: 'GET',
        url: `https://webexapis.com/v1/meetingInvitees`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        params: {
          meetingId: meetingId,
          hostEmail: hostEmail
        },
        json: true
      }

      wxAxios
        .request(options)
        .then((response)=>{
          resolve(response.data)
        })

    });
    
  }

  function listMeetings(hostEmail, access_token){
    return new Promise((resolve, reject) => {
      const options = {
      method: 'GET',
      url: `https://webexapis.com/v1/meetings?hostEmail=${hostEmail}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data);
        //TODO ADD EXCEPTION HANDLING
      })
    });
  }

  function listParticipants(meetingId, hostEmail, access_token){
    return new Promise((resolve, reject)=>{
      const options = {
        method: 'GET',
        url: `https://webexapis.com/v1/meetingParticipants`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        params: {
          meetingId: meetingId,
          hostEmail: hostEmail
        },
        json: true
      }

      wxAxios
        .request(options)
        .then((response)=>{
          resolve(response.data)
        })
    });
  }

  function postTokens2(code) {
  return new Promise((resolve, reject) => {
      const oAuthHeader = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64');
      const data = {
      grant_type: 'authorization_code',
      code,
      scopes: params.scopes,
      redirect_uri: `${params.redirectURI}:${params.port}`,
      };
      const options = {
      method: 'POST',
      url: 'https://idbroker.webex.com/idb/oauth2/v1/access_token',
      headers: {
          'content-type': 'application/x-www-form-urlencoded',
          authorization: `Basic ${oAuthHeader}`,
      },
      data: qs.stringify(data),
      json: true,
      };

      wxAxios
      .request(options)
      .then((response) => {
          // Check JSON payload is compliant with specs
          if (
          !response.data ||
          !response.data.access_token ||
          !response.data.refresh_token
          ) {
          logger.debug(
              'could not parse message details: bad json payload or could not find access codes.',
          );
          reject(new Error('invalid json'));
          }
          try {
          logger.debug('return token data');
          resolve(response.data);
          } catch (error) {
          logger.debug('tokens not returnable');
          reject(error);
          }
      })
      .catch((error) => {
          logger.debug(`postTokens error: ${error.message}`);
          if (error.response && error.response.headers.trackingid) {
          logger.debug(`tid: ${error.response.headers.trackingid}`);
          }
          reject(error);
      });
  });
  }

  function retrieveTokens(code) {
    return new Promise((resolve, reject) => {
        const data = {
        grant_type: 'authorization_code',
        client_id: params.clientId,
        client_secret: params.clientSecret,
        code: code,
        redirect_uri: `${params.redirectURI}:${params.port}/`,
        };
        const options = {
        method: 'POST',
        url: 'https://webexapis.com/v1/access_token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: qs.stringify(data),
        json: true,
        };
  
        wxAxios
        .request(options)
        .then((response) => {
            // Check JSON payload is compliant with specs
            if (
            !response.data ||
            !response.data.access_token ||
            !response.data.refresh_token
            ) {
            logger.debug(
                'could not parse message details: bad json payload or could not find access codes.',
            );
            reject(new Error('invalid json'));
            }
            try {
            logger.debug('return token data');
            resolve(response.data);
            } catch (error) {
            logger.debug('tokens not returnable');
            reject(error);
            }
        })
        .catch((error) => {
            logger.debug(`postTokens error: ${error.message}`);
            if (error.response && error.response.headers.trackingid) {
            logger.debug(`tid: ${error.response.headers.trackingid}`);
            }
            reject(error);
        });
    });
  }

  function removeParticipant(meetingInviteId, hostEmail, access_token){
    return new Promise((resolve, reject)=>{
      const options = {
        method: 'DELETE',
        url: `https://webexapis.com/v1/meetingInvitees/${meetingInviteId}`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        params: {
          hostEmail: hostEmail,
          sendEmail: false
        },
        json: true
      }

      wxAxios
        .request(options)
        .then((response)=>{
          resolve(response.data)
        })

    });
  }

  function toggleMeetingOption(meeting, nextOccurrence, option, access_token){
    if(meeting[option]){meeting[option] = false} else {meeting[option] = true}
    meeting.start = nextOccurrence.start;
    meeting.end = nextOccurrence.end;
    return new Promise((resolve, reject) => {
      const options = {
      method: 'PUT',
      url: `https://webexapis.com/v1/meetings/${meeting.id}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      data: meeting,
      json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        resolve(response.data);
        //TODO ADD EXCEPTION HANDLING
      })
    });
  }

  function unlockMeeting(meetingId, access_token){
    return new Promise((resolve, reject)=>{
      const options = {
        method: 'PUT',
        url: `https://webexapis.com/v1/meetings/controls?meetingId=${meetingId}`,
        headers: {
          authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        data: {
          locked: false
        },
        json: true,
      }
      
      wxAxios
      .request(options)
      .then((response)=>{
        try {
          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      })
      .catch((error)=>{
        
      })
    })
  }

  function updateCoHost(coHost, hostEmail, access_token){
    let newStatus = true;
    if(coHost.coHost == true){newStatus = false};
    if(coHost.coHost == false){newStatus = true};
    return new Promise((resolve, reject) => {
      const options = {
      method: 'PUT',
      url: `https://webexapis.com/v1/meetingInvitees/${coHost.id}`,
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${access_token}`
      },
      data: {
        email: coHost.email,
        coHost: newStatus,
        hostEmail: hostEmail,
        sendEmail: false
      }
      ,
      json: true,
      };

      wxAxios
      .request(options)
      .then((response)=>{
        if (!response.data){
          logger.debug(
            'could not parse response from the API: bad or invalid json payload'
          );
          reject(new Error('invalid json data'));
        }
        try {
          resolve(response.data);
        } catch (error) {
          
        }
      })
      .catch((error) => {
        reject(error);
      })
    });
  }

  return {
    addParticipant,
    addPmrCoHost,
    getMe,
    getMeeting,
    getNextOccurrence,
    getPayload,
    getPersonalMeetingRoom,
    getPersonalMeetingRoomState,
    listInvitees,
    listMeetings,
    listParticipants,
    postTokens2,
    retrieveTokens,
    removeParticipant,
    toggleMeetingOption,
    unlockMeeting,
    updateCoHost
  };
}

module.exports = webexService();

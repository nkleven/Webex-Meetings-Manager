const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');
const qs = require('qs');
const params = require('../utils/params');
const logger = require('../utils/logger')('webexService');

const wxAxios = rateLimit(axios.create({ timeout: params.apiTimeout }),
  { maxRPS: 5 });

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
            resolve(response.data);
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

  function listParticipants(meetingId, hostEmail, access_token){

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

  function postTokens2(code) {
  return new Promise((resolve, reject) => {
      const oAuthHeader = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64');
      const data = {
      grant_type: 'authorization_code',
      code,
      scopes: params.scopes,
      redirect_uri: params.redirectURI,
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
        redirect_uri: params.redirectURI,
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
        resolve(response.data);
        //TODO ADD EXCEPTION HANDLING
      })
    });
  }

  return {
    getMe,
    getMeeting,
    getNextOccurrence,
    getPayload,
    listMeetings,
    listParticipants,
    postTokens2,
    retrieveTokens,
    toggleMeetingOption,
    updateCoHost
  };
}

module.exports = webexService();

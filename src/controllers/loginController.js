const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const logger = require('../utils/logger')('loginController');

function loginController() {
  async function getCallback(req, res) {
    
    let accessCodes;
    try {
      // const adminToken = await webexService.postAdminToken();
      // logger.debug('AdminToken');
      // logger.debug(adminToken.access_token);

      // Retrieve access token (expires in 14 days) & refresh token (expires in 90 days)
      try {
        accessCodes = await webexService.retrieveTokens(req.query.code);
      } catch (error) {
        logger.debug(error.message);
        logger.debug('helpdesk token issue');
        throw new Error('HD_TOKEN_ISSUE');
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.debug('HD');
        logger.debug(accessCodes.access_token);
        logger.debug('HD RT');
        logger.debug(accessCodes.refresh_token);
      
      }

      req.session.access_token = accessCodes.access_token;
      req.session.refresh_token = accessCodes.refresh_token;
      req.session.isAuthenticated = true;

      // Once authenticated redirect to meeting manager.
      res.redirect('/meetings');

    } catch (error) {
      logger.debug(error.message);
      let errorText = 'An unspecified error has occurred.';
      let ssoLogout = false;
      switch (error.message) {
        case 'NO_DB':
          errorText = 'Unable to connect to Database';
          break;
        case 'HD_TOKEN_ISSUE':
          errorText = 'Token Issue. Please logout of Cisco Services and try again.';
          ssoLogout = true;
          break;
        case 'SP_TOKEN_ISSUE':
          errorText = 'SP Token Issue. Please contact CCSE Portal Support';
          break;
        case 'INVALID_AUTH':
          errorText = 'You are not authorized to use this application.';
          break;
        default:
      }
      res.render('error', { title: 'Error', errorText, ssoLogout });
    }
  }

  function getIndex(req, res) {
    logger.debug('login index initiate');

    // Append Email is defined
    let { initiateURL } = params;
    if (req.query.email) {
      initiateURL += `&email=${req.query.email}`;
    }
    // Send to Webex for Authentication
    res.redirect(initiateURL);
  }

  return {
    getIndex,
    getCallback
  }

}

module.exports = loginController;
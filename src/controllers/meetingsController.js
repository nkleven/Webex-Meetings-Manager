const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const logger = require('../utils/logger')('meetingsController');

function meetingsController() {

    async function getIndex(req, res){
        const me = await webexService.getMe(req.session.access_token);
        res.render('meetings',{
            title: 'Meeting Manager',
            me: me
          });
    }

    return {
        getIndex
    };

}

module.exports = meetingsController;
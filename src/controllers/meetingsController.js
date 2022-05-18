const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const logger = require('../utils/logger')('meetingsController');

function meetingsController() {

    async function getIndex(req, res){
        const me = await webexService.getMe(req.session.access_token);
        if (!req.session.meetings){
            res.render('meetings',{
                title: 'Meeting Manager',
                me: me
            });
        }

    }

    async function postIndex(req, res){
        logger.debug(req.body);
    }

    return {
        getIndex,
        postIndex
    };

}

module.exports = meetingsController;
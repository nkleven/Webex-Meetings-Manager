const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const { append } = require('express/lib/response');
const logger = require('../utils/logger')('meetingsController');

function meetingsController() {

    async function getIndex(req, res){
        const me = await webexService.getMe(req.session.access_token);
        req.session.me = me;
        if (!req.session.meetings){
            res.render('meetings',{
                title: 'Meeting Manager',
                me: me
            });
        }

    }

    async function postIndex(req, res){
        logger.debug(req.body);

        if(req.body.meetingHost){
            const meetings = await webexService.listMeetings(req.body.meetingHost, req.session.access_token);
            logger.debug('fetched meetings');
            res.render('meetings',{
                title: 'Meeting Manager',
                me: req.session.me,
                meetings: meetings
            })
        }
    }

    return {
        getIndex,
        postIndex
    };

}

module.exports = meetingsController;
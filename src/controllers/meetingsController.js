const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const { append } = require('express/lib/response');
const { request } = require('express');
const logger = require('../utils/logger')('meetingsController');

function meetingsController() {

    async function getIndex(req, res){
        // Get display name of logged in user
        req.session.me = await webexService.getMe(req.session.access_token);
        
        // Look for retrieved list of meetings for user
        if (!req.session.meetings){
            res.render('meetings',{
                title: 'Meeting Manager',
                me: req.session.me,
            });
        }

        // Does request contain a meeting id query
        if(req.query.id){
            logger.debug('meeting selected');
            meetingPassword = req.session.meetings.items[req.query.index].password
            req.session.meeting = await webexService.getMeeting(req.query.id, meetingPassword, req.session.access_token);
            res.render('meetings',{
                title: 'Meeting Manager',
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting
            });
        }
    }

    //  
    async function postIndex(req, res){
        logger.debug(req.body);

        if(req.body.meetingHost){
            req.session.meetings = meetings = await webexService.listMeetings(req.body.meetingHost, req.session.access_token);
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
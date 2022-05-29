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
                title: params.appName,
                me: req.session.me.displayName,
            });
        }

        if(req.query.updateHost){
            logger.debug('request to add a cohost')
            const coHost = req.session.meeting.participants.items[req.query.index];
            response = await webexService.updateCoHost(coHost, req.session.meeting.hostEmail ,req.session.access_token);
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            logger.debug('new host added');
            res.render('meetings',{
                title: params.appName,
                me: req.session.me.displayName,
                meetings: req.session.meetings,
                meeting: req.session.meeting
            });
        }

        // Does request contain a meeting id query
        if(req.query.getMeeting){
            logger.debug('meeting selected');
            meetingPassword = req.session.meetings.items[req.query.index].password
            req.session.meeting = await webexService.getMeeting(req.query.id, meetingPassword, req.session.access_token);
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.password = meetingPassword;
            res.render('meetings',{
                title: params.appName,
                me: req.session.me.displayName,
                meetings: req.session.meetings,
                meeting: req.session.meeting
            });
        }

        if(req.query.toggleMeetingOption){
            logger.debug('request to toggle a meeting option')
            nextOccurrence = await webexService.getNextOccurrence(req.session.meeting.id, req.session.meeting.password, req.session.access_token)
            await webexService.toggleMeetingOption(req.session.meeting, nextOccurrence, req.query.option, req.session.access_token);
            req.session.meeting = await webexService.getMeeting(req.session.meeting.id, meetingPassword, req.session.access_token);
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            logger.debug('Option Toggled');
            res.render('meetings',{
                title: params.appName,
                me: req.session.me.displayName,
                meetings: req.session.meetings,
                meeting: req.session.meeting
            });
        }
    }

    //  
    async function postIndex(req, res){
        logger.debug(req.body);

        // Look for a meeting host in the body of the post and retrieve meetings for that host.
        if(req.body.meetingHost){
            req.session.meetings = meetings = await webexService.listMeetings(req.body.meetingHost, req.session.access_token);
            logger.debug('fetched meetings');
            res.render('meetings',{
                title: params.appName,
                me: req.session.me.displayName,
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
const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const { append } = require('express/lib/response');
const { request } = require('express');
const session = require('express-session');
const logger = require('../utils/logger')('app');
const debug = require('debug')('meetingsController');

function meetingsController() {

    async function getIndex(req, res){
        // Get display name of logged in user
        req.session.me = await webexService.getMe(req.session.access_token);

        if (req.session.me.roles.length == 0){
            res.render('meetings', {
                title:params.appName,
                me: req.session.me,
                error: "User does not have the required administration role to access this application"
            })
        } else {
            
        }
        
        // Look for retrieved list of meetings for user
        if (!req.session.meetings){
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
            });
        }

        if(req.query.updateHost){
            req.session.error = null;
            logger.debug('request to add a cohost')
            const coHost = req.session.meeting.participants.items[req.query.index];
            try {
                response = await webexService.updateCoHost(coHost, req.session.meeting.hostEmail ,req.session.access_token);
            } catch (error) {
                console.debug("Didn't work");
                req.session.error = error.response.data.message;
            }
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            logger.debug('new host added');
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                error: req.session.error || null,
                tab: 1
            });
        }

        // Does request contain a meeting id query
        if(req.query.getMeeting && req.query.index){
            logger.debug('meeting selected');
            meetingPassword = req.session.meetings.items[req.query.index].password
            req.session.meeting = await webexService.getMeeting(req.query.id, meetingPassword, req.session.access_token);
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.password = meetingPassword;
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                tab: 1,
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
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                tab: 2,
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
                me: req.session.me,
                meetings: meetings
            })
        }

        if(req.body.newParticipant){
            debug(`Attempting to add ${req.body.newParticipant}`);
            response = await webexService.addParticipant(req.session.meeting.id, req.body.newParticipant, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.participants = await webexService.listParticipants(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            debug('adding participant');
            res.render('meetings',{
                meeting: req.session.meeting,
                me: req.session.me,
                meetings: req.session.meetings,
                tab : 1
            })
        }
    }

    return {
        getIndex,
        postIndex
    };

}

module.exports = meetingsController;
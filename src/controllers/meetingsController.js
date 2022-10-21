const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const { append } = require('express/lib/response');
const { request, response } = require('express');
const session = require('express-session');
const { promises } = require('winston-loki');
const logger = require('../utils/logger')('app');
const debug = require('debug')('app');

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

        //Toggle host privilege for a participant
        if(req.query.updateHost){
            req.session.error = null;
            const coHost = req.session.meeting.participants.items[req.query.index];
            debug(`Request to toggle host privileges for ${coHost.displayName}`);
            debug(`Meeting ID: ${req.session.meeting.id}`);
            try {
                await webexService.updateCoHost(coHost, req.session.meeting.hostEmail ,req.session.access_token);
            } catch (error) {
                debug("Didn't work");
                req.session.error = error.response.data.message;
            }
            req.session.meeting.participants = await webexService.listInvitees(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                error: req.session.error || null,
                tab: 1
            });
        }

        //Remove a meeting participant
        if(req.query.removeParticipant){
            i = req.query.index;
            const participant = req.session.meeting.participants.items[i].id;
            await webexService.removeParticipant(participant, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.participants = await webexService.listInvitees(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                tab: 1,
            });
        }

        // Does request contain a meeting id query
        if(req.query.getMeeting && req.query.index){
            logger.debug('meeting selected');
            meetingPassword = req.session.meetings.items[req.query.index].password
            req.session.meeting = await webexService.getMeeting(req.query.id, meetingPassword, req.session.access_token);
            req.session.meeting.participants = await webexService.listInvitees(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.password = meetingPassword;
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                tab: 1,
            });
        }

        //Change a meeting option
        if(req.query.toggleMeetingOption){
            logger.debug('request to toggle a meeting option')
            nextOccurrence = await webexService.getNextOccurrence(req.session.meeting.id, req.session.meeting.password, req.session.access_token)
            await webexService.toggleMeetingOption(req.session.meeting, nextOccurrence, req.query.option, req.session.access_token);
            req.session.meeting = await webexService.getMeeting(req.session.meeting.id, meetingPassword, req.session.access_token);
            req.session.meeting.participants = await webexService.listInvitees(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
            logger.debug('Option Toggled');
            res.render('meetings',{
                title: params.appName,
                me: req.session.me,
                meetings: req.session.meetings,
                meeting: req.session.meeting,
                tab: 2,
            });
        }

        //Add current user as a host to a meeting and then join the meeting automatically
        if(req.query.forceJoin){
            const i = req.query.index;
            const meetingId = req.session.meetings.items[i].id;
            const newHost = req.session.me.emailAddress;
            const hostEmail = req.session.meetings.items[i].hostEmail;
            const joinUrl = req.session.meetings.items[i].webLink;
            debug(`stop here`);
            const response = await webexService.addParticipant(meetingId, newHost, hostEmail, req.session.access_token);
            const coHost = {
                coHost: false,
                displayName: req.session.me.displayName,
                email: req.session.me.emailAddress,
                id: response.id,
                meetingId: meetingId,
                panelist: false
            }
            await webexService.updateCoHost(coHost, hostEmail ,req.session.access_token);
            req.session.meeting.participants = await webexService.listInvitees(meetingId, hostEmail, req.session.access_token);
            res.redirect(joinUrl);

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
            await webexService.addParticipant(req.session.meeting.id, req.body.newParticipant, req.session.meeting.hostEmail, req.session.access_token);
            req.session.meeting.participants = await webexService.listInvitees(req.session.meeting.id, req.session.meeting.hostEmail, req.session.access_token);
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
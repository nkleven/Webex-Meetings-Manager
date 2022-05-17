const functions = require('../utils/functions');
const params = require('../utils/params');
const webexService = require('../services/webexService');
const logger = require('../utils/logger')('meetingsController');

function meetingsController() {

    function getIndex(req, res){
        res.render('meetings',{
            title: 'Meeting Manager',
          });
    }

    return {
        getIndex
    };

}

module.exports = meetingsController;
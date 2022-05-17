const express = require('express');
const meetingsController = require('../controllers/meetingsController');

const meetingsRoutes = express.Router();

function router(){
    const {
        getIndex,
    } = meetingsController();

    meetingsRoutes.route('/').get(getIndex)

    return meetingsRoutes;
}

module.exports = router;
const express = require('express');
const meetingsController = require('../controllers/meetingsController');

const meetingsRoutes = express.Router();

function router(){
    const {
        getIndex,
        postIndex
    } = meetingsController();

    meetingsRoutes.route('/').get(getIndex).post(postIndex);

    return meetingsRoutes;
}

module.exports = router;
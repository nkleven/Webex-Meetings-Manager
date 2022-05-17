const express = require('express');
const loginController = require('../controllers/loginController');

const loginRoutes = express.Router();

function router() {
  const { getIndex, getCallback } = loginController();

  loginRoutes.route('/').get(getIndex);
  loginRoutes.route('/callback').get(getCallback);

  return loginRoutes;
}

module.exports = router;

const express = require('express');
const communityController = require('../controller/communityController');
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.get('/get-communities', authenticateUser, communityController.getCommunities);

module.exports = Router;
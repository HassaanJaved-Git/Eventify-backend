const express = require('express');
const messageController = require('../controller/messageController');
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.post('/create-message/:communityId', authenticateUser, messageController.createMessage);
Router.get('/get-messages-by-community/:communityId', authenticateUser, messageController.getMessagesByCommunity);

module.exports = Router;
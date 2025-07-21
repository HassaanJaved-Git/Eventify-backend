const express = require('express');

const reviewController = require('../controller/reviewController');
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.post('/:eventId', authenticateUser, reviewController.addReview);

module.exports = Router;
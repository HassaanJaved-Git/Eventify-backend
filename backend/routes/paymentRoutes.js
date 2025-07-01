const express = require('express');
const multer = require('multer');

const paymentController = require('../controller/paymentController');
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.post('/create-checkout-session', authenticateUser, paymentController.createCheckoutSession)
Router.get('/verify-session', paymentController.verifyCheckoutSession);


module.exports = Router;

const express = require('express');
const Router = express.Router();
const paymentController = require('../controller/paymentController');
const authenticateUser = require('../Middleware/userAuth');

Router.post('/initiate-payment', authenticateUser, paymentController.initiatePayment);
Router.post('/update-status', paymentController.updatePaymentStatus);

module.exports = Router;

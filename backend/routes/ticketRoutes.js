const express = require('express');
const multer = require('multer');

const ticketController = require('../controller/ticketController');
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.post('/book-ticket', authenticateUser, ticketController.bookTicket);
Router.post('/verify-ticket', authenticateUser, ticketController.verifyTicket);
Router.get('/get-tickets', authenticateUser, ticketController.getTickets);
Router.get('/get-ticket/:id', authenticateUser, ticketController.getTicketById);
Router.post('/cancel-ticket/:id', authenticateUser, ticketController.cancelTicket);
Router.post('/refund-ticket/:id', authenticateUser, ticketController.refundTicket);
Router.get('/get-tickets-by-event/:eventId', authenticateUser, ticketController.getTicketsByEvent);
Router.get('/get-tickets-by-user', authenticateUser, ticketController.getTicketsByUser);
Router.get('/get-ticket-count', authenticateUser, ticketController.getTicketCount);
Router.get('/get-ticket-count-by-event/:eventId', authenticateUser, ticketController.getTicketCountByEvent);
Router.get('/get-ticket-count-by-user', authenticateUser, ticketController.getTicketCountByUser);
Router.get('/get-ticket-count-by-status', authenticateUser, ticketController.getTicketCountByStatus);
Router.get('/get-ticket-count-by-event-and-user/:eventId', authenticateUser, ticketController.getTicketCountByEventAndUser);


module.exports = Router;
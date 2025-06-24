const express = require('express');
const multer = require('multer');

const eventController = require('../controller/eventController');
const { eventStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: eventStorage });

const Router = express.Router();

Router.get('', eventController.getAllEvents);
Router.get('/past-events', eventController.pastEvents);
Router.post("/create", authenticateUser, upload.single("image"), eventController.createEvent);
Router.get('/get-all-events', authenticateUser, eventController.allEvents); 
Router.get('/:id', eventController.event); 
Router.put('/update/:id', authenticateUser, upload.single("image"), eventController.updateEvent);
Router.patch('/cancel/:id', authenticateUser, eventController.cancelEvent);
Router.delete('/:id', authenticateUser, eventController.deleteEvent);
Router.get('/user/:id', authenticateUser, eventController.eventsOfUser);

module.exports = Router;
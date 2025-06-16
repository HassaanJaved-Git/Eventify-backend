const express = require('express');
const multer = require('multer');

const { getAllEvents, pastEvents, event, createEvent, updateEvent, cancelEvent, deleteEvent, eventsOfUser } = require('../controller/eventController');
const { eventStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: eventStorage });

const Router = express.Router();


Router.get('', getAllEvents);
Router.get('/past-events', pastEvents);
Router.post("/create", authenticateUser, upload.single("image"), createEvent);
Router.get('/:id', event); 
Router.put('/update/:id', authenticateUser, upload.single("image"), updateEvent);
Router.patch('/cancel/:id', authenticateUser, cancelEvent);
Router.delete('/:id', authenticateUser, deleteEvent);
Router.get('/user/:id', authenticateUser, eventsOfUser);

module.exports = Router;
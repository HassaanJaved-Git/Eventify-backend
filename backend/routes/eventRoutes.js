const express = require('express');
const multer = require('multer');

const { createEvent, updateEvent, cancelEvent, deleteEvent } = require('../controller/eventController');
const { eventStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: eventStorage });

const Router = express.Router();

Router.post("/create", authenticateUser, upload.single("image"), createEvent);
Router.put('/:id', authenticateUser, upload.single("image"), updateEvent)
Router.patch('/cancel/:id', authenticateUser, cancelEvent);
Router.delete('/:id', authenticateUser, deleteEvent);

module.exports = Router;
const express = require('express');
const multer = require('multer');

const { createEvent } = require('../controller/eventController');
const { eventStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: eventStorage });

const Router = express.Router();

Router.post("/upload-event", 
    // authenticateUser, 
    createEvent);

module.exports = Router;
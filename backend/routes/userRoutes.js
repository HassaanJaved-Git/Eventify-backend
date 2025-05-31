const express = require('express');
const multer = require('multer');

const {registerUser, loginUser, sendOTP, resetPassword, getLoggedInUser, userProfile, changePassword, setPassword, checkUsername, setUserName, addUserProfilePhoto } = require('../controller/userController');
const { profileStorage } = require('../configuration/cloudinary');

const upload = multer({ storage: profileStorage });
const authenticateUser = require('../Middleware/userAuth');

const Router = express.Router();

Router.post('/register', registerUser);
Router.post("/login", loginUser);
Router.post("/sendOtp", sendOTP);
Router.get('/:username', userProfile);
Router.post("/reset-password", resetPassword);
Router.get("/validate-token", getLoggedInUser);
Router.post("/change-password", authenticateUser, changePassword);
Router.post('/password', authenticateUser, setPassword);
Router.post('/check-username', authenticateUser, checkUsername);
Router.post('/username', authenticateUser, setUserName);
Router.post('/:id/upload-profile-image', upload.single('profileImage'), authenticateUser, addUserProfilePhoto);

module.exports = Router
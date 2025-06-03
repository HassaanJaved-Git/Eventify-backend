const express = require('express');
const multer = require('multer');
const UserModel = require("../schema/userSchema")

const {registerUser, loginUser, sendOTPwithOutToken, resetPassword, getLoggedInUser, userProfile, changePassword, setPassword, checkUsername, setUserName, addUserProfilePhoto, changeEmail, sendOTPwithToken, deleteUser } = require('../controller/userController');
const { profileStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: profileStorage });

const Router = express.Router();

Router.post('/register', registerUser);
Router.post("/login", loginUser);
Router.post("/send-OTP-without-Token", sendOTPwithOutToken);
Router.get('/:username', userProfile);
Router.post("/reset-password", resetPassword);
Router.get("/validate-token", getLoggedInUser);
Router.post("/change-password", authenticateUser, changePassword);
Router.post('/password', authenticateUser, setPassword);
Router.post('/check-username', authenticateUser, checkUsername);
Router.post('/username', authenticateUser, setUserName);
Router.post('/:id/upload-profile-image', upload.single('profileImage'), authenticateUser, addUserProfilePhoto);
Router.post("/sendOTPwithToken", authenticateUser, sendOTPwithToken);
Router.post('/change-email', authenticateUser, changeEmail)
Router.post('/delete', authenticateUser, deleteUser);

module.exports = Router;
const express = require('express');
const multer = require('multer');
const UserModel = require("../schema/userSchema")

const userContoller = require('../controller/userController');
const { profileStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: profileStorage });

const Router = express.Router();

Router.post('/register', userContoller.registerUser);
Router.post("/login", userContoller.loginUser);
Router.post("/send-OTP-without-Token", userContoller.sendOTPwithOutToken);
Router.get('/get-UserName-ProfilePic', authenticateUser, userContoller.getUserNameAndProfilePic);
Router.post("/reset-password", userContoller.resetPassword);
Router.get("/validate-token", userContoller.getLoggedInUser);
Router.post("/change-password", authenticateUser, userContoller.changePassword);
Router.post('/password', authenticateUser, userContoller.setPassword);
Router.post('/check-username', authenticateUser, userContoller.checkUsername);
Router.patch('/setUsername', authenticateUser, userContoller.setUserName);
Router.post("/sendOTPwithToken", authenticateUser, userContoller.sendOTPwithToken);
Router.post('/change-email', authenticateUser, userContoller.changeEmail)
Router.delete('/delete', authenticateUser, userContoller.deleteUser);
Router.get('/:username', userContoller.userProfile);
Router.post('/:id/upload-profile-image', upload.single('profileImage'), authenticateUser, userContoller.addUserProfilePhoto);

module.exports = Router;
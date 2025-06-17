const express = require('express');
const multer = require('multer');
const UserModel = require("../schema/userSchema")

const userController = require('../controller/userController');
const { profileStorage } = require('../configuration/cloudinary');
const authenticateUser = require('../Middleware/userAuth');

const upload = multer({ storage: profileStorage });

const Router = express.Router();

Router.post('/register', userController.registerUser);
Router.post("/login", userController.loginUser);
Router.post("/send-OTP-without-Token", userController.sendOTPwithOutToken);
Router.get('/get-Name-UserName-ProfilePic', authenticateUser, userController.getFullName_UserNameAndProfilePic);
Router.post("/reset-password", userController.resetPassword);
Router.get("/validate-token", userController.getLoggedInUser);
Router.post("/change-password", authenticateUser, userController.changePassword);
Router.post('/password', authenticateUser, userController.setPassword);
Router.post('/check-username', authenticateUser, userController.checkUsername);
Router.patch('/setUsername', authenticateUser, userController.setUserName);
Router.post("/sendOTPwithToken", authenticateUser, userController.sendOTPwithToken);
Router.post('/change-email', authenticateUser, userController.changeEmail)
Router.delete('/delete', authenticateUser, userController.deleteUser);
Router.get('/user-data', authenticateUser, userController.userData)
Router.post('/edit-user', authenticateUser, upload.single('profileImage'), userController.editUser);
Router.get('/:username', userController.userProfile);
Router.post('/:id/upload-profile-image', authenticateUser, upload.single('profileImage'), userController.addUserProfilePhoto);

module.exports = Router;
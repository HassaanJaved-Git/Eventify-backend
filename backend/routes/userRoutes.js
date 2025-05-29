const express = require('express');
const multer = require('multer');

const {registerUser, loginUser, sendOTP, resetPassword, getLoggedInUser, userProfile, changePassword, addUserProfilePhoto} = require('../controller/userController')
const { profileStorage } = require('../configuration/cloudinary');

const upload = multer({ storage: profileStorage });
const authenticateUser = require('../Middleware/userAuth')

const Router = express.Router()

Router.post('/register', registerUser)
Router.post("/login", loginUser)
Router.post("/sendOtp", sendOTP)
Router.get('/:username', userProfile)
Router.post("/resetPassword", resetPassword)
Router.get("/validateToken", getLoggedInUser)
Router.post("/changePassword", authenticateUser, changePassword)
Router.post('/:id/upload-profile-image', upload.single('profileImage'), addUserProfilePhoto)

module.exports = Router
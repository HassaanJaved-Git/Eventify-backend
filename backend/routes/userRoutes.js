const express = require('express')
const {registerUser, loginUser, sendOTP, resetPassword, getLoggedInUser, userProfile, changePassword} = require('../controller/userController')
// const authenticateUser = require('../Middleware/UserAuth')

const Router = express.Router()

Router.post('/register', registerUser)
Router.post("/login", loginUser)
Router.post("/sendOtp", sendOTP)
Router.post("/resetPassword", 
    // authenticateUser, 
    resetPassword)
Router.get("/validateToken", getLoggedInUser)
Router.get('/:username', userProfile)
Router.post("/changePassword", 
    // authenticateUser, 
    changePassword)

module.exports = Router
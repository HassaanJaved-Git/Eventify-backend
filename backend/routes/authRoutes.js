const express = require("express");

const { googleLogin } = require("../controller/authController");

const Router = express.Router();

Router.post("/google", googleLogin);

module.exports = Router;
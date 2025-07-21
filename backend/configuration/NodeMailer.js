const nodemailer = require("nodemailer");

exports.transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { 
        user: process.env.NodeMailerUser, 
        pass: process.env.NodeMailerUserPass
    },
    logger: true,
    debug: true
});
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const express = require('express');
const bcrypt = require("bcrypt");
const dotenv = require('dotenv');

const UserModel = require('../schema/userSchema');
const EventModel = require('../schema/eventSchema');

dotenv.config();

const userSecretKEY = process.env.JWTuserSecretKEY;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { 
        user: process.env.NodeMailerUser, 
        pass: process.env.NodeMailerUserPass
    },
    logger: true,
    debug: true
});


exports.registerUser = async (req, res) => {
    const { email, name, userName,password } = req.body;

    try {
        let existingUserWithEmail = await UserModel.findOne({ email });
        if (existingUserWithEmail) return res.status(400).json({ message: "User already exists." });

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new UserModel({ email, name, userName, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign(
            {
                id: newUser._id,
            },
            userSecretKEY
        );

        res.status(201).json({ message: "User added successfully.", token, user: newUser });
    } 
    catch (error) {
        console.error("Register User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email or Username and password are required' });
    }

    let user;

    try {
        if (email.includes('@')) {
            user = await UserModel.findOne({ email });
        } else {
            user = await UserModel.findOne({ userName: email });
        }

        if (!user) return res.status(400).json({ message: 'Invalid Email or Username' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

        const token = jwt.sign(
            {
                id: user._id,
            },
            userSecretKEY
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user,
        });
    } 
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
}

exports.sendOTPwithOutToken = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({email})
        if (!user) return res.status(400).json({ message: 'Invalid Email' });
        const otp = Math.floor(100000 + Math.random() * 900000);

        const mailOptions = {
            from: process.env.NodeMailerSenderMail,  
            to: email,  
            subject: "Password Reset OTP", 
            text: `Your OTP for password reset is: ${otp}`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Nodemailer error:", err);
                return res.status(500).json({ error: "Error sending OTP email", details: err.message });
            }
            req.session.otp = otp;

            res.status(200).json({ message: "OTP sent successfully", otp });
        })
    } 
    catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
}

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;


    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' });

    if (otp != req.session.otp) return res.status(400).json({ message: "Invalid OTP" });

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await UserModel.findOne({ email: email });

        if (!user) return res.status(400).json({ error: "User not found11111113233333" });

        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id, 
            { password: hashedPassword }, 
            { new: true }
        );

        req.session.otp = null;

        res.status(200).json({ message: "Password updated successfully", user: updatedUser });
    } 
    catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ error: "Error updating password", details: error.message });
    }
}

exports.getLoggedInUser = (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token is missing or invalid' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, userSecretKEY);
        res.status(200).json({ 
            id: decoded.id, 
        });
    } 
    catch (error) {
        console.error("Validation User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.userProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await UserModel.findOne({ userName: username }).select('name userName profileImage createdAt');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const events = await EventModel.find({ organizer: user._id })
        const eventsCount = await EventModel.countDocuments({ organizer: user._id });
        
        res.status(200).json({ user, events, eventsCount });
    } 
    catch (error) {
        console.error("Fetching User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.changePassword = async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) return res.status(400).json({ message: 'Email and passwords are required' });
    
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) return res.status(400).json({ message: "Old Password doesn't match" });

        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id, 
            { password: hashedPassword }, 
            { new: true }
        );

        res.status(200).json({ message: "Password updated successfully", user: updatedUser });
    }
    catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: 'Error changing password', error: error.message });
    }
}

exports.setPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await UserModel.findByIdAndUpdate(req.user.id, {
            password: hashedPassword,
        });

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Error setting password:', err);
        res.status(500).json({ error: 'Server error', error: error.message });
    }
}

exports.checkUsername = async (req, res) => {
    const { userName } = req.body;
    const userExists = await UserModel.findOne({ userName });
    res.json({ available: !userExists });
};

exports.setUserName = async (req, res) => {
    try {
        
        const { userName } = req.body;
        const userId = req.user.id;
        const userExists  = await UserModel.findById(userId);

        if (!userExists) return res.status(404).json({ error: 'User not found' });

        const existingUserName = await UserModel.findOne({ userName });
        if (existingUserName) return res.status(400).json({ message: "UserName already exists." });

        const user = await UserModel.findByIdAndUpdate(userId, { userName }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const token = jwt.sign(
            {
                id: user._id,
            },
            userSecretKEY
        );

        res.status(201).json({ message: "UserName added successfully.", token, user });
    } 
    catch (error) {
        console.error("Setting UserName Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.addUserProfilePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.profileImage?.fileName) {
            await cloudinary.uploader.destroy(user.profileImage.fileName);
        }

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        user.profileImage = {
            imageURL: req.file.path,
            fileName: req.file.filename
        };

        await user.save();

        res.status(200).json({
            message: 'Profile image updated successfully',
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ error: 'Something went wrong while updating the profile image' });
    }
}

exports.sendOTPwithToken = async (req, res) => {
    const { email } = req.user.email;

    try {
        const otp = Math.floor(100000 + Math.random() * 900000);

        const mailOptions = {
            from: process.env.NodeMailerSenderMail,  
            to: req.user.email,  
            subject: "OTP", 
            text: `Your OTP is: ${otp}`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Nodemailer error:", err);
                return res.status(500).json({ error: "Error sending OTP email", details: err.message });
            }
            req.session.otp = otp;

            res.status(200).json({ message: "OTP sent successfully", otp });
        })
    } 
    catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
}

exports.changeEmail = async (req, res) => {
    const { otp, newEmail } = req.body;
    try {
        if (otp != req.session.otp) return res.status(400).json({ message: "Invalid OTP" });

        let existingUserWithEmail = await UserModel.findOne({ email: newEmail });
        if (existingUserWithEmail) return res.status(400).json({ message: "User already exists." });

        await UserModel.findByIdAndUpdate(
            req.user.id, 
            { email: newEmail }, 
            { new: true }
        );

        req.session.otp = null;

        res.json({ message: "Email changed successfully." });

    } catch (error) {
        console.error('Error setting email:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.deleteUser = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found3243254354353" });
        if (user.profileImage?.fileName) {
            await cloudinary.uploader.destroy(user.profileImage.fileName);
        }
        await UserModel.findByIdAndDelete(userId);
        res.status(200).json({ message: "User deleted successfully" });
    } catch {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getUserNameAndProfilePic = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await UserModel.findById(userId).select('userName profileImage');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ userName: user.userName, profileImageURL: user.profileImage.imageURL });
    } catch (error) {
        console.error("Fetching UserName Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    userName: { type: String, unique: true },
    name: { type: String, required: true },
    password: { type: String, default: null },
    role: {type: String, enum: ["admin", "attendee", "organizer"], default: "attendee"},
    profileImage: { 
        imageURL: { type: String },
        fileName: { type: String }
    },
    phone: { type: String,},
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String }
}, { timestamps: true });

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;

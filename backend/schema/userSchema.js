const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {type: String, enum: ["admin", "attendee", "organizer"], default: "attendee"},
    profileImage: { 
        imageURL: { type: String },
        fileName: { type: String }
    },
    phone: { type: String,},
}, { timestamps: true })

const UserModel = mongoose.model("User", userSchema)
module.exports = UserModel

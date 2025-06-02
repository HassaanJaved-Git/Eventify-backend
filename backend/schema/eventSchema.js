const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { 
        address: { type: String, required: true},
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String },
        country: { type: String, required: true },
        coordinates: { type: [Number], index: "2dsphere" },
    },
    category: { type: String, required: true },
    price: { type: Number, default: null },
    image: { 
        imageURL: { type: String },
        fileName: { type: String }
    },
    totalTickets: { type: Number, required: true },
    availableTickets: { type: Number, required: true },
    eventType: { type: String, enum: ["public", "private"], default: "public" },
    privateEventAttendees: [{ type: String, required: true }],
    isCancelled: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const EventModel = mongoose.model("Event", eventSchema);
module.exports = EventModel;
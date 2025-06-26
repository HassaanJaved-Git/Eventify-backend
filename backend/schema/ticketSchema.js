const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticketUsed: { type: Boolean, default: false, require: true }, 
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
    purchaseDate: { type: Date, default: Date.now },
    refundDate: { type: Date, default: null },
    refundReason: { type: String, default: null },
}, { timestamps: true });

const TicketModel = mongoose.model("Ticket", ticketSchema);
module.exports = TicketModel;
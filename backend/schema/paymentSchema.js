const mongoose = require("mongoose");
    
const paymentSchema = new mongoose.Schema({
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentMethod: { type: String, enum: [ "credit_card", "paypal", "bank_transfer", "stripe", "jazzCash", "easypaisa", "payfast", "instant_eft", "snapscan" ], default: "payfast" },
    paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    transactionId: { type: String, unique: true, required: true },
}, { timestamps: true });
    
const PaymentModel = mongoose.model("Payment", paymentSchema);
module.exports = PaymentModel;
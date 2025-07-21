const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['attendee', 'organizer'], required: true },
  text: { type: String, required: true },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  createdAt: { type: Date, default: Date.now }
});

const MessageModel = mongoose.model("Message", messageSchema);
module.exports = MessageModel;
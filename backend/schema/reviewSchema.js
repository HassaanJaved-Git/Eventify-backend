const mongoose = require("mongoose")
    
const reviewSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    comment: { type: String, default: null },
}, { timestamps: true })
    
const ReviewModel = mongoose.model("Review", reviewSchema)
module.exports = ReviewModel

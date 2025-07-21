// controller/reviewController.js
const mongoose = require("mongoose");
const ReviewModel = require('../schema/reviewSchema');
const EventModel = require('../schema/eventSchema');
const UserModel = require('../schema/userSchema'); // ADD THIS

exports.addReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // 1. Validate Event
    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 2. Check if already reviewed
    const existingReview = await ReviewModel.findOne({ event: eventId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this event." });
    }

    // 3. Save Review
    const review = new ReviewModel({
      event: eventId,
      user: userId,
      rating,
      comment,
    });
    await review.save();

    // 4. Update Event Average Rating
    const eventRatingResult = await ReviewModel.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      { $group: { _id: "$event", avgRating: { $avg: "$rating" } } },
    ]);

    if (eventRatingResult.length > 0) {
      const avgRating = parseFloat(eventRatingResult[0].avgRating.toFixed(1));
      event.rating = avgRating;
      await event.save();
    }

    // 5. Update Organizer Average Rating 🟡
    const organizerId = event.organizer;

    // Get all event IDs for this organizer
    const organizerEvents = await EventModel.find({ organizer: organizerId }, '_id');
    const eventIds = organizerEvents.map(e => e._id);

    const organizerRatingResult = await ReviewModel.aggregate([
      { $match: { event: { $in: eventIds } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    if (organizerRatingResult.length > 0) {
      const organizerAvgRating = parseFloat(organizerRatingResult[0].avgRating.toFixed(1));
      await UserModel.findByIdAndUpdate(organizerId, { avgRating: organizerAvgRating });
    }

    // 6. Done
    res.status(201).json({ message: "Review added successfully", review });

  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

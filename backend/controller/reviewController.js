const ReviewModel = require('../schema/reviewSchema');
const EventModel = require('../schema/eventSchema');

exports.addReview = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const review = new ReviewModel({
            event: eventId,
            user: userId,
            rating,
            comment
        });

        await review.save();

        const avgRating = await ReviewModel.aggregate([
            {
                $match: {
                    event: new mongoose.Types.ObjectId(eventId)
                }
            },
            {
                $group: {
                    _id: "$event",
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        if (avgRating.length > 0) {
            const avgRating = parseFloat(avgRatingResult[0].avgRating.toFixed(1)); 

            if (event) {
                event.rating = avgRating;
                await event.save();
            }
        }

        res.status(201).json({ message: "Review added successfully", review });
    } catch (error) {
        console.error("Add Review Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
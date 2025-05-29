const Event = require("../schema/eventSchema");

exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, date, startTime, endTime,
            location, category, price, image,
            totalTickets, eventType, privateEventAttendees
        } = req.body;


        const event = new Event({
            title,
            description,
            organizer: req.user.userId, 
            date,
            startTime,
            endTime,
            location,
            category,
            price: price || null,
            image,
            totalTickets,
            availableTickets: totalTickets, 
            eventType,
            privateEventAttendees: eventType === "private" ? privateEventAttendees : [],
        });

        await event.save();

        res.status(201).json({ message: "Event created successfully", event });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


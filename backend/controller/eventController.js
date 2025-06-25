const EventModel = require("../schema/eventSchema");
const UserModel = require("../schema/userSchema");

exports.getAllEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await EventModel.find({ date: { $gt: currentDate }, isCancelled: false }).populate('organizer', 'name userName profileImage').sort({ date: 1, startTime: 1 });

        res.status(200).json({ events });
    } catch (error) {
        console.error("Fetch Events Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.pastEvents = async (req, res) => {
    try {
        const currentDate = new Date();
        const events = await EventModel.find({ date: { $lt: currentDate }, isCancelled: false }).populate('organizer', 'name userName profileImage').sort({ date: -1, startTime: -1 });

        res.status(200).json({ events });
    } catch (error) {
        console.error("Fetch Past Events Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.event = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await EventModel.findById(eventId).populate('organizer', 'name userName profileImage');
        // .populate('attendees', 'name userName profileImage');
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.isCancelled) return res.status(400).json({ message: "This event has been cancelled" });

        res.status(200).json({ event });

    } catch (error) {
        console.error("Fetch Event Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }        
}

exports.createEvent = async (req, res) => {
    try {
        const {
            title, description, date, startTime, endTime,
            location, category, price,
            totalTickets, eventType, privateEventAttendees
        } = req.body;

        const organizer = await UserModel.findById(req.user.id).select("role");

        if (organizer.role === "attendee") {
            organizer.role = "organizer";
            await organizer.save();
        }

        const event = new EventModel({
            title,
            description,
            organizer: req.user.id,
            date,
            startTime,
            endTime,
            location: JSON.parse(location), 
            category,
            price: price || null,
            image: req.file
                ? {
                    imageURL: req.file.path,
                    fileName: req.file.filename
                }
                : undefined,
            totalTickets,
            availableTickets: totalTickets,
            eventType,
            privateEventAttendees: eventType === "private" ? privateEventAttendees : [],
        });

        await event.save();

        res.status(201).json({ message: "Event created successfully", event });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const {
            title, description, date, startTime, endTime,
            location, category, price,
            totalTickets, eventType, privateEventAttendees
        } = req.body;

        const existingEvent = await EventModel.findById(eventId);
        if (!existingEvent) return res.status(404).json({ message: "Event not found" });

        if (existingEvent.organizer.toString() !== userId) return res.status(403).json({ message: "Unauthorized: Only the organizer can update this event" });

        const event = await EventModel.findByIdAndUpdate(
            eventId,
            {
                title,
                description,
                organizer: req.user.id,
                date,
                startTime,
                endTime,
                location: JSON.parse(location), 
                category,
                price: price || null,
                image: req.file
                    ?  {
                        imageURL: req.file?.path || existingEvent.image.imageURL,
                        fileName: req.file?.originalname || existingEvent.image.fileName
                    }
                    : undefined,
                totalTickets,
                availableTickets: totalTickets,
                eventType,
                privateEventAttendees: eventType === "private" ? privateEventAttendees : [],
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Event updated successfully",
            event: event,
        });
    } catch (error) {
        console.error("Update Event Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });    
    }
}

exports.cancelEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        if (event.organizer.toString() !== userId) return res.status(403).json({ error: 'You are not authorized to cancel this event' });

        if (event.isCancelled) return res.status(400).json({ message: 'Event is already cancelled' });

        event.isCancelled = true;
        await event.save();

        res.status(200).json({ message: 'Event cancelled successfully', event });
    } catch (error) {
        console.error('Cancel Event Error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;

        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.organizer.toString() !== userId) return res.status(403).json({ message: "You are not authorized to delete this event" });

        await EventModel.findByIdAndDelete(eventId);
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Delete Event Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });    
    }
}

exports.eventsOfUser = async (req, res) => {
    const { id } = req.params;
    try {
        const userEvents = await EventModel.find({ organizer: id }).populate('organizer', 'name userName profileImage');
        if (!userEvents) return res.status(404).json({ message: "No events found for this user" });

        res.status(200).json({ events: userEvents });
    } catch (error) {
        console.error("Fetch User Events Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });    }
}

exports.allEvents = async (req, res) => {
    const { userId } = req.user.id;
    try {
        const user = await UserModel.findById(userId).select("role");
        if (user.role !== "admin") return res.status(403).json({ message: "Unauthorized: Only admin can access all events" });
        const events = await EventModel.find().populate('organizer', 'name userName profileImage').sort({ date: 1, startTime: 1 });
        res.status(200).json({ events });
    } catch (error) {
        console.error("Fetch All Events Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
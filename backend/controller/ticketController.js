const QRCode = require('qrcode');

const EventModel = require("../schema/eventSchema");
const UserModel = require("../schema/userSchema");
const TicketModel = require("../schema/ticketSchema");

exports.bookTicket = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.id;

        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.isCancelled) return res.status(400).json({ message: "This event has been cancelled" });
        if (event.availableTickets <= 0) return res.status(400).json({ message: "No tickets available for this event" });

        const ticket = new TicketModel({
            event: eventId,
            user: userId,
            ticketUsed: false,
            status: "booked"
        });

        await ticket.save();

        event.availableTickets -= 1;
        await event.save();

        const qrUrl = `https://eventify.com/attendance/verify/${ticket._id}`;

        const qrCode = await QRCode.toDataURL(qrUrl); // Base64 image

        res.status(201).json({ message: "Ticket booked successfully", ticketId: ticket._id, qrCode  });
    } catch (error) {
        console.error("Book Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.verifyTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id;

        const ticket = await TicketModel.findOne({ _id: ticketId, user: userId }).populate('event', 'organizer title date startTime endTime').populate('user', 'name userName profileImage');
        if (!ticket) return res.status(404).json({ message: "Ticket not found or does not belong to the user" });
        if (ticket.eventId.organizer.toString() !== req.user.id) return res.status(403).send("Not authorized");
        if (ticket.ticketUsed) return res.status(400).json({ message: "Ticket already used" });
        if (ticket.status === "cancelled") return res.status(400).json({ message: "Ticket has been cancelled" });
        ticket.ticketUsed = true; 
        await ticket.save();
        res.status(200).json({ message: "Ticket verified successfully", ticket });

    } catch (error) {
        console.error("Verify Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTickets = async (req, res) => {
    try {
        const tickets = await TicketModel.find().populate('event', 'title date startTime endTime').populate('user', 'name userName profileImage');
        res.status(200).json({ tickets });
    } catch (error) {
        console.error("Fetch Tickets Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketById = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const ticket = await TicketModel
            .findById(ticketId)
            .populate('event', 'title date startTime endTime')
            .populate('user', 'name userName profileImage');
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.status(200).json({ ticket });
    } catch (error) {
        console.error("Fetch Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.cancelTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id;
        // Check if the ticket belongs to the user
        const ticket = await TicketModel.findOne({ _id: ticketId, user: userId });
        if (!ticket) return res.status(404).json({ message: "Ticket not found or does not belong to the user" });
        if (ticket.status === "cancelled") return res.status(400).json({ message: "Ticket already cancelled" });
        if (ticket.ticketUsed) return res.status(400).json({ message: "Ticket already used, cannot cancel" });
        
        ticket.status = "cancelled";
        ticket.ticketUsed = true; // Assuming ticket is used when cancelled
        await ticket.save();

        const event = await EventModel.findById(ticket.event);
        if (event) {
            event.availableTickets += 1;
            await event.save();
        }

        res.status(200).json({ message: "Ticket cancelled successfully", ticket });
    } catch (error) {
        console.error("Cancel Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.refundTicket = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id;
        const { refundReason } = req.body;
        // Check if the ticket belongs to the user
        const ticket = await TicketModel.findOne({ _id: ticketId, user: userId });
        if (!ticket) return res.status(404).json({ message: "Ticket not found or does not belong to the user" });
        if (ticket.status === "cancelled") return res.status(400).json({ message: "Ticket already cancelled" });
        if (ticket.ticketUsed) return res.status(400).json({ message: "Ticket already used, cannot refund" });

        ticket.status = "cancelled";
        ticket.ticketUsed = true; // Assuming ticket is used when refunded
        ticket.refundDate = new Date();
        ticket.refundReason = refundReason || "No reason provided";
        await ticket.save();

        const event = await EventModel.findById(ticket.event);
        if (event) {
            event.availableTickets += 1;
            await event.save();
        }

        res.status(200).json({ message: "Ticket refunded successfully", ticket });
    } catch (error) {
        console.error("Refund Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketsByEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const tickets = await TicketModel.find({ event: eventId })
            .populate('user', 'name userName profileImage');
        res.status(200).json({ tickets });
    } catch (error) {
        console.error("Fetch Tickets by Event Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketsByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await TicketModel.find({ user: userId })
            .populate('event', 'title date startTime endTime')
            .populate('user', 'name userName profileImage');
        res.status(200).json({ tickets });
    } catch (error) {
        console.error("Fetch Tickets by User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketCount = async (req, res) => {
    try {
        const count = await TicketModel.countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        console.error("Fetch Ticket Count Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketCountByEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const count = await TicketModel.countDocuments({ event: eventId });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Fetch Ticket Count by Event Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketCountByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await TicketModel.countDocuments({ user: userId });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Fetch Ticket Count by User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketCountByStatus = async (req, res) => {
    try {
        const { status } = req.query; // e.g., status=booked or status=cancelled
        const count = await TicketModel.countDocuments({ status });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Fetch Ticket Count by Status Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getTicketCountByEventAndUser = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;
        const count = await TicketModel.countDocuments({ event: eventId, user: userId });
        res.status(200).json({ count });
    } catch (error) {
        console.error("Fetch Ticket Count by Event and User Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}   


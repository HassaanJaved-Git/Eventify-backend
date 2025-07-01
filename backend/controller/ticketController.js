const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const {transporter} = require('../configuration/NodeMailer');

const EventModel = require("../schema/eventSchema");
const UserModel = require("../schema/userSchema");
const TicketModel = require("../schema/ticketSchema");

exports.bookTicket = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.id;

        const user = await UserModel.findById(userId);

        const event = await EventModel.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (event.isCancelled) return res.status(400).json({ message: "This event has been cancelled" });
        if (event.availableTickets <= 0) return res.status(400).json({ message: "No tickets available for this event" });

        const alreadyBooked = await TicketModel.findOne({ user: userId, event: eventId });
        if (alreadyBooked) return res.status(400).json({ message: "You have already booked a ticket for this event" });

        const ticket = new TicketModel({
            event: eventId,
            user: userId,
            ticketUsed: false,
            status: "booked"
        });

        await ticket.save();

        event.availableTickets -= 1;
        await event.save();

        const locationString = `${event.location.address}, ${event.location.city}, ${event.location.state}, ${event.location.country}${event.location.zipCode ? `, ${event.location.zipCode}` : ""}`;
        
        const qrUrl = `http://localhost:5173/ticket/verify/${ticket._id}`;
        
        const qrCode = await QRCode.toDataURL(qrUrl);

        ticket.qrCode = qrCode;
        await ticket.save();

        const mailOptions = {
            from: process.env.NodeMailerSenderMail,  
            to: user.email,
            subject: `🎟️ Your Ticket for ${event.title} is Confirmed!`,
            html: `
                <div style="font-family: 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; padding: 20px;">
                    <div style="max-width: 400px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
                    <div style="background: #f8f9fa; padding: 12px 24px; border-bottom: 1px solid #e9ecef;">
                        <span style="font-size: 12px; font-weight: 600; color: #6c757d; letter-spacing: 1px; text-transform: uppercase;">TICKET</span>
                    </div>
                    <div style="padding: 24px;">
                        <h1 style="font-size: 24px; color: #212529; margin-bottom: 16px;">${event.title}</h1>
                        <p style="font-size: 14px; color: #495057; margin-bottom: 4px;"><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                        <p style="font-size: 14px; color: #6c757d; margin-bottom: 20px;"><strong>Location:</strong> ${locationString}</p>

                        <div style="text-align: center; margin: 32px 0;">
                        <img src="cid:ticket_qr" alt="QR Code" style="width: 120px; height: 120px; border: 2px solid #e9ecef; border-radius: 8px; padding: 4px;" />
                        <p style="font-size: 12px; color: #6c757d; margin-top: 8px;">Scan this QR at entry</p>
                        </div>

                        <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase;">
                            <span>Guest</span>
                            <span>Status</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                            <span style="font-size: 16px; color: #212529;">${user.name} &nbsp;</span>
                            <span style="font-size: 14px; color: #28a745; font-weight: 600; background: #d4edda; padding: 4px 12px; border-radius: 12px; border: 1px solid #c3e6cb;">Going</span>
                        </div>
                        </div>

                        <div style="margin-bottom: 20px; border-bottom: 1px solid #e9ecef; padding-bottom: 16px;">
                        <span style="display: block; font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase;">Ticket</span>
                        <span style="font-size: 16px; color: #212529;">1x Standard</span>
                        </div>

                        <div style="display: flex; gap: 12px;">
                        <a href="https://maps.google.com?q=${encodeURIComponent(locationString)}" target="_blank" style="flex: 1; text-align: center; padding: 12px 16px; background: #6c757d; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">🗺️ Get Directions</a>
                        <a href="#" style="flex: 1; text-align: center; padding: 12px 16px; background: #212529; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">📱 Add to Wallet</a>
                        </div>
                    </div>
                    </div>
                </div>
            `,
            attachments: [
                {
                filename: `ticket-${ticket._id}.png`,
                content: qrCode.split("base64,")[1],
                encoding: "base64",
                cid: "ticket_qr"
                }
            ]
        }
        
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Nodemailer error:", err);
                return res.status(500).json({ error: "Error sending Ticket email", details: err.message });
            }
            res.status(201).json({ message: "Ticket booked successfully", ticketId: ticket._id, qrCode  });
        })

    } catch (error) {
        console.error("Book Ticket Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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
            .populate('event', 'title date startTime endTime location')
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
        const ticket = await TicketModel.findOne({ _id: ticketId, user: userId });
        if (!ticket) return res.status(404).json({ message: "Ticket not found or does not belong to the user" });
        if (ticket.status === "cancelled") return res.status(400).json({ message: "Ticket already cancelled" });
        if (ticket.ticketUsed) return res.status(400).json({ message: "Ticket already used, cannot cancel" });
        
        ticket.status = "cancelled";
        ticket.ticketUsed = true; 
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
        const ticket = await TicketModel.findOne({ _id: ticketId, user: userId });
        if (!ticket) return res.status(404).json({ message: "Ticket not found or does not belong to the user" });
        if (ticket.status === "cancelled") return res.status(400).json({ message: "Ticket already cancelled" });
        if (ticket.ticketUsed) return res.status(400).json({ message: "Ticket already used, cannot refund" });

        ticket.status = "cancelled";
        ticket.ticketUsed = true; 
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
        const { status } = req.query; 
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


const { v4: uuidv4 } = require('uuid');
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const EventModel = require('../schema/eventSchema');
const TicketModel = require('../schema/ticketSchema');
const PaymentModel = require('../schema/paymentSchema');
const UserModel = require('../schema/userSchema');

const { updateMany } = require('../schema/eventSchema');
const {transporter} = require('../configuration/NodeMailer');

exports.initiatePayment = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await EventModel.findById(eventId);
    if (!event || event.price <= 0) {
      return res.status(400).json({ message: "Invalid or free event" });
    }

    const transactionId = uuidv4();

    const newPayment = new PaymentModel({
      event: eventId,
      user: userId,
      ticket: null,
      amount: event.price,
      currency: "ZAR",
      paymentMethod: "payfast",
      paymentStatus: "pending",
      transactionId
    });

    await newPayment.save();

    const data = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${process.env.PAYFAST_RETURN_URL}?transactionId=${transactionId}`,
      cancel_url: `${process.env.PAYFAST_CANCEL_URL}?transactionId=${transactionId}`,
      notify_url: process.env.PAYFAST_NOTIFY_URL,
      amount: event.price.toFixed(2),
      item_name: event.title,
      m_payment_id: transactionId
    };

    const queryString = Object.entries(data)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    const payfastURL = `https://sandbox.payfast.co.za/eng/process?${queryString}`;
    res.json({ url: payfastURL });
  } catch (error) {
    console.error("PayFast Init Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    const payment = await PaymentModel.findOne({ transactionId }).populate("event user");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.paymentStatus = status;

    if (status === "completed" && !payment.ticket) {
      const event = payment.event;
      const user = payment.user;

      if (!event || !user) {
        return res.status(400).json({ message: "Invalid event or user reference in payment" });
      }

      // Generate Ticket
      const newTicket = new TicketModel({
        event: event._id,
        user: user._id,
        ticketUsed: false,
        status: "booked"
      });

      await newTicket.save();

      // Decrease available tickets
      event.availableTickets -= 1;
      await event.save();

      // Generate QR code
      const qrUrl = `http://localhost:5173/ticket/verify/${newTicket._id}`;
      const qrCode = await QRCode.toDataURL(qrUrl);
      newTicket.qrCode = qrCode;
      await newTicket.save();

      // Email
      const locationString = `${event.location.address}, ${event.location.city}, ${event.location.state}, ${event.location.country}${event.location.zipCode ? `, ${event.location.zipCode}` : ""}`;

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
                    <span style="font-size: 16px; color: #212529;">${user.name}</span>
                    <span style="font-size: 14px; color: #28a745; font-weight: 600; background: #d4edda; padding: 4px 12px; border-radius: 12px; border: 1px solid #c3e6cb;">Going</span>
                  </div>
                </div>

                <div style="margin-bottom: 20px; border-bottom: 1px solid #e9ecef; padding-bottom: 16px;">
                  <span style="display: block; font-size: 12px; color: #6c757d; font-weight: 500; text-transform: uppercase;">Ticket</span>
                  <span style="font-size: 16px; color: #212529;">1x Paid Ticket</span>
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
            filename: `ticket-${newTicket._id}.png`,
            content: qrCode.split("base64,")[1],
            encoding: "base64",
            cid: "ticket_qr"
          }
        ]
      };

      // Send mail
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Email Error:", err);
          return res.status(500).json({ message: "Ticket booked, but email failed", ticketId: newTicket._id });
        }

        console.log("Email sent:", info.response);
      });

      // Link ticket in payment
      payment.ticket = newTicket._id;
    }

    await payment.save();
    res.json({ message: "Payment status updated and ticket handled.", ticket: payment.ticket });

  } catch (error) {
    console.error("Error while updating payment:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
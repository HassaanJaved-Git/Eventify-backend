const { v4: uuidv4 } = require('uuid');

const EventModel = require('../schema/eventSchema');
const TicketModel = require('../schema/ticketSchema');
const PaymentModel = require('../schema/paymentSchema');

const { updateMany } = require('../schema/eventSchema');

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
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    const payment = await PaymentModel.findOne({ transactionId }).populate("event user");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.paymentStatus = status;

    if (status === "completed" && !payment.ticket) {
      const newTicket = new TicketModel({
        event: payment.event._id,
        user: payment.user._id,
        ticketUsed: false,
        status: "booked",
        qrCode: `eventify-ticket-${uuidv4()}`
      });

      await newTicket.save();

      payment.ticket = newTicket._id;
    }

    await payment.save();
    res.json({ message: "Payment status updated and ticket handled." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
};
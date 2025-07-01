const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EventModel = require('../schema/eventSchema');
const TicketModel = require('../schema/ticketSchema');
const PaymentModel = require('../schema/paymentSchema');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { eventId, ticketQuantity = 1 } = req.body;
    const userId = req.user._id; 

    const event = await EventModel.findById(eventId);
    if (!event || event.price === 0) {
      return res.status(400).json({ error: 'Invalid or free event' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: event.title,
            },
            unit_amount: event.price * 100,
          },
          quantity: ticketQuantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.ReactOrigin}/ticket/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.ReactOrigin}/ticket/cancel`,
      metadata: {
        eventId,
        userId,
        ticketQuantity,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyCheckoutSession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'No session ID provided' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Create ticket
    const ticket = await TicketModel.create({
      user: session.metadata.userId,
      event: session.metadata.eventId,
      quantity: session.metadata.ticketQuantity,
      ticketUsed: false,
    });

    // Create payment record
    const payment = await PaymentModel.create({
      ticket: ticket._id,
      user: session.metadata.userId,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentMethod: 'stripe',
      paymentStatus: 'completed',
      transactionId: session.id,
    });

    res.json({ success: true, ticket, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed' });
  }
};
const cloudinary = require("cloudinary").v2;
const session = require("express-session");
const socketIo = require("socket.io");
const passport = require('passport');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require("http");

const UserRoutes = require('./routes/userRoutes');
const EventRoutes = require('./routes/eventRoutes');
// const ReviewRoutes = require('./routes/reviewRoutes');
const TicketRoutes = require('./routes/ticketRoutes');
// const PaymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
app.use(express.json());
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.ReactOrigin,
        methods: ['GET', 'POST']
    }
});


app.use(cors({
    origin: process.env.ReactOrigin,
    credentials: true
}));

app.use(express.json());

app.use(
    session({
        secret: process.env.sessionSecretKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            sameSite: 'lax'
        }
    })
);

app.use('/api/user', UserRoutes);
app.use('/api/event', EventRoutes);
// app.use('/api/review', ReviewRoutes);
app.use('/api/ticket', TicketRoutes);
// app.use('/api/payment', PaymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

app.set('io', io);

const PORT = 5000;

mongoose.connect(process.env.MongoDB)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

server.listen(PORT, () => { 
    console.log(`Server with socket.io running on http://localhost:${PORT}`);
});

module.exports = io;
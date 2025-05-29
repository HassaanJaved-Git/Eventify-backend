const express = require('express');
const session = require("express-session");
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require("http");
const socketIo = require("socket.io");

const UserRoutes = require('./routes/userRoutes');
const EventRoutes = require('./routes/eventRoutes');
// const ReviewRoutes = require('./routes/reviewRoutes')
// const TicketRoutes = require('./routes/ticketRoutes')
// const PaymentRoutes = require('./routes/paymentRoutes')

dotenv.config();
const app = express();

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
app.use('/api/user', UserRoutes);
app.use('/api/event', EventRoutes);
// app.use('/api/review', ReviewRoutes)
// app.use('/api/ticket', TicketRoutes)
// app.use('/api/payment', PaymentRoutes)

app.use(
    session({
        secret: process.env.sessionSecretKey,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            sameSite: 'lax'
        }
    })
);


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
    .catch(err => console.log(err))

server.listen(PORT, () => { 
    console.log(`Server with socket.io running on http://localhost:${PORT}`);
});

module.exports = io;
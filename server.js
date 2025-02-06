const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const {Server} = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const GroupMessage = require("./models/GroupMessage");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.static("views"));
app.use("/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.log(error));

const users = {};

// Socket.io events
io.on("connection", (socket) => {
    console.log("User connected: ", socket.id);

    socket.on("joinRoom", ({room, username}) => {
        socket.join(room);
        if (!users[room]) {
            users[room] = [];
        }
        if (!users[room].includes(username)) {
            users[room].push(username);
        }
        io.to(room).emit("roomUsers", { users: users[room] });

        const data = {
            username: "Chat Bot",
            message: username + " has joined the room.",
            date_sent: new Date(),
            room: room,
        };

        io.to(room).emit("message", data);
        saveMessage(data);
    });

    socket.on("chatMessage", (data) => {
        io.to(data.room).emit("message", {
            username: data.username,
            message: data.message,
            date_sent: new Date(),
        });
        saveMessage(data);
    });

    socket.on("leaveRoom", ({room, username}) => {
        console.log("User left room: ", room);
        socket.leave(room);
        if (!users[room]) {
            return;
        }
        users[room] = users[room].filter((user) => user !== username);
        io.to(room).emit("roomUsers", { users: users[room] });

        const data = {
            username: "Chat Bot",
            message: username + " has left the room.",
            date_sent: new Date(),
            room: room,
        };
        io.to(room).emit("message", data);
        saveMessage(data);
    });

    socket.on("typing", (data) => {
        io.to(data.room).emit("typing", data);
    });

});

saveMessage = async (data) => {
    const message = new GroupMessage({
        from_user: data.username,
        message: data.message,
        room: data.room,
        date_sent: data.date_sent,
    });
    console.log(message);
    await message.save();
};

server.listen(3000, () => console.log("Server running on port 3000"));

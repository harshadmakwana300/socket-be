const express = require("express");
const app = express();
var cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
app.use(cors());

const userSchema = new Schema({
  lat: {
    type: String,
    required: true,
  },
  long: {
    type: String,
    required: true,
  },
});

const userModel = mongoose.model("user", userSchema);

mongoose
  .connect("mongodb://localhost:27017/socket")
  .then(() => console.log("Connected db,..!"));

let socketConnectedUsers = [];

// const io = new Server(server);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  allowEIO3: true,
});

io.on("connection", (socket) => {
  socketConnectedUsers.push({
    socketId: socket.id,
    id: socket.handshake.headers?.id,
    name: socket.handshake.headers?.name,
  });
  console.log("a user connected", JSON.stringify(socketConnectedUsers));

  socket.on("update_location", (data) => {
    userModel
      .create({
        lat: data.lat,
        long: data.long,
      })
      .then(() => {
        io.to(socket.id).emit("ack_update_location", { success: 1, data });
        socket.broadcast.emit("location_updated", data);
      })
      .catch((err) => {
        io.to(socket.id).emit("ack_update_location", { success: 0 });
      });
  });

  socket.on("disconnect", () => {
    socketConnectedUsers = socketConnectedUsers.filter(
      (user) => user.socketId !== socket.id
    );
    console.log("user disconnected", JSON.stringify(socketConnectedUsers));
  });
});

server.listen(8888, () => {
  console.log("listening on *:8888");
});

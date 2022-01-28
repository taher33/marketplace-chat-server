const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const mongoose = require("mongoose");
const { signUp } = require("./routes/handleAuth");
const handlechat = require("./routes/handlechat");
const asyncRedis = require("async-redis");

const server = http.createServer(app);

const dotenv = require("dotenv").config({
  path: "./config.env",
});
let redisClient;
if (process.env.ENVIRONMENT === "prod") {
  redisClient = asyncRedis.createClient({
    host: process.env.REDIS_ENDPOINT,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS,
  });
} else {
  redisClient = asyncRedis.createClient();
}

redisClient.on("error", function (err) {
  console.log("Error " + err);
});

redisClient.on("connect", function (err) {
  console.log("Error " + err);
});
//
const io = require("socket.io")(server, {
  cors: {
    origin:
      process.env.ENVIRONMENT === "dev"
        ? "http://localhost:3000"
        : process.env.CLIENT,
    methods: ["GET", "POST"],
  },
});

mongoose.connect(
  `mongodb+srv://taher:${process.env.MONGO_PASS}@cluster0.1iwzt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (data) => console.log(data, "connected")
);

app.get("/", (req, res) => {
  res.send("hey there");
});

// function to wrap the express middleware
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
//socket middleware

//functions
const onConnection = (socket) => {
  signUp(io, socket, redisClient);
  handlechat(io, socket, redisClient);

  socket.on("disconnecting", async () => {
    const id = [...socket.rooms][1];
    try {
      const usersString = await redisClient.smembers("users");

      let users = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id === id);
      if (!!users.length) {
        let user = JSON.stringify(users[0]);
        await redisClient.srem("users", user);
      }
    } catch (err) {
      console.log(err);
    }
  });

  // io.of("/").adapter.on("join-room", (room, id) => {
  //   console.log(`socket ${id} has joined room ${room}`);
  // });
};

//connection
io.on("connection", onConnection);

server.listen(process.env.PORT || 8080, () => {
  console.log("listening on port:8080");
});

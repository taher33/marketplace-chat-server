const { handleError } = require("../utils/errors");
const User = require("../models/user");
const Messages = require("../models/messages");
const mongoose = require("mongoose");

exports.signUp = (io, socket, redisClient) => {
  const setConnectedUsers = async (payload, cb) => {
    try {
      const { user } = payload;
      const ConnectedUser = JSON.stringify(user);
      const usersString = await redisClient.smembers("users");
      let users = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id === user._id);
      if (!users[0]) {
        await redisClient.sadd("users", ConnectedUser);
      }
      cb({ status: "success" });
      socket.join(user._id);
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const getConnectedUsers = async (payload, cb) => {
    try {
      const usersString = await redisClient.smembers("users");
      let Connectedusers = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id !== payload._id)
        .map((el) => el._id);

      // const client = await User.findById(payload._id)
      //   .populate({
      //     path: "threads",
      //     populate: {
      //       path: "clients",
      //       model: "User",
      //     },
      //   })
      //   .populate({
      //     path: "threads",
      //     populate: {
      //       path: "messages",
      //       model: "Messages",
      //     },
      //   })
      //   .exec();
      cb({ status: "success", Connectedusers });
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const onDisconnect = async () => {
    console.log(Object.keys(socket.rooms));
    try {
      // let users = usersString
      //   .map((user) => JSON.parse(user))
      //   .filter((el) => el._id === id);
      // if (!!users.length) {
      //   let user = JSON.stringify(users[0]);
      //   console.log(user);
      //   // await redisClient.srem("users", user);
      //   console.log("removed");
      // }
    } catch (err) {
      console.log(err);
    }
  };

  socket.on("connect to server", setConnectedUsers);
  socket.on("get connected users", getConnectedUsers);
  // socket.on("disconnecting", onDisconnect);
};

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

  /**
   *threads:
   *client:id
   *otherUser:id
   *messages:[id,id,id]
   updatedAt:time
   createdat:time
   *-------
   user:
   thread:[id,id,id]
   -----
  create new thread:
  first message

  -----
  last seen:
  create message -> unseen
  indication to the reciever
  reciever online
  the gababoy compares:
  how?
  on recieving new privet message lites up if he is not selected
  light out when selected
   *  
   */

  const getConnectedUsers = async (payload, cb) => {
    try {
      const usersString = await redisClient.smembers("users");
      let Connectedusers = usersString
        .map((user) => JSON.parse(user))
        .filter((el) => el._id !== payload._id)
        .map((el) => el._id);

      const client = await User.findById(payload._id)
        .populate({
          path: "threads",
          populate: {
            path: "clients",
            model: "User",
          },
        })
        .exec();

      // });
      // const threads = await Messages.aggregate([
      //   {
      //     $match: {
      //       $or: [
      //         { sender: new mongoose.Types.ObjectId(payload._id) },
      //         { reciever: new mongoose.Types.ObjectId(payload._id) },
      //       ],
      //     },
      //   },
      //   { $group: { _id: "$sender", lastMessage: { $last: "$content" } } },
      //   { $sort: { createAt: 1 } },
      // ]);
      // const threads2 = await Messages.aggregate([
      //   {
      //     $match: {
      //       $or: [
      //         { sender: new mongoose.Types.ObjectId(payload._id) },
      //         { reciever: new mongoose.Types.ObjectId(payload._id) },
      //       ],
      //     },
      //   },
      //   { $group: { _id: "$reciever", lastMessage: { $last: "$content" } } },
      //   { $sort: { createAt: 1 } },
      // ]);
      // const set = new Set(threads2, threads);

      // const arr = [...set];
      //?  cant be sure about this one
      // const recentUsers = await User.find({
      //   _id: { $in: arr },
      // });

      // arr.forEach((el, index) => {
      //   el.user = recentUsers[index];
      // });

      // let users = allUsers.filter((el) => el._id !== payload._id);

      cb({ status: "success", threads: client.threads, Connectedusers });
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const onDisconnect = async () => {
    //!this needs work
    console.log("disconnect");
    // try {
    //   const user = JSON.stringify({
    //     name: socket.user.data.name,
    //     email: socket.user.data.email,
    //     id: socket.user.data.id,
    //   });
    //   //remove the user from redis
    //   await redisClient.srem("users", user);
    //   console.log("disconnect");
    // } catch (err) {
    //   console.log(err);
    // }
  };

  socket.on("connect to server", setConnectedUsers);
  socket.on("get connected users", getConnectedUsers);
  socket.on("disconnect", onDisconnect);
};

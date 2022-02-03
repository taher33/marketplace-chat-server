const Messages = require("../models/messages");
const Notifications = require("../models/notification");
const User = require("../models/user");
const Thread = require("../models/threads");
const { handleError } = require("../utils/errors");

module.exports = (io, socket, client) => {
  async function privateMessage(payload, cb) {
    if (!payload.threadId)
      return cb({ status: "error", error: "threadId not provided" });

    const { content, threadId, sender } = payload;
    try {
      const thread = await Thread.findById(threadId);
      if (!thread)
        return cb({ status: "error", error: "thread does not exist" });

      let reciever;
      if (`${thread.clients[0]}` === sender) reciever = thread.clients[1];
      else reciever = thread.clients[0];

      let msg = {
        sender,
        reciever,
        content,
        read: false,
      };

      const usersString = await client.smembers("users");

      const users = usersString.map((user) => JSON.parse(user));
      const user = users.filter((user) => {
        return user._id === `${reciever}`;
      });
      if (user.length !== 0) {
        socket.to(`${reciever}`).emit("private message", { msg, threadId });
      }

      const newMessage = await Messages.create({
        sender,
        content,
        reciever,
      });

      thread.messages.push(newMessage);
      thread.save({ validateBeforeSave: false });

      cb({ status: "success", msg });
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  }

  const newPrivateMessage = async (payload, cb) => {
    const { sender, reciever, content, productId } = payload;
    if (!reciever || !sender || !content || !productId)
      return cb({
        error: "please specify the following : message content ,product",
        status: "error",
      });
    try {
      const client = await User.findById(sender);
      const partner = await User.findById(reciever);

      const [prevThread] = await Thread.find({
        clients: sender,
        productThread: true,
        product: productId,
      });
      const message = await Messages.create({ sender, content, reciever });

      if (!client || !partner) return cb({ status: "error" });

      if (prevThread) {
        prevThread.messages.push(message._id);
        prevThread.save({ validateBeforeSave: false });
        return cb({ status: "success" });
      }
      const thread = await Thread.create({
        clients: [sender, reciever],
        messages: [message],
        productThread: true,
        product: productId,
      });

      console.log("thread", thread);
      client.threads.push(thread._id);
      partner.threads.push(thread._id);
      client.save({ validateBeforeSave: false });
      partner.save({ validateBeforeSave: false });

      cb({ status: "success" });
    } catch (err) {
      console.log(err);
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  const getMessages = async (payload, cb) => {
    const { threadId } = payload;
    if (!threadId)
      return cb({ status: "error", error: "thread id not provided" });
    try {
      const thread = await Thread.findById(threadId).populate("messages");
      cb({ status: "success", prevMessages: thread.messages });
    } catch (err) {
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  socket.on("private message", privateMessage);
  socket.on("new private message", newPrivateMessage);
  socket.on("get previous messages", getMessages);
};

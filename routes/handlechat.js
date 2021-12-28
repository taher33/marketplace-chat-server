const Messages = require("../models/messages");
const Notifications = require("../models/notification");
const Thread = require("../models/threads");
const { handleError } = require("../utils/errors");

module.exports = (io, socket, client) => {
  async function privateMessage(payload, cb) {
    if (!payload.sender) return cb({ status: "error", error: "login please" });
    if (!payload.reciever)
      return cb({ status: "error", error: "select a user" });
    if (!payload.content)
      return cb({ status: "error", error: "select a user" });

    const { reciever, sender, content, threadId } = payload;
    try {
      const usersString = await client.smembers("users");

      const users = usersString.map((user) => JSON.parse(user));
      const user = users.filter((user) => user._id === reciever);

      let msg = {
        reciever,
        sender,
        content,
      };
      if (user.length !== 0) {
        socket.to(reciever).emit("private message", msg);
      } else {
        //create notification in case user is not connected
        await Notifications.create({
          type: "message",
          client: reciever,
          body: content,
          creator: sender,
        });
      }

      const newMessage = await Messages.create({
        sender,
        content,
        reciever,
      });
      if (threadId) {
        const thread = await Thread.findByIdAndUpdate(threadId, {
          messages: this.messages,
        });
      } else {
        const thread = await Thread.create({
          client: sender,
          partner: reciever,
          messages: [newMessage._id],
        });
      }

      cb({ status: "success", msg });
    } catch (err) {
      const error = handleError(err);
      cb({ status: "error", error });
    }
  }

  const getMessages = async (payload, cb) => {
    const { sender, reciever } = payload;
    if (!sender) return cb({ status: "error", error: "please login first" });
    if (!reciever)
      return cb({ status: "error", error: "please select a user first" });
    try {
      const prevMessages = await Messages.find({
        sender: [reciever, sender],
        reciever: [sender, reciever],
      });
      cb({ status: "success", prevMessages });
    } catch (err) {
      const error = handleError(err);
      cb({ status: "error", error });
    }
  };

  socket.on("private message", privateMessage);
  socket.on("get previous messages", getMessages);
};

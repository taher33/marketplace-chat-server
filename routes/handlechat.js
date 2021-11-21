const Messages = require("../models/messages");
const Users = require("../models/users");
const { handleError } = require("../utils/errors");
const { handleToken } = require("../utils/jwt-token");

module.exports = (io, socket, client) => {
  async function privateMessage(payload, cb) {
    if (!payload.sender) return cb({ status: "error", error: "login please" });
    if (!payload.reciever)
      return cb({ status: "error", error: "select a user" });
    if (!payload.content)
      return cb({ status: "error", error: "select a user" });

    const { reciever, sender, content } = payload;
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
      }

      await Messages.create({
        sender,
        content,
        reciever,
      });

      cb({ status: "success", msg });
    } catch (err) {
      const error = handleError(err);
      cb({ status: "error", error });
    }
  }
  const getMessages = async (payload, cb) => {
    const selectedUserID = payload.id;

    let prevMessages = [];
    try {
      const prevmsg1 = await Messages.find({
        sender: selectedUserID,
        reciever: socket.user.data.id,
      });
      const prevmsg2 = await Messages.find({
        sender: socket.user.data.id,
        reciever: selectedUserID,
      });
      prevMessages = [...prevmsg1, ...prevmsg2];
      prevMessages.sort((msg1, msg2) => {
        return msg1.createdAt - msg2.createdAt;
      });
      cb({ message: prevMessages });
    } catch (err) {
      const error = handleError(err);
      cb({ error });
    }
  };

  socket.on("private message", privateMessage);
  socket.on("get previous messages", getMessages);
};

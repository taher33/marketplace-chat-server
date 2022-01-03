const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    required: [true, "must specify sender of the message"],
    ref: "User",
  },
  content: {
    type: String,
    required: [true, "must specify content of the message"],
  },
  reciever: {
    type: mongoose.Types.ObjectId,
    required: [true, "must specify sender of the message"],
    ref: "User",
  },
  read: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Messages", messageSchema);

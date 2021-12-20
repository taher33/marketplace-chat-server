const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["message", "user action"],
    required: [
      true,
      "please provide the type of notification you want to create",
    ],
  },
  body: {
    type: String,
    required: [true, "provide a body to your notification"],
  },
  creator: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  client: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  createdAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

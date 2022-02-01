const mongoose = require("mongoose");
const threadSchema = new mongoose.Schema({
  clients: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
  ],
  messages: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Messages" }],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  productThread: { type: Boolean, default: false },
  product: { type: mongoose.SchemaTypes.ObjectId, ref: "Products" },
});

threadSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("Thread", threadSchema);

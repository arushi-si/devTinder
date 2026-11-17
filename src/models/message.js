const mongoose = require("mongoose");
const { MESSAGE_MAX_LENGTH } = require("../utils/constants");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxLength: MESSAGE_MAX_LENGTH,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, senderId: 1, readAt: 1 });

module.exports = mongoose.model("Message", messageSchema);

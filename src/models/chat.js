const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (arr) => arr.length === 2,
        message: "A chat must have exactly 2 participants",
      },
    },
    // sorted "<idA>_<idB>" so there's exactly one chat per pair
    participantsKey: { type: String, required: true, unique: true },
    lastMessage: {
      text: String,
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true },
);

chatSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);

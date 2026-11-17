const mongoose = require("mongoose");

/**
 * One record per pair of users describes their relationship:
 *  ignored    – fromUser swiped left on toUser
 *  interested – fromUser swiped right, waiting for toUser to review
 *  accepted   – connected (can message)
 *  rejected   – toUser rejected the request, or either side unmatched
 *  blocked    – blockedBy blocked the other user (fromUserId = blocker)
 * Any record hides the two users from each other's feed.
 */
const connectionReqSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // reference to the User model
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      // used when only some values are acceptable
      enum: {
        values: ["ignored", "interested", "accepted", "rejected", "blocked"],
        message: "{VALUE} is incorrect status type",
      },
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

connectionReqSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
connectionReqSchema.index({ toUserId: 1, status: 1 });
connectionReqSchema.index({ fromUserId: 1, status: 1 });

// function called pre -> save (event); throwing aborts the save
connectionReqSchema.pre("save", function () {
  if (this.fromUserId.equals(this.toUserId))
    throw new Error("Request can't be sent to self");
});

const ConnectionReqModel = mongoose.model(
  "ConnectionRequest",
  connectionReqSchema,
);

module.exports = ConnectionReqModel;

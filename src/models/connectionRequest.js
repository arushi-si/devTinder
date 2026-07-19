const mongoose = require("mongoose");

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
        values: ["ignored", "interested", "accepted", "rejected"],
        message: "{VALUE} is incorrect status type",
      },
    },
  },
  { timestamps: true },
);

connectionReqSchema.index({ fromUserId: 1, toUserId: 1 });

// function called pre -> save (event)
connectionReqSchema.pre("save", function () {
  const connectionReq = this;
  if (connectionReq.fromUserId.equals(connectionReq.toUserId))
    throw new Error("Request can't be sent to self");

  next();
});

const ConnectionReqModel = mongoose.model(
  "ConnectionRequest",
  connectionReqSchema,
);

module.exports = ConnectionReqModel;

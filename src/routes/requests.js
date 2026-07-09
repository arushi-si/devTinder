const express = require("express");
const requestRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const { userAuth } = require("../middlewares/auth");

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      const allowedStatus = ["ignored", "interested"];
      const toUser = await User.findById(toUserId);

      if (!allowedStatus.includes(status))
        throw new Error("Invalid status type: " + status);

      if (!toUser)
        return res.status(404).json({ message: "ERROR! User not found." });

      const reqAlreadyExists = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });

      if (reqAlreadyExists)
        throw new Error("Connection request already exists");

      const connectionReq = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionReq.save();

      res.json({ message: "Request sent successfully!", data });
    } catch (e) {
      res.status(400).send("ERROR! " + e.message);
    }
  },
);

module.exports = requestRouter;

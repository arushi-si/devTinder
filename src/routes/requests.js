const express = require("express");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const { HttpError } = require("../middlewares/errorHandler");
const { ensureObjectId } = require("../utils/validations");
const { pairQuery, findPairRecord } = require("../utils/permissions");
const { closeChatRoom } = require("../utils/socket");
const { SEND_STATUSES, REVIEW_STATUSES } = require("../utils/constants");

const requestRouter = express.Router();

// validates :userId-style params and that the target user exists
const getTargetUser = async (me, targetId) => {
  ensureObjectId(targetId, "userId");
  if (me.equals(targetId)) throw new HttpError(400, "You can't do this to yourself");
  const target = await User.exists({ _id: targetId });
  if (!target) throw new HttpError(404, "User not found");
};

// swipe: right = interested, left = ignored
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  const fromUserId = req.user._id;
  const { status, toUserId } = req.params;

  if (!SEND_STATUSES.includes(status))
    throw new HttpError(400, "Invalid status type: " + status);
  await getTargetUser(fromUserId, toUserId);

  const existing = await findPairRecord(fromUserId, toUserId);
  if (existing) {
    // mutual swipe right -> instant match
    if (
      status === "interested" &&
      existing.status === "interested" &&
      existing.fromUserId.equals(toUserId)
    ) {
      existing.status = "accepted";
      await existing.save();
      return res.json({ message: "It's a match!", matched: true, data: existing });
    }
    // don't reveal that the other user blocked us
    if (existing.status === "blocked") throw new HttpError(404, "User not found");
    throw new HttpError(409, "You have already interacted with this user");
  }

  const data = await ConnectionRequest.create({ fromUserId, toUserId, status });
  res.status(201).json({
    message: status === "interested" ? "Request sent successfully!" : "User passed",
    matched: false,
    data,
  });
});

// withdraw a pending request I sent
requestRouter.delete("/request/send/:toUserId", userAuth, async (req, res) => {
  const { toUserId } = req.params;
  ensureObjectId(toUserId, "userId");
  const { deletedCount } = await ConnectionRequest.deleteOne({
    fromUserId: req.user._id,
    toUserId,
    status: "interested",
  });
  if (!deletedCount) throw new HttpError(404, "No pending request to withdraw");
  res.json({ message: "Request withdrawn" });
});

// accept / reject a request I received
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  const { status, requestId } = req.params;
  if (!REVIEW_STATUSES.includes(status))
    throw new HttpError(400, "Invalid status type: " + status);
  ensureObjectId(requestId, "requestId");

  const connectionReq = await ConnectionRequest.findOne({
    _id: requestId,
    toUserId: req.user._id,
    status: "interested",
  });
  if (!connectionReq) throw new HttpError(404, "Connection request not found.");

  connectionReq.status = status;
  const data = await connectionReq.save();
  res.json({ message: `Request ${status}`, data });
});

// unmatch: connection becomes "rejected" so they don't reappear in each other's feed
requestRouter.delete("/request/connection/:userId", userAuth, async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  ensureObjectId(userId, "userId");

  const connection = await ConnectionRequest.findOneAndUpdate(
    { ...pairQuery(me, userId), status: "accepted" },
    { $set: { status: "rejected" } },
    { returnDocument: "after" },
  );
  if (!connection) throw new HttpError(404, "Connection not found");

  closeChatRoom(me, userId, "unmatched");
  res.json({ message: "Unmatched successfully" });
});

// block: overrides whatever relationship existed (incl. an active connection)
requestRouter.post("/request/block/:userId", userAuth, async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  await getTargetUser(me, userId);

  const existing = await findPairRecord(me, userId);
  if (existing?.status === "blocked")
    return res.json({ message: "User blocked" }); // already blocked (by either side)

  if (existing) {
    existing.set({ fromUserId: me, toUserId: userId, status: "blocked", blockedBy: me });
    await existing.save();
  } else {
    await ConnectionRequest.create({
      fromUserId: me,
      toUserId: userId,
      status: "blocked",
      blockedBy: me,
    });
  }

  closeChatRoom(me, userId, "blocked");
  res.json({ message: "User blocked" });
});

// unblock: removes the record entirely, so the users can see each other in the feed again
requestRouter.delete("/request/block/:userId", userAuth, async (req, res) => {
  const { userId } = req.params;
  ensureObjectId(userId, "userId");
  const { deletedCount } = await ConnectionRequest.deleteOne({
    ...pairQuery(req.user._id, userId),
    status: "blocked",
    blockedBy: req.user._id,
  });
  if (!deletedCount) throw new HttpError(404, "You haven't blocked this user");
  res.json({ message: "User unblocked" });
});

module.exports = requestRouter;

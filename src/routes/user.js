const express = require("express");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middlewares/auth");
const { HttpError } = require("../middlewares/errorHandler");
const { ensureObjectId } = require("../utils/validations");
const { findPairRecord } = require("../utils/permissions");
const { USER_SAFE_DATA } = require("../utils/constants");

const userRouter = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// pending requests others sent me (swiped right on me)
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  const requests = await ConnectionRequest.find({
    toUserId: req.user._id,
    status: "interested",
  })
    .sort({ createdAt: -1 })
    .populate("fromUserId", USER_SAFE_DATA);
  res.json(requests.filter((r) => r.fromUserId)); // skip deleted users
});

// pending requests I sent
userRouter.get("/user/requests/sent", userAuth, async (req, res) => {
  const requests = await ConnectionRequest.find({
    fromUserId: req.user._id,
    status: "interested",
  })
    .sort({ createdAt: -1 })
    .populate("toUserId", USER_SAFE_DATA);
  res.json(requests.filter((r) => r.toUserId));
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  const me = req.user._id;
  const connections = await ConnectionRequest.find({
    $or: [
      { toUserId: me, status: "accepted" },
      { fromUserId: me, status: "accepted" },
    ],
  })
    .sort({ updatedAt: -1 })
    .populate("fromUserId toUserId", USER_SAFE_DATA);

  const data = connections
    .map((c) => (c.fromUserId?._id.equals(me) ? c.toUserId : c.fromUserId))
    .filter(Boolean);
  res.json(data);
});

// users I blocked (not users who blocked me)
userRouter.get("/user/blocked", userAuth, async (req, res) => {
  const blocks = await ConnectionRequest.find({
    status: "blocked",
    blockedBy: req.user._id,
  })
    .sort({ updatedAt: -1 })
    .populate("toUserId", USER_SAFE_DATA);
  res.json(blocks.map((b) => b.toUserId).filter(Boolean));
});

// people I swiped left on, newest first, so a pass can be undone (DELETE /request/swipe/:userId)
userRouter.get("/user/passed", userAuth, async (req, res) => {
  const passes = await ConnectionRequest.find({ fromUserId: req.user._id, status: "ignored" })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("toUserId", USER_SAFE_DATA);
  res.json(passes.map((p) => p.toUserId).filter(Boolean));
});

// users I haven't interacted with yet. ?page=1&limit=10&skills=react,node
userRouter.get("/user/feed", userAuth, async (req, res) => {
  const me = req.user._id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const records = await ConnectionRequest.find({
    $or: [{ toUserId: me }, { fromUserId: me }],
  })
    .select("fromUserId toUserId")
    .lean();

  const hideUsersFromFeed = records.map((r) =>
    r.fromUserId.equals(me) ? r.toUserId : r.fromUserId,
  );
  hideUsersFromFeed.push(me);

  const filter = { _id: { $nin: hideUsersFromFeed } };
  if (req.query.skills) {
    const skills = String(req.query.skills)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length)
      filter.skills = { $in: skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")) };
  }

  const data = await User.find(filter)
    .select(USER_SAFE_DATA)
    .sort({ isDemo: 1, createdAt: -1 }) // real people first, demo profiles after
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json(data);
});

// single profile + my relationship with that user. Must stay below the static /user/* routes.
userRouter.get("/user/:userId", userAuth, async (req, res) => {
  const me = req.user._id;
  const { userId } = req.params;
  ensureObjectId(userId, "userId");

  if (me.equals(userId)) return res.json({ ...req.user.toJSON(), connection: null });

  const record = await findPairRecord(me, userId);
  // blocked users (either direction) don't exist for each other — except the blocker can still view
  const blockedByMe = record?.status === "blocked" && record.blockedBy?.equals(me);
  if (record?.status === "blocked" && !blockedByMe)
    throw new HttpError(404, "User not found");

  const user = await User.findById(userId).select(USER_SAFE_DATA).lean();
  if (!user) throw new HttpError(404, "User not found");

  res.json({
    ...user,
    connection: record
      ? {
          requestId: record._id,
          status: record.status,
          sentByMe: record.fromUserId.equals(me),
        }
      : null,
  });
});

module.exports = userRouter;

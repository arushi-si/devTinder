const express = require("express");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const Message = require("../models/message");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middlewares/auth");
const { HttpError } = require("../middlewares/errorHandler");
const { assertCanMessage, findChat, sendMessage, markRead } = require("../utils/chat");
const { emitNewMessage, emitMessagesRead, scheduleDemoReply } = require("../utils/socket");
const { USER_SAFE_DATA } = require("../utils/constants");

const chatRouter = express.Router();

// inbox: one entry per chat with a currently-connected user, latest first
chatRouter.get("/chats", userAuth, async (req, res) => {
  const me = req.user._id;

  const connections = await ConnectionRequest.find({
    $or: [{ fromUserId: me }, { toUserId: me }],
    status: "accepted",
  })
    .select("fromUserId toUserId")
    .lean();
  const connectedIds = new Set(
    connections.map((c) => (c.fromUserId.equals(me) ? c.toUserId : c.fromUserId).toString()),
  );

  const chats = await Chat.find({ participants: me, lastMessageAt: { $ne: null } })
    .sort({ lastMessageAt: -1 })
    .populate("participants", USER_SAFE_DATA)
    .lean();

  const visible = chats
    .map((chat) => ({
      chat,
      user: chat.participants.find((p) => p && !p._id.equals(me)),
    }))
    .filter(({ user }) => user && connectedIds.has(user._id.toString()));

  const unread = await Message.aggregate([
    {
      $match: {
        chatId: { $in: visible.map(({ chat }) => chat._id) },
        senderId: { $ne: new mongoose.Types.ObjectId(String(me)) },
        readAt: null,
      },
    },
    { $group: { _id: "$chatId", count: { $sum: 1 } } },
  ]);
  const unreadByChat = new Map(unread.map((u) => [u._id.toString(), u.count]));

  res.json(
    visible.map(({ chat, user }) => ({
      chatId: chat._id,
      user,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      unreadCount: unreadByChat.get(chat._id.toString()) || 0,
    })),
  );
});

// history with one connection. ?before=<ISO date of oldest loaded message>&limit=30
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const me = req.user._id;
  const { targetUserId } = req.params;
  await assertCanMessage(me, targetUserId);

  const limit = Math.min(Math.max(parseInt(req.query.limit) || 30, 1), 100);
  const before = req.query.before ? new Date(req.query.before) : null;
  if (before && isNaN(before)) throw new HttpError(400, "Invalid 'before' date");

  const [user, chat] = await Promise.all([
    User.findById(targetUserId).select(USER_SAFE_DATA).lean(),
    findChat(me, targetUserId),
  ]);
  if (!user) throw new HttpError(404, "User not found");

  let messages = [];
  if (chat) {
    const query = { chatId: chat._id };
    if (before) query.createdAt = { $lt: before };
    // fetch one extra to know whether older messages exist
    messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit + 1).lean();
  }
  const hasMore = messages.length > limit;
  messages = messages.slice(0, limit).reverse(); // oldest -> newest

  res.json({ chatId: chat?._id || null, user, messages, hasMore });
});

// REST fallback for sending (socket "sendMessage" is preferred)
chatRouter.post("/chat/:targetUserId", userAuth, async (req, res) => {
  const me = req.user._id;
  const { targetUserId } = req.params;
  const message = await sendMessage(me, targetUserId, req.body?.text);
  emitNewMessage(me, targetUserId, message);
  scheduleDemoReply(me, targetUserId);
  res.status(201).json(message);
});

chatRouter.post("/chat/:targetUserId/read", userAuth, async (req, res) => {
  const me = req.user._id;
  const { targetUserId } = req.params;
  const result = await markRead(me, targetUserId);
  emitMessagesRead(me, targetUserId, result);
  res.json(result);
});

module.exports = chatRouter;

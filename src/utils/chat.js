const Chat = require("../models/chat");
const Message = require("../models/message");
const { canMessage } = require("./permissions");
const { HttpError } = require("../middlewares/errorHandler");
const { ensureObjectId } = require("./validations");
const { MESSAGE_MAX_LENGTH } = require("./constants");

const pairKey = (a, b) => [a.toString(), b.toString()].sort().join("_");
const chatRoomId = (a, b) => `chat:${pairKey(a, b)}`;
const userRoomId = (userId) => `user:${userId}`;

const assertCanMessage = async (me, targetUserId) => {
  ensureObjectId(targetUserId, "userId");
  if (me.toString() === targetUserId.toString())
    throw new HttpError(400, "You can't message yourself");
  if (!(await canMessage(me, targetUserId)))
    throw new HttpError(403, "You can only message your connections");
};

const findChat = (a, b) => Chat.findOne({ participantsKey: pairKey(a, b) });

const getOrCreateChat = (a, b) => {
  const participantsKey = pairKey(a, b);
  return Chat.findOneAndUpdate(
    { participantsKey },
    { $setOnInsert: { participants: [a, b], participantsKey } },
    { upsert: true, returnDocument: "after" },
  );
};

const sendMessage = async (senderId, targetUserId, rawText) => {
  await assertCanMessage(senderId, targetUserId);

  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (!text) throw new HttpError(400, "Message can't be empty");
  if (text.length > MESSAGE_MAX_LENGTH)
    throw new HttpError(400, `Message can't exceed ${MESSAGE_MAX_LENGTH} characters`);

  const chat = await getOrCreateChat(senderId, targetUserId);
  const message = await Message.create({ chatId: chat._id, senderId, text });

  chat.lastMessage = { text, senderId, createdAt: message.createdAt };
  chat.lastMessageAt = message.createdAt;
  await chat.save();

  return message;
};

// marks every unread message sent by targetUserId to me as read
const markRead = async (me, targetUserId) => {
  await assertCanMessage(me, targetUserId);
  const chat = await findChat(me, targetUserId);
  if (!chat) return { chatId: null, readAt: null, count: 0 };

  const readAt = new Date();
  const { modifiedCount } = await Message.updateMany(
    { chatId: chat._id, senderId: targetUserId, readAt: null },
    { $set: { readAt } },
  );
  return { chatId: chat._id, readAt, count: modifiedCount };
};

module.exports = {
  pairKey,
  chatRoomId,
  userRoomId,
  assertCanMessage,
  findChat,
  sendMessage,
  markRead,
};

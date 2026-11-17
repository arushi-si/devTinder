const { Server } = require("socket.io");
const { getUserFromToken, getUserFromSocketToken } = require("../middlewares/auth");
const { CLIENT_ORIGINS } = require("./constants");
const {
  chatRoomId,
  userRoomId,
  assertCanMessage,
  sendMessage,
  markRead,
} = require("./chat");

let io = null;

const SEND_LIMIT = 10; // messages
const SEND_WINDOW_MS = 10 * 1000; // per 10 seconds per user
const sendLog = new Map(); // userId -> recent send timestamps

const isRateLimited = (userId) => {
  const now = Date.now();
  const recent = (sendLog.get(userId) || []).filter((t) => now - t < SEND_WINDOW_MS);
  if (recent.length >= SEND_LIMIT) {
    sendLog.set(userId, recent);
    return true;
  }
  recent.push(now);
  sendLog.set(userId, recent);
  return false;
};

const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join("="))]),
  );

const reply = (ack, payload) => {
  if (typeof ack === "function") ack(payload);
};

const errorPayload = (e) => ({
  ok: false,
  status: e.status || 500,
  error: e.status ? e.message : "Something went wrong",
});

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: CLIENT_ORIGINS, credentials: true },
  });

  // Production: short-lived token from GET /socket-token (the socket is cross-site, so no cookie).
  // Local dev: falls back to the session cookie.
  io.use(async (socket, next) => {
    const authToken = socket.handshake.auth?.token;
    const user = authToken
      ? await getUserFromSocketToken(authToken)
      : await getUserFromToken(parseCookies(socket.handshake.headers.cookie).token);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = user._id.toString();
    next();
  });

  io.on("connection", (socket) => {
    const me = socket.data.userId;
    // personal room: inbox updates / notifications for this user
    socket.join(userRoomId(me));

    socket.on("joinChat", async ({ targetUserId } = {}, ack) => {
      try {
        await assertCanMessage(me, targetUserId);
        const roomId = chatRoomId(me, targetUserId);
        socket.join(roomId);
        reply(ack, { ok: true, roomId });
      } catch (e) {
        reply(ack, errorPayload(e));
      }
    });

    socket.on("leaveChat", ({ targetUserId } = {}, ack) => {
      if (targetUserId) socket.leave(chatRoomId(me, targetUserId));
      reply(ack, { ok: true });
    });

    socket.on("sendMessage", async ({ targetUserId, text } = {}, ack) => {
      try {
        if (isRateLimited(me))
          return reply(ack, { ok: false, status: 429, error: "You're sending messages too fast" });
        const message = await sendMessage(me, targetUserId, text);
        emitNewMessage(me, targetUserId, message);
        reply(ack, { ok: true, message });
      } catch (e) {
        reply(ack, errorPayload(e));
      }
    });

    socket.on("typing", ({ targetUserId, isTyping } = {}) => {
      if (!targetUserId) return;
      const roomId = chatRoomId(me, targetUserId);
      // only sockets that passed joinChat's permission check are in the room
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit("typing", { userId: me, isTyping: !!isTyping });
    });

    socket.on("markRead", async ({ targetUserId } = {}, ack) => {
      try {
        const result = await markRead(me, targetUserId);
        emitMessagesRead(me, targetUserId, result);
        reply(ack, { ok: true, ...result });
      } catch (e) {
        reply(ack, errorPayload(e));
      }
    });
  });

  return io;
};

// shared by socket handlers and REST routes
const emitNewMessage = (senderId, targetUserId, message) => {
  if (!io) return;
  io.to(chatRoomId(senderId, targetUserId)).emit("messageReceived", message);
  // inbox update for the recipient even if they don't have the chat open
  io.to(userRoomId(targetUserId)).emit("inboxUpdated", {
    fromUserId: senderId.toString(),
    message,
  });
};

const emitMessagesRead = (readerId, targetUserId, { chatId, readAt, count }) => {
  if (!io || !count) return;
  io.to(chatRoomId(readerId, targetUserId)).emit("messagesRead", {
    chatId,
    readerId: readerId.toString(),
    readAt,
  });
};

// called on block / unmatch: notify both users and kick sockets out of the room
const closeChatRoom = (a, b, reason) => {
  if (!io) return;
  const roomId = chatRoomId(a, b);
  const payload = { reason, userIds: [a.toString(), b.toString()] };
  io.to(roomId).to(userRoomId(a)).to(userRoomId(b)).emit("chatClosed", payload);
  io.in(roomId).socketsLeave(roomId);
};

module.exports = { initSocket, emitNewMessage, emitMessagesRead, closeChatRoom };

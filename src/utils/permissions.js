const ConnectionRequest = require("../models/connectionRequest");

// matches the relationship record between two users, in either direction
const pairQuery = (a, b) => ({
  $or: [
    { fromUserId: a, toUserId: b },
    { fromUserId: b, toUserId: a },
  ],
});

const findPairRecord = (a, b) => ConnectionRequest.findOne(pairQuery(a, b));

const isBlockedBetween = async (a, b) =>
  !!(await ConnectionRequest.exists({ ...pairQuery(a, b), status: "blocked" }));

// messaging is only allowed between connected (accepted) users
const canMessage = async (a, b) =>
  !!(await ConnectionRequest.exists({ ...pairQuery(a, b), status: "accepted" }));

module.exports = { pairQuery, findPairRecord, isBlockedBetween, canMessage };

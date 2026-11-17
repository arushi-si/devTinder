const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SOCKET_TOKEN_EXPIRY } = require("../utils/constants");

// Session tokens (the login cookie) have no "purpose" claim; socket tokens have purpose "socket".
// Checking the purpose means a socket token can't be used as a session cookie and vice versa.
const verifyUser = async (token, purpose) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if ((payload.purpose || "session") !== purpose) return null;
    return await User.findById(payload._id);
  } catch {
    return null;
  }
};

const getUserFromToken = (token) => verifyUser(token, "session");
const getUserFromSocketToken = (token) => verifyUser(token, "socket");

const createSocketToken = (userId) =>
  jwt.sign({ _id: userId, purpose: "socket" }, process.env.JWT_SECRET, {
    expiresIn: SOCKET_TOKEN_EXPIRY,
  });

const userAuth = async (req, res, next) => {
  const user = await getUserFromToken(req.cookies?.token);
  if (!user) return res.status(401).json({ error: "Please log in" });
  req.user = user;
  next();
};

module.exports = {
  userAuth,
  getUserFromToken,
  getUserFromSocketToken,
  createSocketToken,
};

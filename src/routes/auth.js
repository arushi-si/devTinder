const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const { validateSignUpData } = require("../utils/validations");
const { HttpError } = require("../middlewares/errorHandler");
const { userAuth, createSocketToken } = require("../middlewares/auth");
const { COOKIE_OPTIONS, JWT_EXPIRY_MS } = require("../utils/constants");

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again in a few minutes" },
});

const setAuthCookie = (res, user) => {
  res.cookie("token", user.getJWT(), { ...COOKIE_OPTIONS, maxAge: JWT_EXPIRY_MS });
};

authRouter.post("/signup", authLimiter, async (req, res) => {
  const body = req.body || {};
  validateSignUpData(body);
  const {
    firstName,
    lastName,
    emailId,
    password,
    age,
    gender,
    about,
    skills,
    photoUrl,
    headline,
    location,
    githubUrl,
    experienceLevel,
  } = body;

  if (await User.exists({ emailId: String(emailId).toLowerCase().trim() }))
    throw new HttpError(409, "Email is already registered");

  const user = new User({
    firstName,
    lastName,
    emailId,
    password: await bcrypt.hash(password, 10),
    age,
    gender,
    about,
    skills,
    photoUrl,
    headline,
    location,
    githubUrl,
    experienceLevel,
  });
  await user.save();

  // log the user in straight away
  setAuthCookie(res, user);
  res.status(201).json(user);
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { emailId, password } = req.body || {};
  if (!emailId || !password || !validator.isEmail(String(emailId)))
    throw new HttpError(400, "Email and password are required");

  const user = await User.findOne({ emailId: String(emailId).toLowerCase().trim() });
  // same response for unknown email and wrong password
  if (!user || !(await user.verifyPassword(String(password))))
    throw new HttpError(401, "Invalid credentials!");

  setAuthCookie(res, user);
  res.json(user);
});

// The FE fetches this (through its /api proxy, so the cookie is sent) and passes the token
// in the socket.io handshake, because the socket connects to this server directly.
authRouter.get("/socket-token", userAuth, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ token: createSocketToken(req.user._id) });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "User logged out successfully!" });
});

module.exports = authRouter;

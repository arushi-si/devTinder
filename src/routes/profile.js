const express = require("express");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth");
const { HttpError } = require("../middlewares/errorHandler");
const {
  validateEditProfileData,
  validatePassword,
} = require("../utils/validations");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, (req, res) => {
  res.json(req.user);
});

profileRouter.patch("/profile", userAuth, async (req, res) => {
  validateEditProfileData(req.body);
  const loggedInUser = req.user;
  Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
  await loggedInUser.save();
  res.json({ message: "Profile updated successfully!", data: loggedInUser });
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    throw new HttpError(400, "currentPassword and newPassword are required");

  const loggedInUser = req.user;
  if (!(await loggedInUser.verifyPassword(String(currentPassword))))
    throw new HttpError(401, "Current password is incorrect");
  validatePassword(newPassword);
  if (currentPassword === newPassword)
    throw new HttpError(400, "New password must be different");

  loggedInUser.password = await bcrypt.hash(newPassword, 10);
  await loggedInUser.save();
  res.json({ message: "Password updated successfully!" });
});

module.exports = profileRouter;

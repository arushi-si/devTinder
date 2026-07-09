const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validations");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const { user } = req;
    res.send("User " + user);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

profileRouter.patch("/profile", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) throw new Error("Invalid Edit Request");
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    res.send("Edit done sucessfully!");
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

module.exports = profileRouter;

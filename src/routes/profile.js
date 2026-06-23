const express = require("express");
const { userAuth } = require("../middlewares/auth");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const { user } = req;
    res.send("User " + user);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

module.exports = profileRouter;

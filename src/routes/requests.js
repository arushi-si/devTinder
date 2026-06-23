const express = require("express");
const requestRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

requestRouter.post("/sendConnectionRequest", userAuth, async (req, res) => {
  try {
    const { user } = req;
    res.send("User sent connection request " + user.firstName);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

module.exports = requestRouter;

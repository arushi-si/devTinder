const express = require("express");
const userRouter = express.Router();
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const SAFE_DATA = ["firstName", "lastName"];

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested",
    }).populate("fromUserId", SAFE_DATA); // second param can also be just 1 string with fields space separated
    res.json(requests);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const requests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    }).populate("fromUserId toUserId", SAFE_DATA);

    const data = requests.map((req) => {
      if (req.fromUserId._id.equals(loggedInUser._id)) return req.toUserId;
      return req.fromUserId;
    });
    res.json(data);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit; // max limit is 50

    const requests = await ConnectionRequest.find({
      $or: [{ toUserId: loggedInUser._id }, { fromUserId: loggedInUser._id }],
    }).populate("fromUserId toUserId", SAFE_DATA);

    const hideUsersFromFeed = new Set();
    requests.forEach((req) => {
      if (req.fromUserId._id.equals(loggedInUser._id))
        hideUsersFromFeed.add(req.toUserId._id);
      else hideUsersFromFeed.add(req.fromUserId._id);
    });

    const data = await User.find({
      _id: { $nin: [...hideUsersFromFeed, loggedInUser._id] },
    })
      .select(SAFE_DATA.join(" "))
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(data);
  } catch (e) {
    res.status(400).send("ERROR! " + e.message);
  }
});

module.exports = userRouter;

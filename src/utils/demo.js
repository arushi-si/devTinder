// Behaviour of the seeded demo accounts, so a new user (or a recruiter) gets a full experience
// on an empty platform: demo users like back, send likes to new signups, and reply in chat.
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const { DEMO_REPLIES } = require("./demoData");

const DEMO_LIKES_ON_SIGNUP = 3;

const isDemoUser = async (userId) =>
  !!(await User.exists({ _id: userId, isDemo: true }));

// A few demo users "swipe right" on a new signup so their Requests tab isn't empty.
const sendDemoLikes = async (newUserId) => {
  try {
    const admirers = await User.aggregate([
      { $match: { isDemo: true } },
      { $sample: { size: DEMO_LIKES_ON_SIGNUP } },
      { $project: { _id: 1 } },
    ]);
    if (!admirers.length) return;
    await ConnectionRequest.insertMany(
      admirers.map((a) => ({ fromUserId: a._id, toUserId: newUserId, status: "interested" })),
      { ordered: false },
    );
  } catch (e) {
    console.error("sendDemoLikes failed", e.message);
  }
};

const pickReply = () => DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];

module.exports = { isDemoUser, sendDemoLikes, pickReply };

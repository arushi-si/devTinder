// Seeds demo profiles (isDemo: true). Safe to run repeatedly: profiles are upserted by email.
//
//   npm run seed          create / refresh demo users
//   npm run seed:clean    delete demo users and everything linked to them (requests, chats, messages)
//
// Uses MONGODB_URI from .env, so it seeds whichever database .env points at (local or production).
// Demo accounts get a random password nobody knows, so they can't be logged into,
// unless DEMO_PASSWORD is set (handy for testing the demo side locally).
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/user");
const ConnectionRequest = require("../src/models/connectionRequest");
const Chat = require("../src/models/chat");
const Message = require("../src/models/message");
const { demoProfiles } = require("../src/utils/demoData");

const seed = async () => {
  const password = process.env.DEMO_PASSWORD || crypto.randomBytes(24).toString("base64url");
  const hash = await bcrypt.hash(password, 10);

  let created = 0;
  for (const profile of demoProfiles()) {
    const { emailId, ...fields } = profile;
    const result = await User.updateOne(
      { emailId },
      { $set: fields, $setOnInsert: { emailId, password: hash } },
      { upsert: true, runValidators: true },
    );
    if (result.upsertedCount) created++;
  }
  const total = await User.countDocuments({ isDemo: true });
  console.log(`Demo users: ${created} created, ${total} total.`);
  if (process.env.DEMO_PASSWORD) console.log("Demo accounts use DEMO_PASSWORD from .env.");
};

const clean = async () => {
  const demoIds = (await User.find({ isDemo: true }).select("_id").lean()).map((u) => u._id);
  const chats = await Chat.find({ participants: { $in: demoIds } }).select("_id").lean();
  const chatIds = chats.map((c) => c._id);

  const [msgs, chatsDel, reqs, users] = await Promise.all([
    Message.deleteMany({ chatId: { $in: chatIds } }),
    Chat.deleteMany({ _id: { $in: chatIds } }),
    ConnectionRequest.deleteMany({
      $or: [{ fromUserId: { $in: demoIds } }, { toUserId: { $in: demoIds } }],
    }),
    User.deleteMany({ _id: { $in: demoIds } }),
  ]);
  console.log(
    `Removed ${users.deletedCount} demo users, ${reqs.deletedCount} requests, ` +
      `${chatsDel.deletedCount} chats, ${msgs.deletedCount} messages.`,
  );
};

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(process.env.MONGODB_URI);
  const host = new URL(process.env.MONGODB_URI.replace(/^mongodb(\+srv)?:/, "http:")).host;
  console.log(`Connected to ${host}/${mongoose.connection.name}`);
  try {
    if (process.argv.includes("--clean")) await clean();
    else await seed();
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

const mongoose = require("mongoose");

const connectDb = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(process.env.MONGODB_URI);
};

module.exports = { connectDb };

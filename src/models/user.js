const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minLength: 4, maxLength: 50 },
    lastName: { type: String },
    emailId: { type: String, required: true, unique: true, trim: true },
    password: { type: String },
    age: { type: Number, min: 18 },
    gender: {
      type: String,
      validate(val) {
        if (!["male", "female", "others"].includes(val))
          throw new Error("Gender data is not valid!");
      },
    },
    about: { type: String, default: "This is a default info!" },
    skills: [String],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;

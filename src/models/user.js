const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minLength: 4, maxLength: 50 },
    lastName: { type: String },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate(val) {
        const isEmailValid = validator.isEmail(val);
        if (!isEmailValid) throw new Error("Invalid Email");
      },
    },
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

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "DEV@TINDER13#", {
    expiresIn: "1d",
  });
  return token;
};

userSchema.methods.verifyPassword = async function (userInputPwd) {
  const user = this;
  const isPwdValid = await bcrypt.compare(userInputPwd, user.password);
  return isPwdValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;

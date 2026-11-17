const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const DEFAULT_PHOTO_URL = "https://www.gravatar.com/avatar/?d=mp&s=400";

const isUrl = (val) =>
  !val || validator.isURL(val, { protocols: ["http", "https"], require_protocol: true });

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      index: true,
      minLength: 2,
      maxLength: 50,
    },
    lastName: { type: String, trim: true, maxLength: 50 },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(val) {
        if (!validator.isEmail(val)) throw new Error("Invalid Email");
      },
    },
    password: { type: String, required: true },
    age: { type: Number, min: 18, max: 100 },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: "{VALUE} is not a valid gender",
      },
    },
    photoUrl: {
      type: String,
      trim: true,
      default: DEFAULT_PHOTO_URL,
      validate: { validator: isUrl, message: "photoUrl must be a valid http(s) URL" },
    },
    headline: { type: String, trim: true, maxLength: 100 },
    location: { type: String, trim: true, maxLength: 100 },
    githubUrl: {
      type: String,
      trim: true,
      validate: { validator: isUrl, message: "githubUrl must be a valid http(s) URL" },
    },
    experienceLevel: {
      type: String,
      enum: {
        values: ["student", "junior", "mid", "senior", "lead"],
        message: "{VALUE} is not a valid experience level",
      },
    },
    about: {
      type: String,
      default: "This is a default info!",
      maxLength: 500,
    },
    skills: {
      type: [{ type: String, trim: true, maxLength: 30 }],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "You can add at most 10 skills",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      // never leak the password hash or internal version key
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// index for fast querying
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ skills: 1 });

userSchema.methods.getJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

userSchema.methods.verifyPassword = function (userInputPwd) {
  return bcrypt.compare(userInputPwd, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

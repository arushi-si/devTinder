const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  GENDERS,
  EXPERIENCE_LEVELS,
  PROMPT_QUESTIONS,
  LIMITS,
} = require("../utils/constants");

const DEFAULT_PHOTO_URL = "https://www.gravatar.com/avatar/?d=mp&s=400";

const isUrl = (val) =>
  !val || validator.isURL(val, { protocols: ["http", "https"], require_protocol: true });

const maxItems = (max, label) => ({
  validator: (arr) => !arr || arr.length <= max,
  message: `You can add at most ${max} ${label}`,
});

// Uploaded photos (Cloudinary). publicId is null for external images (e.g. demo avatars).
const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      validate: { validator: isUrl, message: "Photo url must be a valid http(s) URL" },
    },
    publicId: { type: String, default: null },
  },
  { _id: false },
);

const promptSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      enum: { values: PROMPT_QUESTIONS, message: "{VALUE} is not a valid prompt" },
    },
    answer: {
      type: String,
      required: [true, "Prompt answer is required"],
      trim: true,
      maxLength: LIMITS.promptAnswer,
    },
  },
  { _id: false },
);

// Hobby / personality projects ("the valentine website I built", "a bot that waters my plants")
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Project title is required"],
    trim: true,
    maxLength: LIMITS.projectTitle,
  },
  description: { type: String, trim: true, maxLength: LIMITS.projectDescription },
  url: {
    type: String,
    trim: true,
    validate: { validator: isUrl, message: "Project url must be a valid http(s) URL" },
  },
  repoUrl: {
    type: String,
    trim: true,
    validate: { validator: isUrl, message: "Project repoUrl must be a valid http(s) URL" },
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: { validator: isUrl, message: "Project imageUrl must be a valid http(s) URL" },
  },
  tags: {
    type: [{ type: String, trim: true, maxLength: LIMITS.skill }],
    validate: maxItems(LIMITS.projectTags, "tags per project"),
  },
});

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
      enum: { values: GENDERS, message: "{VALUE} is not a valid gender" },
    },
    // Main photo. Kept in sync with photos[0] when photos change; falls back to a default avatar.
    photoUrl: {
      type: String,
      trim: true,
      default: DEFAULT_PHOTO_URL,
      validate: { validator: isUrl, message: "photoUrl must be a valid http(s) URL" },
    },
    photos: {
      type: [photoSchema],
      default: [],
      validate: maxItems(LIMITS.photos, "photos"),
    },
    headline: { type: String, trim: true, maxLength: LIMITS.shortText },
    location: { type: String, trim: true, maxLength: LIMITS.shortText },
    githubUrl: {
      type: String,
      trim: true,
      validate: { validator: isUrl, message: "githubUrl must be a valid http(s) URL" },
    },
    experienceLevel: {
      type: String,
      enum: { values: EXPERIENCE_LEVELS, message: "{VALUE} is not a valid experience level" },
    },
    about: { type: String, trim: true, maxLength: LIMITS.about },
    skills: {
      type: [{ type: String, trim: true, maxLength: LIMITS.skill }],
      validate: maxItems(LIMITS.skills, "skills"),
    },
    prompts: {
      type: [promptSchema],
      default: [],
      validate: [
        maxItems(LIMITS.prompts, "prompts"),
        {
          validator: (arr) => new Set(arr.map((p) => p.question)).size === arr.length,
          message: "Each prompt can only be answered once",
        },
      ],
    },
    projects: {
      type: [projectSchema],
      default: [],
      validate: maxItems(LIMITS.projects, "projects"),
    },
    // set by the FE when the onboarding flow is finished
    onboardingCompleted: { type: Boolean, default: false },
    // seeded demo accounts (scripts/seed.js): they like back and reply in chat
    isDemo: { type: Boolean, default: false, index: true },
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

userSchema.pre("save", function () {
  if (this.isModified("photos"))
    this.photoUrl = this.photos[0]?.url || DEFAULT_PHOTO_URL;
});

userSchema.methods.getJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

userSchema.methods.verifyPassword = function (userInputPwd) {
  return bcrypt.compare(userInputPwd, this.password);
};

const User = mongoose.model("User", userSchema);
User.DEFAULT_PHOTO_URL = DEFAULT_PHOTO_URL;

module.exports = User;

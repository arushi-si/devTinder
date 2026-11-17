const validator = require("validator");
const mongoose = require("mongoose");
const { HttpError } = require("../middlewares/errorHandler");

const PASSWORD_RULES =
  "Password must be at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol";

const validateSignUpData = (body) => {
  // lastName is optional (Hinge-style: first name is enough to get started)
  const { firstName, emailId, password } = body;
  if (!firstName) throw new HttpError(400, "firstName is required");
  if (!emailId || !validator.isEmail(String(emailId)))
    throw new HttpError(400, "Invalid email id");
  validatePassword(password);
};

const validatePassword = (password) => {
  if (!password || !validator.isStrongPassword(String(password)))
    throw new HttpError(400, PASSWORD_RULES);
};

const ALLOWED_EDIT_FIELDS = [
  "firstName",
  "lastName",
  "age",
  "gender",
  "skills",
  "about",
  "photoUrl",
  "headline",
  "location",
  "githubUrl",
  "experienceLevel",
  "prompts",
  "projects",
  "onboardingCompleted",
  // photos are managed through the /profile/photos endpoints
];

const validateEditProfileData = (body) => {
  const keys = Object.keys(body || {});
  const invalid = keys.filter((key) => !ALLOWED_EDIT_FIELDS.includes(key));
  if (!keys.length) throw new HttpError(400, "Nothing to update");
  if (invalid.length)
    throw new HttpError(400, `These fields can't be edited: ${invalid.join(", ")}`);
};

const ensureObjectId = (id, name = "id") => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid ${name}`);
};

module.exports = {
  validateSignUpData,
  validatePassword,
  validateEditProfileData,
  ensureObjectId,
  ALLOWED_EDIT_FIELDS,
};

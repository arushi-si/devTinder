const express = require("express");
const bcrypt = require("bcrypt");
const { userAuth } = require("../middlewares/auth");
const { HttpError } = require("../middlewares/errorHandler");
const {
  validateEditProfileData,
  validatePassword,
} = require("../utils/validations");
const cloudinary = require("../utils/cloudinary");
const { LIMITS } = require("../utils/constants");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, (req, res) => {
  res.json(req.user);
});

profileRouter.patch("/profile", userAuth, async (req, res) => {
  validateEditProfileData(req.body);
  const loggedInUser = req.user;
  Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
  await loggedInUser.save();
  res.json({ message: "Profile updated successfully!", data: loggedInUser });
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword)
    throw new HttpError(400, "currentPassword and newPassword are required");

  const loggedInUser = req.user;
  if (!(await loggedInUser.verifyPassword(String(currentPassword))))
    throw new HttpError(401, "Current password is incorrect");
  validatePassword(newPassword);
  if (currentPassword === newPassword)
    throw new HttpError(400, "New password must be different");

  loggedInUser.password = await bcrypt.hash(newPassword, 10);
  await loggedInUser.save();
  res.json({ message: "Password updated successfully!" });
});

// ---------- photos (Cloudinary direct upload, see utils/cloudinary.js) ----------

const photoResponse = (user) => ({ photos: user.photos, photoUrl: user.photoUrl });

const requirePhotoUploads = () => {
  if (!cloudinary.isConfigured())
    throw new HttpError(503, "Photo uploads are not configured on the server");
};

// step 1: signed params for uploading one file directly to Cloudinary
profileRouter.post("/profile/photos/upload-signature", userAuth, (req, res) => {
  requirePhotoUploads();
  if (req.user.photos.length >= LIMITS.photos)
    throw new HttpError(400, `You can add at most ${LIMITS.photos} photos`);
  res.set("Cache-Control", "no-store");
  res.json(cloudinary.getUploadParams(req.user._id));
});

// step 2: attach an uploaded image (by its Cloudinary public_id) to my profile
profileRouter.post("/profile/photos", userAuth, async (req, res) => {
  requirePhotoUploads();
  const user = req.user;
  const publicId = typeof req.body?.publicId === "string" ? req.body.publicId : "";

  // only accept images uploaded into this user's own folder with our signature
  if (!publicId.startsWith(cloudinary.userFolder(user._id) + "/"))
    throw new HttpError(400, "Invalid publicId");
  if (user.photos.some((p) => p.publicId === publicId))
    throw new HttpError(409, "Photo already added");
  if (user.photos.length >= LIMITS.photos)
    throw new HttpError(400, `You can add at most ${LIMITS.photos} photos`);

  const image = await cloudinary.getImage(publicId);
  if (!image) throw new HttpError(404, "Uploaded image not found");
  if (image.bytes > LIMITS.photoMaxBytes) {
    await cloudinary.deleteImage(publicId);
    throw new HttpError(400, "Photo must be under 10 MB");
  }

  user.photos.push({ url: image.secure_url, publicId });
  await user.save();
  res.status(201).json(photoResponse(user));
});

// remove one photo: DELETE /profile/photos?publicId=...  (or ?index=2 for photos without a publicId)
profileRouter.delete("/profile/photos", userAuth, async (req, res) => {
  const user = req.user;
  const { publicId, index } = req.query;
  const i = publicId
    ? user.photos.findIndex((p) => p.publicId === publicId)
    : Number.parseInt(index, 10);
  if (!(i >= 0 && i < user.photos.length)) throw new HttpError(404, "Photo not found");

  const [removed] = user.photos.splice(i, 1);
  await user.save();
  if (removed.publicId && cloudinary.isConfigured()) cloudinary.deleteImage(removed.publicId);
  res.json(photoResponse(user));
});

// reorder: body { order: [2, 0, 1, ...] } = new order of current indexes. First photo = main photo.
profileRouter.patch("/profile/photos/order", userAuth, async (req, res) => {
  const user = req.user;
  const order = req.body?.order;
  const n = user.photos.length;
  const isPermutation =
    Array.isArray(order) &&
    order.length === n &&
    new Set(order).size === n &&
    order.every((i) => Number.isInteger(i) && i >= 0 && i < n);
  if (!isPermutation)
    throw new HttpError(400, `order must list each photo index 0..${n - 1} exactly once`);

  const current = user.photos.map((p) => ({ url: p.url, publicId: p.publicId }));
  user.photos = order.map((i) => current[i]);
  await user.save();
  res.json(photoResponse(user));
});

module.exports = profileRouter;

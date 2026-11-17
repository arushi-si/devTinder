// Minimal Cloudinary client using Node's built-in crypto + fetch (no SDK dependency).
//
// Upload flow (the image never passes through our server or the Vercel proxy):
//  1. FE asks POST /profile/photos/upload-signature -> signed params
//  2. FE uploads the file straight to Cloudinary with those params
//  3. FE sends the returned public_id to POST /profile/photos; we verify it with the Admin API
const crypto = require("crypto");

const config = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () => {
  const { cloudName, apiKey, apiSecret } = config();
  return Boolean(cloudName && apiKey && apiSecret);
};

// https://cloudinary.com/documentation/authentication_signatures
const sign = (params) => {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + config().apiSecret).digest("hex");
};

const userFolder = (userId) => `kodo/users/${userId}`;

// Everything the browser needs to POST the file directly to Cloudinary.
const getUploadParams = (userId) => {
  const { cloudName, apiKey } = config();
  const params = {
    allowed_formats: "jpg,jpeg,png,webp,heic",
    folder: userFolder(userId),
    timestamp: Math.round(Date.now() / 1000),
    // resize on upload so huge phone photos don't eat storage
    transformation: "c_limit,w_1600,h_1600",
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    params: { ...params, api_key: apiKey, signature: sign(params) },
  };
};

const authHeader = () => {
  const { apiKey, apiSecret } = config();
  return "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
};

// Returns the uploaded image's details, or null if it doesn't exist.
const getImage = async (publicId) => {
  const { cloudName } = config();
  const path = publicId.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${path}`,
    { headers: { Authorization: authHeader() } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cloudinary lookup failed (${res.status})`);
  return res.json();
};

// Best effort: a failed delete only leaves an orphaned file in Cloudinary.
const deleteImage = async (publicId) => {
  const { cloudName, apiKey } = config();
  const params = { public_id: publicId, timestamp: Math.round(Date.now() / 1000) };
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({ ...params, api_key: apiKey, signature: sign(params) }),
    });
  } catch (e) {
    console.error("Cloudinary delete failed", publicId, e.message);
  }
};

module.exports = { isConfigured, userFolder, getUploadParams, getImage, deleteImage };

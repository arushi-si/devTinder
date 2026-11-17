const isProd = process.env.NODE_ENV === "production";

// fields of another user that are safe to send to the client
const USER_SAFE_DATA =
  "firstName lastName photoUrl age gender about skills headline location githubUrl experienceLevel";

const JWT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day, matches the JWT expiresIn

const COOKIE_OPTIONS = {
  httpOnly: true,
  // "lax" works because the FE proxies /api/* to this server, so the cookie is first-party.
  // Only set COOKIE_SAMESITE=none if the FE ever calls this API cross-site directly.
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  secure: isProd,
};

// short-lived token the FE uses to open a socket directly to this server
const SOCKET_TOKEN_EXPIRY = "60s";

const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const SEND_STATUSES = ["ignored", "interested"];
const REVIEW_STATUSES = ["accepted", "rejected"];

const MESSAGE_MAX_LENGTH = 2000;

module.exports = {
  USER_SAFE_DATA,
  JWT_EXPIRY_MS,
  COOKIE_OPTIONS,
  SOCKET_TOKEN_EXPIRY,
  CLIENT_ORIGINS,
  SEND_STATUSES,
  REVIEW_STATUSES,
  MESSAGE_MAX_LENGTH,
};

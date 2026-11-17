const isProd = process.env.NODE_ENV === "production";

// fields of another user that are safe to send to the client
const USER_SAFE_DATA =
  "firstName lastName photoUrl photos age gender about skills headline location githubUrl experienceLevel prompts projects isDemo";

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
// swipes that can be undone: a pass, or a like the other person hasn't answered yet
const UNDOABLE_STATUSES = ["ignored", "interested"];

const MESSAGE_MAX_LENGTH = 2000;

const GENDERS = ["male", "female", "others"];
const EXPERIENCE_LEVELS = ["student", "junior", "mid", "senior", "lead"];

// Hinge-style profile prompts: a user picks up to LIMITS.prompts and answers them
const PROMPT_QUESTIONS = [
  "The side project I'm secretly proudest of",
  "My most controversial tech opinion",
  "The bug that almost broke me",
  "My ideal pair-programming date",
  "I'll fall for you if you",
  "Something I built just for fun",
  "On weekends you'll find me",
  "My dev setup in one sentence",
  "Tabs or spaces, and why it matters",
  "Let's debate this",
  "The way to win me over is",
  "A website I'd build for you",
];

const LIMITS = {
  photos: 6,
  prompts: 3,
  promptAnswer: 200,
  projects: 5,
  projectTitle: 80,
  projectDescription: 300,
  projectTags: 5,
  skills: 10,
  skill: 30,
  about: 500,
  shortText: 100,
  photoMaxBytes: 10 * 1024 * 1024,
};

module.exports = {
  USER_SAFE_DATA,
  JWT_EXPIRY_MS,
  COOKIE_OPTIONS,
  SOCKET_TOKEN_EXPIRY,
  CLIENT_ORIGINS,
  SEND_STATUSES,
  REVIEW_STATUSES,
  UNDOABLE_STATUSES,
  MESSAGE_MAX_LENGTH,
  GENDERS,
  EXPERIENCE_LEVELS,
  PROMPT_QUESTIONS,
  LIMITS,
};

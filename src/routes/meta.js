const express = require("express");
const User = require("../models/user");
const cloudinary = require("../utils/cloudinary");
const {
  GENDERS,
  EXPERIENCE_LEVELS,
  PROMPT_QUESTIONS,
  LIMITS,
  MESSAGE_MAX_LENGTH,
} = require("../utils/constants");

const metaRouter = express.Router();

// Public, no login: option lists and limits for the onboarding / profile forms,
// so the FE doesn't hardcode them.
metaRouter.get("/meta", (req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({
    genders: GENDERS,
    experienceLevels: EXPERIENCE_LEVELS,
    promptQuestions: PROMPT_QUESTIONS,
    limits: { ...LIMITS, messageMax: MESSAGE_MAX_LENGTH },
    photoUploadsEnabled: cloudinary.isConfigured(),
  });
});

// Public, no login: a few demo profiles for the landing page preview.
// Only isDemo profiles, never real users.
metaRouter.get("/meta/showcase", async (req, res) => {
  const profiles = await User.aggregate([
    { $match: { isDemo: true } },
    { $sample: { size: 6 } },
    {
      $project: {
        firstName: 1,
        age: 1,
        headline: 1,
        location: 1,
        photoUrl: 1,
        skills: { $slice: ["$skills", 3] },
        prompt: { $first: "$prompts" },
      },
    },
  ]);
  res.set("Cache-Control", "public, max-age=60");
  res.json(profiles);
});

module.exports = metaRouter;

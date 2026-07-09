const express = require("express");
const bcrypt = require("bcrypt");
const { validateSignUpData } = require("../utils/validations");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/user");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  // creating a new instance of the User model
  try {
    const {
      firstName,
      lastName,
      emailId,
      age,
      gender,
      about,
      skills,
      password,
    } = req.body;

    validateSignUpData(req.body);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      age,
      gender,
      about,
      skills,
      password: passwordHash,
    });
    await user.save();

    res.send("User added");
  } catch (e) {
    res.status(400).send("User cannot be added! " + e.message);
  }
});

authRouter.post("/login", async (req, res) => {
  // creating a new instance of the User model
  try {
    const { emailId, password } = req.body;
    if (!validator.isEmail(emailId)) res.status(404).send("Invalid email id!");
    const user = await User.findOne({ emailId });

    if (!user) res.status(404).send("Invalid credentials!");

    const isPwdValid = await user.verifyPassword(password);

    if (isPwdValid) {
      const token = await user.getJWT();

      res.cookie("token", token);
      res.send("Login Succesfull!");
    } else res.send("Invalid credentials!");
  } catch (e) {
    res.status(400).send("Validation failed! " + e.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .send("User logged out successfully!");
});

module.exports = authRouter;

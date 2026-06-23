const jwt = require("jsonwebtoken");
const User = require("../models/user");

const adminAuth = (req, res, next) => {
  console.log("admin use");
  const token = "xyzabc";
  const isAuth = token === "xyzabc";
  if (isAuth) next();
  else res.status(401).send("Admin auth failed");
};

const userAuth = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const { token } = cookies;
    console.log(token);
    if (!token) throw new Error("Invalid token!");
    const decodedObj = await jwt.verify(token, "DEV@TINDER13#");
    const { _id } = decodedObj;
    const user = await User.findById(_id);

    if (!user) throw new Error("User not found!");
    req.user = user;
    next();
  } catch (e) {
    res.status(400).send("ERROR " + e.message);
  }
};

module.exports = { adminAuth, userAuth };

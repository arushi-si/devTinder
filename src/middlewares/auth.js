const adminAuth = (req, res, next) => {
  console.log("admin use");
  const token = "xyzabc";
  const isAuth = token === "xyzabc";
  if (isAuth) next();
  else res.status(401).send("Admin auth failed");
};

const userAuth = (req, res, next) => {
  console.log("user auth");
  const token = "user123";
  const isAuth = token == "user12";
  if (isAuth) next();
  else res.status(401).send("User auth failed");
};

module.exports = { adminAuth, userAuth };

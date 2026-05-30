const express = require("express");
const { connectDb } = require("./config/database");
const User = require("./models/user");
const app = express();
const port = 3000;

const { adminAuth, userAuth } = require("./middlewares/auth");

// request handler
// app.get("/user", (req, res) => {
//   // console.log(req.query);
//   // route handler
//   res.send({ fName: "Arush", lName: "Singh" });
// });
// // dynamic routing
// app.use("/hello/:hId", (req, res) => {
//   console.log(req.params);
//   res.send("Hello Hellooo!");
// });
// app.use("/admin", adminAuth);
// app.get("/admin/data", (req, res) => {
//   res.send("all data fetched");
// });
// app.get("/admin/deleteUser", (req, res) => {
//   res.send("all users deleted");
// });
// app.get("/user", userAuth, (req, res) => res.send("random user endpoint"));
// Advance routing: ? + *

app.use(express.json());

app.post("/signup", async (req, res) => {
  // creating a new instance of the User model
  const user = new User(req.body);
  await user.save();

  res.send("User added");
});

connectDb()
  .then(() => {
    console.log("db connected");
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((e) => console.log(e));

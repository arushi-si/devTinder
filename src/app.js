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

app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;
  try {
    const user = await User.find({ emailId: userEmail });
    res.send(user);
  } catch (e) {
    res.status(400).send("Something went wrong!");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  try {
    const user = await User.deleteOne({ _id: userId });
    res.send("User deleted succesfully");
  } catch (e) {
    res.status(400).send("Update Failed!", e.message);
  }
});

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  const data = req.body;
  try {
    const UPDATE_NOT_ALLOWED = ["emailId", "age"];
    if (Object.keys(data).some((key) => UPDATE_NOT_ALLOWED.includes(key)))
      throw new Error("Data can't be updated");
    const user = await User.findOneAndUpdate({ _id: userId }, data, {
      returnDocument: "after",
      runValidators: true,
    });
    res.send(user);
  } catch (e) {
    res.status(400).send("Update Failed! " + e.message);
  }
});

app.get("/feed", async (req, res) => {
  const users = req.body;
  try {
    const users = await User.find({});
    if (users.length === 0) res.status(404).send("No users found!");
    else res.send(users);
  } catch (e) {
    res.status(400).send("Something went wrong!");
  }
});

connectDb()
  .then(() => {
    console.log("db connected");
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((e) => console.log(e));

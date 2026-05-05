const express = require("express");
const app = express();
const port = 3000;

// request handler

app.get("/user", (req, res) => {
  console.log(req.query);
  res.send({ fName: "Arush", lName: "Singh" });
});

app.use("/hello/:hId", (req, res) => {
  console.log(req.params);
  res.send("Hello Hellooo!");
});

// Advance routing: ? + *
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

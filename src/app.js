require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./config/database");
const { CLIENT_ORIGINS } = require("./utils/constants");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { initSocket } = require("./utils/socket");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

const port = process.env.PORT || 3000;
const app = express();

// Number of proxies in front of the app, so req.ip (used by rate limiting) is the real client IP.
// Vercel rewrite + Render load balancer = 2. Check with GET /health.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// ip = the caller's own IP as the server sees it; should match yours, not Vercel's
app.get("/health", (req, res) => res.json({ ok: true, ip: req.ip }));

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

connectDb()
  .then(() => {
    console.log("db connected");
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

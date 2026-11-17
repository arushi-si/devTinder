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
const { clientIp } = require("./utils/clientIp");

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const metaRouter = require("./routes/meta");

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

const port = process.env.PORT || 3000;
const app = express();

// Number of proxies in front of the app. Rate limiting doesn't rely on this in production
// (see clientIp in utils/clientIp.js); it just keeps express-rate-limit's proxy checks quiet.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// ip = the client IP rate limiting uses; through the Vercel proxy it should be your own IP
app.get("/health", (req, res) => res.json({ ok: true, ip: clientIp(req) }));

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", metaRouter);

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

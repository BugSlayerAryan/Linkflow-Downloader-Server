const express = require("express");
const cors = require("cors");
const requestIp = require("request-ip");
const mongoose = require("mongoose");
const UAParser = require("ua-parser-js");
require("dotenv").config();

const app = express();

const PORT_NO = process.env.PORT || 3030;
const MONGO_CONNECT =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smvd1";

const User = require("./models/user");
const publicRoutes = require("./routes/public");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(requestIp.mw());

app.use(async (req, res, next) => {
  try {
    let user = await User.findOne({ ip: req.clientIp });

    if (!user) {
      const useragent = req.headers["user-agent"];
      const parser = new UAParser(useragent);
      const parserResults = parser.getResult();

      const newUser = new User({
        ip: req.clientIp,
        deviceInfo: parserResults,
        activity: [],
      });

      await newUser.save();
      user = await User.findOne({ ip: req.clientIp });
    }

    req.users = user;
    next();
  } catch (err) {
    console.log("User middleware error:", err.message);
    next();
  }
});

app.use(publicRoutes);

app.use((err, req, res, next) => {
  console.log("Global error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.message && err.message.startsWith("CORS blocked origin")) {
    return res.status(403).json({
      status: "fail",
      error: "Not allowed by CORS",
    });
  }

  res.status(500).json({
    status: "fail",
    error: "Internal server error",
  });
});

mongoose
  .connect(MONGO_CONNECT)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT_NO, "0.0.0.0", () => {
      console.log(`Server Running On ${PORT_NO}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
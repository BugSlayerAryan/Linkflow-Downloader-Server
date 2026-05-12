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

console.log("Starting backend...");
console.log("PORT:", PORT_NO);
console.log("Mongo URI exists:", Boolean(process.env.MONGO_URI));
console.log("Frontend URL:", process.env.FRONTEND_URL || "not set");

app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin like Postman, curl, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Express 5 safe OPTIONS handler
app.options(/.*/, cors());

app.use(requestIp.mw());

app.use(async (req, res, next) => {
  try {
    if (!req.clientIp) {
      return next();
    }

    let user = await User.findOne({ ip: req.clientIp });

    if (!user) {
      const useragent = req.headers["user-agent"] || "";
      const parser = new UAParser(useragent);
      const parserResults = parser.getResult();

      user = await User.create({
        ip: req.clientIp,
        deviceInfo: parserResults,
        activity: [],
      });
    }

    req.users = user;
    next();
  } catch (err) {
    console.log("User middleware error:", err.message);
    next();
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend is running",
  });
});

app.use(publicRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    error: "Route not found",
  });
});

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
  .connect(MONGO_CONNECT, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT_NO, "0.0.0.0", () => {
      console.log(`Server Running On ${PORT_NO}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);

    if (err.reason) {
      console.error("MongoDB error reason:", err.reason);
    }

    process.exit(1);
  });
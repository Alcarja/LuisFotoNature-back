import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "http://46.225.161.233",
  "https://luisfotonature.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Rate limiters
/* const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many attempts, please try again later" },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
}); */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(cors(corsOptions));

app.use(express.json());

/* app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter); */

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/galleries", galleryRoutes);

export default app;

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tiktokRouter from "./routes/tiktok.js";

const {
  PORT = 3000,
  FRONTEND_ORIGIN = "https://trend-pro.onrender.com",
  SESSION_SECRET = "change-me",
  COOKIE_SECURE = "true"
} = process.env;

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors({ origin: [FRONTEND_ORIGIN], credentials: true }));
app.use(cookieParser(SESSION_SECRET));

// Sanity routes
app.get("/health", (_req,res)=>res.json({ ok:true, v:"ready" }));
app.get("/debug-env", (_req,res)=>res.json({ FRONTEND_ORIGIN, COOKIE_SECURE }));

// Fallback debug (bevor Router mounted wird)
app.get("/auth/tiktok/debug", (_req,res)=>res.json({ mounted:true, from:"server" }));

// OAuth-Router mounten
app.use("/auth/tiktok", tiktokRouter);

app.listen(Number(PORT), "0.0.0.0", ()=>console.log("✅ API on :"+PORT));

import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./server/routes.js";

let app: express.Application | null = null;
let initialized = false;

async function initializeApp() {
  if (initialized && app) {
    return app;
  }

  const newApp = express();
  
  // Middleware
  newApp.use(express.json({ limit: "10mb" }));
  newApp.use(express.urlencoded({ extended: true, limit: "10mb" }));
  newApp.use(cookieParser());

  // CORS
  newApp.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  try {
    // Register all routes
    await registerRoutes(newApp);
    
    initialized = true;
    app = newApp;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    throw error;
  }

  return newApp;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const application = await initializeApp();
    return application(req as any, res as any);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "Server initialization failed" });
  }
};

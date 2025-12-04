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
    console.log("[init] Starting route registration...");
    // Register all routes
    await registerRoutes(newApp);
    console.log("[init] Routes registered successfully");
    
    initialized = true;
    app = newApp;
  } catch (error) {
    console.error("[init] Error during registration:", error);
    throw error;
  }

  return newApp;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const application = await initializeApp();
    return application(req as any, res as any);
  } catch (error) {
    console.error("[handler] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: message
    });
  }
};

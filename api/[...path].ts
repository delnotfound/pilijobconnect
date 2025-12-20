import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cookieParser from "cookie-parser";

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

  // Test endpoint
  newApp.get("/api/test", (req, res) => {
    console.log("[test] Health check");
    res.json({ status: "ok", message: "API is running" });
  });

  // Health check
  newApp.get("/api/health", (req, res) => {
    console.log("[health] Database check");
    try {
      const hasDb = !!process.env.DATABASE_URL;
      res.json({ 
        status: "ok", 
        database: hasDb ? "configured" : "not configured",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  try {
    console.log("[init] Loading routes...");
    
    // Dynamically import routes to catch errors better
    try {
      const { registerRoutes } = await import("./server/routes.js");
      console.log("[init] registerRoutes imported successfully");
      
      const result = await registerRoutes(newApp);
      console.log("[init] Routes registered successfully");
    } catch (importError) {
      console.error("[init] Failed to load routes:", importError);
      
      // Add error endpoint that explains the problem
      newApp.use((req, res) => {
        res.status(500).json({
          error: "Routes not initialized",
          message: importError instanceof Error ? importError.message : String(importError),
          endpoint: req.path
        });
      });
    }
    
    initialized = true;
    app = newApp;
  } catch (error) {
    console.error("[init] Error during initialization:", error);
    throw error;
  }

  return newApp;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    console.log("[handler] " + req.method + " " + req.url);
    
    const application = await initializeApp();
    return application(req as any, res as any);
  } catch (error) {
    console.error("[handler] Fatal error:", error);
    const message = error instanceof Error ? error.message : String(error);
    
    return res.status(500).json({ 
      error: "Server error",
      message: message,
      timestamp: new Date().toISOString()
    });
  }
};

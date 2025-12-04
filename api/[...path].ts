import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

let appInitialized = false;
let cachedApp: express.Application;

async function getOrCreateApp() {
  if (appInitialized && cachedApp) {
    return cachedApp;
  }

  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false, limit: "10mb" }));
  app.use(cookieParser());

  // CORS middleware
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Add logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;

    res.json = function (data: any) {
      const duration = Date.now() - start;
      console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
      return originalJson.call(this, data);
    };

    next();
  });

  try {
    console.log("[registerRoutes] Starting...");
    
    // Dynamic import to avoid issues with module loading
    const { registerRoutes } = await import("./server/routes.js");
    const result = await registerRoutes(app);
    
    console.log("[registerRoutes] Success - routes registered");
    
    // Only use the result if needed, but routes are already on app
    if (result) {
      console.log("[registerRoutes] HTTP server created");
    }

    // 404 handler - MUST be last
    app.use((req: Request, res: Response) => {
      console.log(`[404] ${req.method} ${req.path}`);
      res.status(404).json({ error: "Route not found", path: req.path });
    });

    // Error handler - MUST be after all other middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error(`[ERROR] ${err.message}`, err);
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ error: err.message });
    });

    appInitialized = true;
    cachedApp = app;
    console.log("[App] Ready for requests");
  } catch (error) {
    console.error("[App] Fatal initialization error:", error);
    throw error;
  }

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`[Handler] ${req.method} ${req.url}`);
    
    if (!process.env.DATABASE_URL) {
      console.error("[Handler] DATABASE_URL is missing");
      return res.status(500).json({ error: "Database not configured" });
    }

    const app = await getOrCreateApp();
    console.log("[Handler] App obtained, routing...");
    
    return app(req as any, res as any);
  } catch (error) {
    console.error("[Handler] Error caught:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

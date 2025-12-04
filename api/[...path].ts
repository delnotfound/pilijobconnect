import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./server/routes.js";

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

  // Add logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;
    const originalSend = res.send;

    res.json = function (data: any) {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      return originalJson.call(this, data);
    };

    res.send = function (data: any) {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      return originalSend.call(this, data);
    };

    next();
  });

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

  try {
    console.log("[App] Registering routes...");
    await registerRoutes(app);
    console.log("[App] Routes registered successfully");

    // 404 handler
    app.use((req: Request, res: Response) => {
      console.log(`[App] 404 - ${req.method} ${req.path}`);
      res.status(404).json({ error: "Route not found", path: req.path });
    });

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[App] Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ error: message });
    });

    appInitialized = true;
    cachedApp = app;
  } catch (error) {
    console.error("[App] Initialization failed:", error);
    throw error;
  }

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`[Handler] ${req.method} ${req.url}`);
    
    if (!process.env.DATABASE_URL) {
      console.error("[Handler] DATABASE_URL not configured");
      return res.status(500).json({ error: "Database not configured" });
    }

    const app = await getOrCreateApp();
    return app(req as any, res as any);
  } catch (error) {
    console.error("[Handler] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

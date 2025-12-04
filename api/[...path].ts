import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./server/routes.js";

// Define CORS headers helper function
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );
}

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

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(
            0,
            100
          )}`;
        }

        if (logLine.length > 120) {
          logLine = logLine.slice(0, 119) + "…";
        }

        console.log(logLine);
      }
    });

    next();
  });

  try {
    console.log(
      "[getOrCreateApp] Initializing server and registering routes..."
    );
    await registerRoutes(app); // ✅ we load express routes here
    console.log("[getOrCreateApp] Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("[Express Error Handler]:", {
        status,
        message,
        error: String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      res.status(status).json({ message, error: message });
    });

    appInitialized = true;
    cachedApp = app;
    console.log("[getOrCreateApp] App initialization complete and cached");
  } catch (error) {
    console.error("[getOrCreateApp] Error during app initialization:", error);
    if (error instanceof Error) {
      console.error("[getOrCreateApp] Error stack:", error.stack);
    }
    throw error;
  }

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[Handler] ${req.method} ${req.url}`);
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (!process.env.DATABASE_URL) {
      console.error("[Handler] DATABASE_URL not set in environment variables");
      return res.status(500).json({
        message: "Database connection not configured",
        error: "DATABASE_URL is not set",
      });
    }

    console.log("[Handler] Getting or creating app...");
    const app = await getOrCreateApp();
    console.log("[Handler] App ready, routing request...");
    return app(req as any, res as any);
  } catch (error) {
    console.error("[Handler] Caught error:", error);
    if (error instanceof Error) {
      console.error("[Handler] Error message:", error.message);
      console.error("[Handler] Error stack:", error.stack);
    }
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.stack
            : String(error)
          : undefined,
    });
  }
}

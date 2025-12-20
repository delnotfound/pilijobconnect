import type { Config, Context } from "@netlify/functions";
import express from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../../api/server/routes.js";
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "http";

let app: express.Application | null = null;

async function getOrCreateApp(): Promise<express.Application> {
  if (app) {
    return app;
  }

  app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false, limit: "10mb" }));
  app.use(cookieParser());

  // CORS headers
  app.use((req, res, next) => {
    const allowedOrigins: string[] = [
      "http://localhost:5000",
      "http://localhost:3000",
      "http://localhost:5173",
    ];

    if (process.env.NETLIFY_SITE_URL) {
      allowedOrigins.push(process.env.NETLIFY_SITE_URL);
    }
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }

    const origin = req.headers.origin as string;
    if (origin && allowedOrigins.some((allowed) => origin.includes(allowed))) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Register API routes
  await registerRoutes(app);

  return app;
}

// For Netlify
export default async (req: any, context: Context) => {
  try {
    const app = await getOrCreateApp();
    
    // Extract request details
    const method = req.httpMethod || req.method || "GET";
    const path = req.path || req.url || "/";
    const queryString = req.queryStringParameters || req.query || {};
    const headers = req.headers || {};
    let bodyData = req.body || "";

    // Parse body if it's a string
    let parsedBody: any = {};
    if (bodyData && typeof bodyData === "string") {
      try {
        parsedBody = JSON.parse(bodyData);
      } catch {
        parsedBody = bodyData;
      }
    } else if (bodyData && typeof bodyData === "object") {
      parsedBody = bodyData;
    }

    return new Promise((resolve) => {
      let responseBody = "";
      let statusCode = 200;
      const responseHeaders: Record<string, string | string[]> = {};
      let responded = false;

      // Create mock response object
      const mockRes = {
        statusCode: 200,
        setHeader: (name: string, value: string | string[]) => {
          responseHeaders[name.toLowerCase()] = value;
          return mockRes;
        },
        header: (name: string, value: string | string[]) => {
          responseHeaders[name.toLowerCase()] = value;
          return mockRes;
        },
        status: (code: number) => {
          statusCode = code;
          mockRes.statusCode = code;
          return mockRes;
        },
        json: (data: any) => {
          if (responded) return mockRes;
          responded = true;
          responseHeaders["content-type"] = "application/json";
          responseBody = JSON.stringify(data);
          resolve({
            statusCode,
            headers: responseHeaders,
            body: responseBody,
          });
          return mockRes;
        },
        send: (data: any) => {
          if (responded) return mockRes;
          responded = true;
          if (typeof data === "string") {
            responseBody = data;
          } else {
            responseBody = JSON.stringify(data);
            responseHeaders["content-type"] = "application/json";
          }
          resolve({
            statusCode,
            headers: responseHeaders,
            body: responseBody,
          });
          return mockRes;
        },
        end: () => {
          if (responded) return mockRes;
          responded = true;
          resolve({
            statusCode,
            headers: responseHeaders,
            body: responseBody,
          });
          return mockRes;
        },
        write: (data: any) => {
          responseBody += typeof data === "string" ? data : JSON.stringify(data);
          return mockRes;
        },
        on: (event: string, handler: Function) => mockRes,
        removeListener: () => mockRes,
      } as any;

      // Create mock request object
      const mockReq = {
        method,
        path,
        url: path + (Object.keys(queryString).length > 0 ? "?" + new URLSearchParams(queryString).toString() : ""),
        headers,
        query: queryString,
        body: parsedBody,
        cookies: {} as Record<string, string>,
        get: (header: string) => headers[header.toLowerCase()],
        on: () => mockReq,
      } as any;

      // Parse cookies
      const cookieHeader = headers.cookie || headers.Cookie;
      if (cookieHeader) {
        const cookies = (typeof cookieHeader === "string" ? cookieHeader : "").split(";").reduce((acc: any, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = decodeURIComponent(value);
          }
          return acc;
        }, {});
        mockReq.cookies = cookies;
      }

      // Dispatch to Express app
      try {
        app(mockReq, mockRes);
        
        // Set a timeout in case the handler never resolves
        setTimeout(() => {
          if (!responded) {
            responded = true;
            resolve({
              statusCode: 500,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ error: "Request timeout" }),
            });
          }
        }, 25000); // 25 second timeout (Netlify limit is 26 seconds)
      } catch (error) {
        if (!responded) {
          responded = true;
          resolve({
            statusCode: 500,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              error: "Internal Server Error",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          });
        }
      }
    });
  } catch (error) {
    console.error("API Handler Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export const config: Config = {
  path: "/api/*",
  method: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

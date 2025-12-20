// Minimal re-export used by the Vercel serverless function.
// We bundle this file during `npm run build` and import the built
// artifact from the API function so Vercel has a runtime JS module
// it can load (avoids importing raw TS files outside the `api/` dir).
export { registerRoutes } from "./routes";

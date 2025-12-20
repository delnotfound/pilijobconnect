# Vercel Deployment Guide

## ✅ Deployment Ready Status

Your Pili Jobs application is now **fully configured and ready for Vercel deployment**!

## What Was Fixed

### 1. Build Configuration
- **Updated `package.json` build script** from `vite build && esbuild server/index.ts...` to just `vite build`
- For Vercel, the API is handled through serverless functions, not bundled server code
- The frontend is built to the `dist/` directory as static files

### 2. Dependencies
- **Installed `@vercel/node`** - Required for Vercel serverless functions
- **Installed `nanoid`** - Required dependency for the application

### 3. Vercel Configuration
Your `vercel.json` is properly configured:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/[...path].ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

## Deployment Architecture

### Frontend (Static)
- Built with Vite
- Output directory: `dist/`
- Served as static files by Vercel

### Backend (Serverless API)
- Entry point: `api/[...path].ts`
- Routes defined in: `api/server/routes.ts`
- Database: PostgreSQL (Neon) via `@neondatabase/serverless`

## Environment Variables Required

Make sure these are set in your Vercel project settings:

### Required
- `DATABASE_URL` - Your PostgreSQL connection string (Neon or other provider)
- `JWT_SECRET` - Secret key for JWT token signing
- `NODE_ENV` - Set to `production`

### Optional (for SMS features)
- `TEXTBEE_API_KEY` - TextBee SMS service API key
- `TEXTBEE_DEVICE_ID` - TextBee device identifier

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Fixed Vercel deployment configuration"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will automatically detect the settings from `vercel.json`
4. Add your environment variables in the project settings
5. Deploy!

### 3. Post-Deployment
- Your API will be available at: `https://your-domain.vercel.app/api/*`
- Your frontend will be at: `https://your-domain.vercel.app`

## Build Output

The production build generates:
- `dist/index.html` - Main HTML file
- `dist/assets/` - All CSS, JS, and image assets
- Total bundle size: ~981 KB JS, ~86 KB CSS

## Database Setup

The application uses PostgreSQL (Neon). Make sure you:
1. Have a Neon database created
2. Set the `DATABASE_URL` environment variable in Vercel
3. Run migrations if needed (the schema is already in your code)

## Testing Locally

Before deploying, you can test the production build locally:
```bash
npm run build
# Serve the dist folder with any static server
```

## Notes

- The `api/` directory contains all serverless functions
- The `server` symlink allows local development to work
- SQLite files (pili_jobs.db) are not used in production
- All API routes are handled through the serverless function

## Support

If you encounter any issues during deployment:
1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Ensure your database is accessible from Vercel's network

---

**Status**: ✅ Ready to deploy!

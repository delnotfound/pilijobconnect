# Dual Deployment Configuration - Netlify & Vercel

Your PiliJobConnect application is now configured to deploy to both Netlify and Vercel seamlessly.

## What Was Fixed

Your API endpoints were returning 404 errors because:
- **On Netlify**: Netlify functions weren't configured to handle `/api/*` requests
- **On Vercel**: The Vercel configuration was already set up (it uses `api/[...path].ts`)

## Configuration Details

### Netlify Setup
- **File**: `netlify.toml`
- **Netlify Function**: `netlify/functions/api.ts` (handles all `/api/*` routes)
- **Build Command**: `npm run build` 
- **Publish Directory**: `dist`
- **Node Version**: 18.18.0 (via `.nvmrc`)

### Vercel Setup  
- **File**: `vercel.json`
- **API Handler**: `api/[...path].ts` (existing Vercel catch-all route)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Shared Configuration
- **Database**: Neon PostgreSQL (serverless via `@neondatabase/serverless`)
- **Frontend**: Vite + React (builds to `dist/`)
- **API Framework**: Express.js (works on both platforms)
- **CORS**: Configured for localhost (dev) and both production URLs

## Environment Variables

Make sure these are set in both Netlify and Vercel:
```
DATABASE_URL=<your_neon_connection_string>
JWT_SECRET=<your_jwt_secret>
TEXTBEE_API_KEY=<if_using_textbee>
```

**For Netlify specifically**, the build system will detect `NETLIFY_SITE_URL` and add it to CORS allowed origins.

**For Vercel specifically**, the build system will detect `VERCEL_URL` and add it to CORS allowed origins.

## How It Works

### On Netlify
1. During build, Vite compiles your React frontend to `dist/`
2. Netlify bundler compiles `netlify/functions/api.ts` as a serverless function
3. The function catches all `/api/*` requests and routes them through Express
4. All other routes fall through to serve `index.html` (SPA routing)

### On Vercel
1. During build, Vite compiles your React frontend to `dist/`
2. Vercel bundler uses the existing `api/[...path].ts` handler (was already there)
3. This file catches all `/api/*` requests and routes them through Express
4. All other routes fall through to serve `index.html` (SPA routing)

## Deployment

### Deploy to Netlify
```bash
git push origin main
# Then connect your repo to Netlify via the Netlify dashboard
```

### Deploy to Vercel
```bash
git push origin main
# Then connect your repo to Vercel via the Vercel dashboard
```

Both platforms will automatically detect their respective configuration files and deploy correctly.

## Testing Locally

For local development with Netlify functions:
```bash
npm run build && npm run dev:client
# Or use netlify dev (if Netlify CLI is installed)
```

For traditional Express server:
```bash
npm run dev
```

## What Was Added

- ✅ `netlify/functions/api.ts` - Netlify serverless function handler
- ✅ `netlify.toml` - Netlify build & function configuration  
- ✅ `.nvmrc` - Node version specification (18.18.0)
- ✅ Updated `api/server/index.ts` - Better CORS handling for both platforms
- ✅ Added `dev:client` script to `package.json` - For Netlify dev mode

## Troubleshooting

If you see 404 errors on `/api/*` endpoints:
1. Check that environment variables are set in the deployment platform
2. Verify database connection is working (`DATABASE_URL`)
3. Check the function/build logs for errors
4. Ensure the `dist/` directory was built properly

If database queries fail:
1. Verify `@neondatabase/serverless` can connect from the serverless environment
2. Check database connection pooling settings
3. Ensure your Neon database is accessible (not blocked by firewall)

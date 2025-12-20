# Deploying to Vercel

## Prerequisites

1. A PostgreSQL database (e.g., Neon, Supabase, or Vercel Postgres)
2. Your environment variables ready

## Step-by-Step Deployment Guide

### 1. Prepare Your Database

This application requires PostgreSQL (not SQLite). You can use:
- **Neon** (recommended): https://neon.tech
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Supabase**: https://supabase.com

### 2. Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-super-secret-jwt-key-here
TEXTBEE_API_KEY=your_textbee_api_key (optional)
TEXTBEE_DEVICE_ID=your_textbee_device_id (optional)
NODE_ENV=production
```

### 3. Deploy from GitHub

1. **Connect your repository** to Vercel
2. Vercel will auto-detect the configuration from `vercel.json`
3. The build settings should be:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4. Push Database Schema

After your first deployment, you need to push the database schema:

```bash
# Locally, with your production DATABASE_URL
npm run db:push
```

Or set up the database from your Vercel deployment:
1. Go to your deployed site
2. Navigate to `/api/admin/seed-database` (requires admin account)

### 5. Verify Deployment

- Your frontend will be at: `https://your-project.vercel.app`
- API routes will be at: `https://your-project.vercel.app/api/*`

## Important Notes

### Database Migration from SQLite

If you previously used SQLite locally, your data won't automatically transfer. You need to:

1. **Export data** from SQLite (if needed)
2. **Set up PostgreSQL** database
3. **Import data** to PostgreSQL (if needed)

### Build Configuration

The `vercel.json` file configures:
- Build command: `npm run build`
- API routes: All `/api/*` requests route to the serverless function in `api/[...path].ts`
- Output directory: `dist` (frontend build)

### Serverless Functions

All API routes are handled by a single serverless function in `api/[...path].ts`. This function:
- Initializes Express server
- Registers all routes from `server/routes.ts`
- Handles requests serverlessly

## Troubleshooting

### Build Fails

1. **Check environment variables**: Make sure `DATABASE_URL` is set
2. **Check build logs**: Look for missing dependencies
3. **Test locally**: Run `npm run build` locally first

### Database Connection Errors

1. **Verify DATABASE_URL**: Make sure it's a valid PostgreSQL connection string
2. **Check database permissions**: Ensure your database user has proper permissions
3. **Whitelist Vercel IPs**: Some database providers require whitelisting Vercel's IP ranges

### API Routes Not Working

1. **Check function logs**: Go to Vercel → Deployments → Function Logs
2. **Verify routes**: Make sure `/api/*` paths are working
3. **Check CORS**: If calling from external domain, CORS might be blocking

## Local Development

For local development, continue using:

```bash
npm run dev
```

This runs the full Express server with Vite for hot reloading.

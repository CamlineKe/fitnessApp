# Frontend Deployment Guide

## Prerequisites
1. Node.js and npm installed
2. Git repository pushed to GitHub
3. Vercel account created
4. Vercel CLI installed (optional, for command line deployment)

## Step 1: Prepare Your Project

1. Ensure your `.env.production` file is configured:
```env
VITE_API_URL=https://fitness-app-backend.onrender.com
VITE_SOCKET_URL=wss://fitness-app-backend.onrender.com
VITE_AI_SERVICE_URL=https://fitness-app-ai.onrender.com
```

2. Verify your `vercel.json` configuration:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

3. Test production build locally:
```bash
npm run build
npm run preview
```

## Step 2: Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
5. Add Environment Variables:
   - Copy all variables from `.env.production`
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the CLI prompts:
   - Set up and deploy? Yes
   - Which scope? [Your account/team]
   - Link to existing project? No
   - What's your project's name? [Your project name]
   - In which directory is your code located? ./frontend
   - Want to override the settings? No

## Step 3: Post-Deployment

1. Verify your deployment:
   - Check the deployment URL provided by Vercel
   - Test all main functionalities
   - Verify API connections

2. Set up custom domain (optional):
   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

3. Configure environment variables:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add/update all variables from `.env.production`
   - Redeploy if needed

## Step 4: Monitoring and Maintenance

1. Set up monitoring:
   - Enable Vercel Analytics
   - Configure Error tracking
   - Set up performance monitoring

2. Regular maintenance:
   - Monitor build logs
   - Check performance metrics
   - Update dependencies regularly
   - Monitor API endpoint health

## Troubleshooting

Common issues and solutions:

1. Build failures:
   - Check build logs in Vercel
   - Verify all dependencies are installed
   - Check for environment variable issues

2. API connection issues:
   - Verify API URLs in environment variables
   - Check CORS configuration
   - Verify SSL/TLS certificates

3. Routing issues:
   - Check vercel.json configuration
   - Verify client-side routing setup
   - Check for 404 errors

## Important Notes

1. Security:
   - Never commit sensitive environment variables
   - Use Vercel's environment variable management
   - Enable security headers

2. Performance:
   - Enable automatic minification
   - Configure caching headers
   - Enable Vercel Edge Functions if needed

3. Monitoring:
   - Set up uptime monitoring
   - Configure error notifications
   - Monitor performance metrics

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html) 
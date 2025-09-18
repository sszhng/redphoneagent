# Red Phone Agent - Vercel Deployment Guide

## 🚀 Quick Deploy

### Option 1: GitHub Integration (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub: `https://github.com/sszhng/redphoneagent`
4. Framework: **React**
5. Root Directory: `red-phone-agent`
6. Build Command: `npm run build`
7. Output Directory: `build`
8. Deploy!

### Option 2: Vercel CLI
```bash
cd red-phone-agent
npx vercel --prod
```

## 🔧 Configuration Files Added

### `vercel.json`
- Handles SPA routing with rewrites
- Redirects all routes to `/index.html`
- Optimizes static asset caching

### `public/_redirects`
- Fallback routing configuration
- Ensures React Router works properly

## 🐛 Common Issues & Solutions

### 404 NOT_FOUND Error
**Problem**: Vercel can't find routes for React SPA
**Solution**: ✅ Fixed with our `vercel.json` configuration

### Build Errors
```bash
# Ensure all dependencies are installed
npm install

# Test build locally
npm run build

# Check for any missing files
ls -la build/
```

### Environment Variables
If needed, add in Vercel dashboard:
- `REACT_APP_ENV=production`

## 📋 Deployment Checklist

- ✅ `vercel.json` configured
- ✅ `_redirects` file added
- ✅ Repository pushed to GitHub
- ✅ Build command: `npm run build`
- ✅ Output directory: `build`
- ✅ Framework: React

## 🌐 Live Demo

Once deployed, your Red Phone Agent will be available at:
`https://your-project-name.vercel.app`

## 🔍 Debugging

1. **Check Vercel deployment logs**
2. **Verify build output in Functions tab**
3. **Test routes manually**: `/`, `/any-route`
4. **Check browser console for errors**

The configuration should resolve the 404 NOT_FOUND error you encountered!

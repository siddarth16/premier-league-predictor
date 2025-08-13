# 🚀 Deployment Guide - Premier League Predictor

Complete guide to deploy your Premier League Predictor to production on Vercel.

## 📋 Pre-Deployment Checklist

✅ **Code Repository**: Pushed to GitHub  
✅ **API Key**: API Football key ready  
✅ **Environment**: .env.example created  
✅ **Build**: Passes local build test  

## 🚀 Deploy to Vercel (One-Click)

### Option 1: Deploy Button (Fastest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/siddarth16/premier-league-predictor)

Click the button above and follow these steps:

1. **Connect GitHub**: Authorize Vercel to access your GitHub account
2. **Import Repository**: Select `siddarth16/premier-league-predictor`
3. **Configure Project**: Use default settings
4. **Deploy**: Click "Deploy"

### Option 2: Manual Deployment (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to project directory
cd premier-league-predictor

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel
```

**Deployment Prompts:**
- Set up and deploy? **Y**
- Which scope? **Your personal account**
- Link to existing project? **N**
- Project name? **premier-league-predictor**
- Directory? **./** (default)
- Auto-detected settings? **Y**

## ⚙️ Environment Variables Setup

### Required Variables

After deployment, set these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Essential - Get from api-football.com
API_FOOTBALL_KEY=6eaaafee60890286ab44feef6ec4471b

# App Configuration
NEXT_PUBLIC_APP_NAME=Premier League Predictor
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

### How to Add Environment Variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `API_FOOTBALL_KEY`
   - **Value**: `6eaaafee60890286ab44feef6ec4471b`
   - **Environment**: All (Production, Preview, Development)
5. Repeat for all variables
6. **Redeploy** to apply changes

## 🔧 Vercel Configuration

Your `vercel.json` is already optimized:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Custom Domain Setup (Optional)

1. Go to Vercel Dashboard → Your Project → Domains
2. Add your custom domain (e.g., `plpredictor.com`)
3. Configure DNS records as shown
4. SSL certificate auto-generated

## 📊 Performance Monitoring

### Vercel Analytics (Free)

Enable in Vercel Dashboard → Analytics:
- Page views and performance
- Core Web Vitals tracking
- User experience metrics

### API Monitoring

Monitor your API usage:
- Check `/api/health` endpoint
- Track API Football requests (100/day limit)
- Monitor prediction generation times

## 🔍 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "api": {"status": "up", "usage": {"used": 0, "remaining": 100}},
    "database": {"status": "up"}
  }
}
```

### 2. Teams Endpoint
```bash
curl https://your-app.vercel.app/api/teams
```

### 3. Predictions Test
```bash
curl https://your-app.vercel.app/api/predictions?upcoming=true&days=7
```

### 4. Web Interface
Visit your deployed URL and test:
- ✅ Dashboard loads
- ✅ Teams data displays
- ✅ Predictions generate
- ✅ Analysis page works
- ✅ Mobile responsiveness

## 🚨 Troubleshooting

### Common Issues

**1. Environment Variables Not Working**
```bash
# Solution: Redeploy after adding variables
vercel --prod
```

**2. API Football 403 Error**
- Check API key is correct
- Verify key is added to environment variables
- Ensure no extra spaces in the key

**3. Build Failures**
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Fix lint issues
npm run lint
```

**4. API Rate Limiting**
- Check current usage: `/api/health`
- Wait for daily reset (midnight UTC)
- Implement smart caching in production

### Error Logs

Check logs in Vercel Dashboard → Functions tab for detailed error information.

### Fallback Testing

Test the fallback system:
1. Remove API key temporarily
2. Verify app still works with mock data
3. Check console for fallback messages

## 📈 Production Optimization

### 1. Caching Strategy
- API responses cached for 5 minutes
- Static assets cached by Vercel CDN
- Database queries optimized

### 2. Performance Tips
- Use Vercel Edge Functions for global speed
- Enable Vercel Speed Insights
- Monitor Core Web Vitals

### 3. Scaling Considerations
- Upgrade API Football plan for more requests
- Consider Redis caching for high traffic
- Implement database connection pooling

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. Connected to GitHub ✅
2. Auto-deploy on `master` push ✅
3. Preview deployments for PRs ✅

### Update Process
```bash
# Make changes locally
git add .
git commit -m "Update: description"
git push origin master

# Vercel auto-deploys within 30 seconds
```

## 🌍 Going Global

### Multi-Region Deployment
```json
{
  "regions": ["iad1", "lhr1", "syd1"]
}
```

### Internationalization
Future feature: Support for multiple leagues and languages.

## 📞 Support

**Deployment Issues:**
- 📧 Vercel Support: [vercel.com/support](https://vercel.com/support)
- 📚 Vercel Docs: [vercel.com/docs](https://vercel.com/docs)

**App Issues:**
- 🐛 GitHub Issues: [Repository Issues](https://github.com/siddarth16/premier-league-predictor/issues)
- 📖 API Football Docs: [api-football.com/documentation](https://api-football.com/documentation)

---

## ✅ Final Checklist

Before going live:

- [ ] Domain configured (if using custom domain)
- [ ] Environment variables set
- [ ] Health check passes
- [ ] API integration tested
- [ ] Web interface functional
- [ ] Mobile responsiveness verified
- [ ] Analytics enabled
- [ ] Error monitoring active

**🎉 Congratulations! Your Premier League Predictor is now live!**

Share your deployed app:
- 🌐 **Live URL**: `https://your-app.vercel.app`
- 📱 **Mobile Friendly**: Responsive design
- ⚡ **Fast Loading**: Optimized for performance
- 🔮 **Smart Predictions**: AI-powered match outcomes

---

*Need help? Open an issue on GitHub or check the comprehensive README.md*
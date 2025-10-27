# Gold Investment KPI Dashboard - Setup Guide

A hybrid dashboard that combines automatic API updates (gold, Fed data, dollar index) with manual data entry (central bank purchases, geopolitical events).

## 🎯 Quick Start

### Option 1: Simple - Just Use It Locally
1. Open the dashboard HTML file in your browser
2. Click "Show Admin" to manually add data
3. Data saves to browser localStorage

### Option 2: Full Setup - Auto-Updating Production Dashboard

## 📋 Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel/Netlify account (free tier)
- Free API keys (instructions below)

## 🔑 Step 1: Get Free API Keys

### Required APIs

#### 1. Twelve Data (Gold Price & Dollar Index)
- **URL**: https://twelvedata.com/pricing
- **Free Tier**: 800 requests/day
- **Sign up**: Email required
- **Time**: 2 minutes

#### 2. FRED API (Federal Reserve Data)
- **URL**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Free Tier**: Unlimited!
- **Sign up**: Create account, request API key
- **Time**: 3 minutes

#### 3. Alpha Vantage (Fallback for Gold)
- **URL**: https://www.alphavantage.co/support/#api-key
- **Free Tier**: 25 requests/day
- **Sign up**: Email required
- **Time**: 1 minute

### Optional API

#### 4. NewsAPI (Geopolitical Events - Optional)
- **URL**: https://newsapi.org/register
- **Free Tier**: 100 requests/day
- **Sign up**: Email required
- **Time**: 2 minutes
- **Note**: Can skip this and add events manually via Admin panel

## 🚀 Step 2: Project Setup

### 2.1 Initialize Project

```bash
# Create project directory
mkdir gold-dashboard
cd gold-dashboard

# Initialize npm
npm init -y

# Install dependencies
npm install node-fetch@2
npm install --save-dev vite @vitejs/plugin-react

# Create directory structure
mkdir -p public/data scripts .github/workflows src
```

### 2.2 File Structure

```
gold-dashboard/
├── public/
│   └── data/                  # API data will be saved here
│       ├── gold-price.json
│       ├── fed-policy.json
│       ├── dollar-index.json
│       └── geopolitical-events.json
├── scripts/
│   └── update-data.js         # API fetcher script
├── .github/
│   └── workflows/
│       └── update-data.yml    # GitHub Actions config
├── src/
│   └── App.jsx               # React dashboard component
├── package.json
├── vite.config.js
└── .gitignore
```

### 2.3 Add Scripts to package.json

```json
{
  "name": "gold-dashboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "update-data": "node scripts/update-data.js"
  },
  "dependencies": {
    "node-fetch": "^2.7.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.263.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### 2.4 Create vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public'
});
```

### 2.5 Create .gitignore

```
node_modules/
dist/
.env
.DS_Store
*.log
```

## 🔐 Step 3: Configure Secrets

### 3.1 Local Development (.env file)

Create `.env` in project root:

```env
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
FRED_KEY=your_fred_api_key_here
TWELVE_DATA_KEY=your_twelve_data_key_here
NEWS_API_KEY=your_newsapi_key_here
```

### 3.2 GitHub Secrets (for Actions)

1. Go to your GitHub repo: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add each secret:
   - `ALPHA_VANTAGE_KEY`
   - `FRED_KEY`
   - `TWELVE_DATA_KEY`
   - `NEWS_API_KEY` (optional)

## 🧪 Step 4: Test Locally

```bash
# Test API fetcher
npm run update-data

# Should create JSON files in public/data/

# Start development server
npm run dev

# Open http://localhost:5173
```

## ☁️ Step 5: Deploy to Vercel

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 5.2 Deploy

```bash
# Login
vercel login

# Deploy
vercel

# Follow prompts, link to GitHub repo
```

### 5.3 Configure Vercel

1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables
3. Add the same API keys as production variables

### 5.4 Enable Auto-Deploy

In Vercel project settings:
- Enable Git integration
- Set to auto-deploy on `main` branch commits
- When GitHub Actions updates data, Vercel auto-redeploys

## ⚙️ Step 6: Enable GitHub Actions

### 6.1 Commit Everything

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 6.2 Verify Workflow

1. Go to GitHub repo → `Actions` tab
2. You should see "Update Gold Dashboard Data" workflow
3. Click "Run workflow" to test manually
4. Check that data files are committed to `public/data/`

### 6.3 Schedule Confirmation

The workflow runs automatically every 6 hours:
- 00:00 UTC (7pm EST)
- 06:00 UTC (1am EST)
- 12:00 UTC (7am EST)
- 18:00 UTC (1pm EST)

## 📊 Step 7: Manual Data Entry

### Central Bank Purchases (Quarterly)

1. Visit World Gold Council: https://www.gold.org/goldhub/data/gold-demand-statistics
2. Check quarterly report (released ~6 weeks after quarter end)
3. Open your dashboard → Click "Show Admin"
4. Add data by country in tonnes
5. Click "Add CB Data"

### Geopolitical Events (As Needed)

When significant events occur:
1. Open dashboard → "Show Admin"
2. Enter date, description, severity, impact
3. Click "Add Event"

## 🔍 Monitoring & Maintenance

### Check API Usage

**Twelve Data** (most critical - 800/day limit):
- Gold price: 1 call per update
- Dollar index: 1 call per update
- 4 updates/day × 2 calls = 8 calls/day
- **Usage: 1% of quota** ✓

**FRED** (unlimited):
- No concerns

**Alpha Vantage** (25/day limit):
- Used as fallback only
- **Usage: ~0.5 calls/day** ✓

**NewsAPI** (100/day limit):
- Optional, 1 call per update
- 4 updates/day = 4 calls/day
- **Usage: 4% of quota** ✓

### Common Issues

#### "API rate limit exceeded"
- Check GitHub Actions logs
- Reduce update frequency in workflow (change cron to */12 for every 12 hours)
- Verify API keys are correct

#### "Data not updating"
- Check GitHub Actions → Last run status
- Verify secrets are configured in GitHub
- Check API key validity (they can expire)

#### "Charts showing old data"
- Hard refresh browser (Ctrl+Shift+R)
- Check if JSON files in public/data/ are updating
- Verify Vercel is redeploying on commits

## 🎨 Customization

### Change Update Frequency

Edit `.github/workflows/update-data.yml`:

```yaml
schedule:
  - cron: '0 */12 * * *'  # Every 12 hours instead of 6
```

### Add More Countries to Central Bank Tracker

Edit the dashboard component and admin panel to add more input fields.

### Change Date Range

In `update-data.js`, modify `outputsize` parameters:

```javascript
outputsize=365  // Change to 180 for 6 months, 730 for 2 years
```

## 🔒 Security Notes

- **Never commit API keys** to Git
- Use environment variables only
- GitHub secrets are encrypted
- API keys are free tier - low risk if exposed
- Can regenerate all keys if needed

## 📱 Mobile Optimization

The dashboard is responsive and works on mobile. For better mobile experience:
- Use landscape mode for charts
- Admin panel is collapsible
- Touch-friendly buttons

## 💰 Cost Summary

| Service | Cost |
|---------|------|
| Twelve Data | Free (800/day) |
| FRED API | Free (unlimited) |
| Alpha Vantage | Free (25/day) |
| NewsAPI | Free (100/day) |
| Vercel Hosting | Free (100GB bandwidth) |
| GitHub Actions | Free (2000 min/month) |
| **Total** | **$0.00/month** |

## 🆘 Support & Troubleshooting

### Test APIs Individually

```bash
# Test gold price
curl "https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&apikey=YOUR_KEY"

# Test Fed data
curl "https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=YOUR_KEY&file_type=json"
```

### Debugging

Enable verbose logging in `update-data.js`:

```javascript
console.log('Response:', JSON.stringify(data, null, 2));
```

### Manual Update

Force a data refresh:
1. Go to GitHub repo → Actions
2. Select "Update Gold Dashboard Data"
3. Click "Run workflow"

## 🎯 Next Steps

1. ✅ Set up all APIs
2. ✅ Deploy to Vercel
3. ✅ Enable GitHub Actions
4. 📅 Add quarterly central bank data
5. 📰 Track geopolitical events
6. 📊 Monitor and analyze trends!

## 📚 Additional Resources

- [Twelve Data Docs](https://twelvedata.com/docs)
- [FRED API Docs](https://fred.stlouisfed.org/docs/api/fred/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Questions?** Check the troubleshooting section or review API documentation.

**Dashboard working?** 🎉 You now have a self-updating gold investment tracker!
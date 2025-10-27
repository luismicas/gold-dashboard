# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gold Investment KPI Dashboard - A hybrid auto-updating dashboard for monitoring gold investment indicators. Combines automatic API updates (gold prices, Fed data, dollar index) with manual data entry (central bank purchases, geopolitical events).

**Tech Stack:**
- Frontend: React 18 + Vite
- Charting: Recharts
- Icons: Lucide React
- Data Fetching: Node.js script using node-fetch
- Automation: GitHub Actions (runs every 6 hours)
- Deployment: Designed for Vercel/Netlify

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server (Vite)
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Data Update Scripts
```bash
# Fetch latest data from APIs (requires API keys in environment)
npm run update-data

# Test data update (dry run)
npm run update-data:test
```

### Environment Variables Required
Create `.env` file with:
```
ALPHA_VANTAGE_KEY=your_key
FRED_KEY=your_key
TWELVE_DATA_KEY=your_key
NEWS_API_KEY=your_key    # Optional
```

## Project Architecture

### Data Flow Architecture

**Two-Track System:**

1. **Automated API Data** (every 6 hours via GitHub Actions)
   - Gold prices (XAU/USD)
   - Federal Reserve policy rates (Fed Funds Rate, Real Yield)
   - Dollar Index (DXY)
   - Geopolitical news events (optional)

2. **Manual Data Entry** (via browser localStorage)
   - Central bank gold purchases (quarterly)
   - User-added geopolitical events

### Key Files

**Data Update Pipeline:**
- `scripts/update-data.js` - Main data fetcher script
  - Fetches from 4 API sources with fallback logic
  - Rate-limits API calls (2-second delays)
  - Saves to `/public/data/*.json`
  - Exits with code 1 if all APIs fail

- `.github/workflows/update-data.yml` - GitHub Actions workflow
  - Schedule: `0 */6 * * *` (every 6 hours)
  - Commits changed JSON files automatically
  - Creates GitHub issue on failure

**Frontend:**
- `index.html` - Entry point with Vite integration
- `src/main.jsx` - React root entry point
- `src/App.jsx` - Main dashboard component (basic skeleton)
- `src/index.css` - Base styles

**Configuration:**
- `vite.config.js` - Vite build configuration
- `.gitignore` - Git ignore rules

**Data Storage:**
- `/public/data/` - Auto-generated API data (JSON)
  - `gold-price.json` - 180 days of XAU/USD prices
  - `fed-policy.json` - Fed Funds Rate + Real Yield (180 days)
  - `dollar-index.json` - DXY values (180 days)
  - `geopolitical-events.json` - Recent news events (15 items)

### API Integration Details

**Primary APIs:**
1. **Twelve Data** (gold price + DXY) - 800 calls/day limit
   - Used for XAU/USD and DXY time series
   - Fallback: Alpha Vantage for gold prices

2. **FRED** (Federal Reserve data) - unlimited
   - Series: DFF (Fed Funds Rate), DFII10 (10-Year TIPS)

3. **Alpha Vantage** (fallback for gold) - 25 calls/day limit
   - Only used if Twelve Data fails

4. **NewsAPI** (optional geopolitical) - 100 calls/day limit
   - Keyword search for gold-related news
   - Simple sentiment analysis (severity: low/medium/high)

**Rate Limiting:**
- 2-second delays between API calls
- Sequential execution (not parallel)
- Fallback logic prevents cascading failures

### Data Format Standards

All JSON files follow this pattern:
```json
{
  "lastUpdated": "ISO 8601 timestamp",
  "source": "API name",
  "data": [
    { "date": "Jan 1, 2024", "value": 123.45 }
  ]
}
```

Date format: `"MMM D, YYYY"` (e.g., "Jan 15, 2024")

### GitHub Actions Workflow

**Trigger Conditions:**
- Scheduled: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- Manual: Via workflow_dispatch

**Process:**
1. Checkout repo
2. Install dependencies (`npm ci --only=production`)
3. Run `update-data.js` with API keys from secrets
4. Check for data changes with `git diff`
5. Commit changes if data updated
6. Create GitHub issue on failure

**Required GitHub Secrets:**
- `ALPHA_VANTAGE_KEY`
- `FRED_KEY`
- `TWELVE_DATA_KEY`
- `NEWS_API_KEY` (optional)

## Important Notes

### Data Update Constraints
- Script location: Must be in `scripts/update-data.js` (GitHub Actions hardcoded path)
- Data directory: Must be `public/data/` (referenced in workflow)
- Node version: Requires Node.js 18+ (specified in package.json engines)

### API Call Budget (per update cycle)
- Twelve Data: 2-3 calls (gold + DXY, maybe currency pairs for DXY fallback)
- FRED: 2 calls (DFF + DFII10)
- Alpha Vantage: 0-1 calls (only if Twelve Data fails)
- NewsAPI: 0-1 calls (if key provided)

**Daily total: ~32-48 calls across all APIs** (well within free tier limits)

### Deployment Considerations
- Vercel/Netlify will auto-redeploy when GitHub Actions commits data updates
- Environment variables must be configured in hosting platform dashboard
- Public data files are committed to git (not gitignored)
- Build output: `dist/` directory (Vite default)

## Development Workflow

When adding features:

1. **For API changes:** Edit `update-data.js`
   - Add new data sources in separate async functions
   - Follow existing pattern: try/catch with fallbacks
   - Save to `public/data/*.json` with `saveData()`
   - Test locally with `npm run update-data`

2. **For frontend changes:** Edit React components in `src/`
   - Fetch data from `/data/*.json` endpoints
   - Use Recharts for visualizations
   - Store manual entries in localStorage

3. **For automation changes:** Edit `update-data.yml`
   - Modify cron schedule for different update frequency
   - Add new environment variables in `env:` section
   - Test with manual workflow dispatch

## Troubleshooting

**"API rate limit exceeded"**
- Check GitHub Actions logs for which API failed
- Reduce update frequency in `update-data.yml` cron schedule
- Verify API keys in GitHub Secrets

**"Data not updating"**
- Check last workflow run status in Actions tab
- Verify secrets are configured correctly
- Check if API keys expired

**Charts not rendering**
- Verify JSON files exist in `public/data/`
- Check browser console for fetch errors
- Clear browser cache (Ctrl+Shift+R)

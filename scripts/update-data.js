// scripts/update-data.js
// This script fetches data from free APIs and saves to JSON files
// Run via GitHub Actions every 6 hours

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API Keys from environment variables
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
const FRED_KEY = process.env.FRED_KEY;
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY; // Optional

// Data directory
const DATA_DIR = path.join(__dirname, '../public/data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Utility: Delay between API calls to respect rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Safe file write
function saveData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved: ${filename}`);
}

// ===========================================
// 1. UPDATE GOLD PRICE DATA
// ===========================================
async function updateGoldPrice() {
  console.log('\n📊 Fetching Gold Price...');
  
  try {
    // Option A: Twelve Data (recommended - 800 calls/day free)
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=365&apikey=${TWELVE_DATA_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }
    
    // Transform data
    const goldData = {
      lastUpdated: new Date().toISOString(),
      currentPrice: parseFloat(data.values[0].close),
      source: 'Twelve Data API',
      history: data.values.slice(0, 180).reverse().map(d => ({
        date: formatDate(d.datetime),
        price: Math.round(parseFloat(d.close))
      }))
    };
    
    saveData('gold-price.json', goldData);
    return goldData;
    
  } catch (error) {
    console.error('❌ Gold Price Error:', error.message);
    
    // Fallback: Try Alpha Vantage
    console.log('Trying Alpha Vantage fallback...');
    try {
      const fallbackResponse = await fetch(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=XAU&to_symbol=USD&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`
      );
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData['Error Message']) {
        throw new Error('Alpha Vantage fallback failed');
      }
      
      const timeSeries = fallbackData['Time Series FX (Daily)'];
      const goldData = {
        lastUpdated: new Date().toISOString(),
        source: 'Alpha Vantage API (fallback)',
        history: Object.entries(timeSeries).slice(0, 180).reverse().map(([date, values]) => ({
          date: formatDate(date),
          price: Math.round(parseFloat(values['4. close']))
        }))
      };
      
      goldData.currentPrice = goldData.history[goldData.history.length - 1].price;
      saveData('gold-price.json', goldData);
      return goldData;
      
    } catch (fallbackError) {
      console.error('❌ Both APIs failed:', fallbackError.message);
      return null;
    }
  }
}

// ===========================================
// 2. UPDATE FED POLICY DATA (FRED API)
// ===========================================
async function updateFedData() {
  console.log('\n📊 Fetching Fed Policy Data...');
  
  try {
    // Fetch Fed Funds Rate (DFF)
    const dffResponse = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DFF&api_key=${FRED_KEY}&file_type=json&limit=365&sort_order=desc`
    );
    const dffData = await dffResponse.json();
    
    await delay(1000); // Rate limit courtesy
    
    // Fetch 10-Year TIPS (Real Yield) - DFII10
    const realYieldResponse = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DFII10&api_key=${FRED_KEY}&file_type=json&limit=365&sort_order=desc`
    );
    const realYieldData = await realYieldResponse.json();
    
    if (dffData.error_message || realYieldData.error_message) {
      throw new Error('FRED API Error');
    }
    
    // Combine data
    const combinedData = dffData.observations.reverse().map((obs, idx) => {
      const realYieldObs = realYieldData.observations.reverse()[idx];
      return {
        date: formatDate(obs.date),
        fedRate: obs.value !== '.' ? parseFloat(obs.value).toFixed(2) : null,
        realYield: realYieldObs && realYieldObs.value !== '.' 
          ? parseFloat(realYieldObs.value).toFixed(2) 
          : null
      };
    }).filter(d => d.fedRate && d.realYield); // Remove incomplete data
    
    const fedData = {
      lastUpdated: new Date().toISOString(),
      source: 'Federal Reserve Economic Data (FRED)',
      currentFedRate: combinedData[combinedData.length - 1].fedRate,
      currentRealYield: combinedData[combinedData.length - 1].realYield,
      data: combinedData.slice(-180) // Last 6 months of daily data
    };
    
    saveData('fed-policy.json', fedData);
    return fedData;
    
  } catch (error) {
    console.error('❌ Fed Data Error:', error.message);
    return null;
  }
}

// ===========================================
// 3. UPDATE DOLLAR INDEX (DXY)
// ===========================================
async function updateDollarIndex() {
  console.log('\n📊 Fetching Dollar Index (DXY)...');
  
  try {
    // Twelve Data has DXY directly
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=DXY&interval=1day&outputsize=365&apikey=${TWELVE_DATA_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }
    
    const dxyData = {
      lastUpdated: new Date().toISOString(),
      source: 'Twelve Data API',
      currentDXY: parseFloat(data.values[0].close).toFixed(1),
      data: data.values.slice(0, 180).reverse().map(d => ({
        date: formatDate(d.datetime),
        dxy: parseFloat(d.close).toFixed(1)
      }))
    };
    
    saveData('dollar-index.json', dxyData);
    return dxyData;
    
  } catch (error) {
    console.error('❌ Dollar Index Error:', error.message);
    
    // Fallback: Calculate DXY proxy from major currency pairs
    console.log('Calculating DXY proxy from currency pairs...');
    try {
      const pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CAD'];
      const weights = { 'EUR/USD': -0.576, 'USD/JPY': 0.136, 'GBP/USD': -0.119, 'USD/CAD': 0.091 };
      
      // Fetch all pairs (this counts against Twelve Data quota)
      const pairData = {};
      for (const pair of pairs) {
        await delay(1000);
        const resp = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${pair}&interval=1day&outputsize=180&apikey=${TWELVE_DATA_KEY}`
        );
        const json = await resp.json();
        if (json.values) pairData[pair] = json.values;
      }
      
      // Calculate weighted DXY proxy
      const dxyProxy = [];
      const length = Math.min(...Object.values(pairData).map(v => v.length));
      
      for (let i = 0; i < length; i++) {
        let weightedSum = 100; // Base index
        pairs.forEach(pair => {
          const rate = parseFloat(pairData[pair][i].close);
          weightedSum += weights[pair] * rate;
        });
        
        dxyProxy.push({
          date: formatDate(pairData[pairs[0]][i].datetime),
          dxy: weightedSum.toFixed(1)
        });
      }
      
      const dxyData = {
        lastUpdated: new Date().toISOString(),
        source: 'Calculated DXY Proxy',
        currentDXY: dxyProxy[0].dxy,
        data: dxyProxy.reverse()
      };
      
      saveData('dollar-index.json', dxyData);
      return dxyData;
      
    } catch (proxyError) {
      console.error('❌ DXY Proxy calculation failed:', proxyError.message);
      return null;
    }
  }
}

// ===========================================
// 4. UPDATE GEOPOLITICAL EVENTS (NewsAPI)
// ===========================================
async function updateGeopoliticalEvents() {
  console.log('\n📊 Fetching Geopolitical News...');
  
  if (!NEWS_API_KEY) {
    console.log('⚠️  NewsAPI key not configured - skipping geopolitical updates');
    return null;
  }
  
  try {
    const keywords = 'gold OR "Federal Reserve" OR China OR geopolitical OR "Middle East" OR tariffs';
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message);
    }
    
    // Simple keyword-based severity detection
    const events = data.articles.map(article => {
      const text = (article.title + ' ' + article.description).toLowerCase();
      
      let severity = 'low';
      if (text.match(/war|crisis|attack|collapse|crash/)) severity = 'high';
      else if (text.match(/tension|concern|risk|warning|threat/)) severity = 'medium';
      
      let impact = 'neutral';
      if (text.match(/gold (rises|rally|surge|gains|higher)/)) impact = 'positive';
      else if (text.match(/gold (falls|decline|drop|lower)/)) impact = 'negative';
      else if (severity === 'high' || severity === 'medium') impact = 'positive'; // Default for crises
      
      return {
        date: article.publishedAt.split('T')[0],
        event: article.title.substring(0, 120),
        severity,
        impact,
        url: article.url
      };
    });
    
    const geoData = {
      lastUpdated: new Date().toISOString(),
      source: 'NewsAPI',
      events: events.slice(0, 15) // Keep most recent 15
    };
    
    saveData('geopolitical-events.json', geoData);
    return geoData;
    
  } catch (error) {
    console.error('❌ Geopolitical Events Error:', error.message);
    return null;
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// ===========================================
// MAIN EXECUTION
// ===========================================

async function main() {
  console.log('===========================================');
  console.log('🚀 Gold Dashboard Data Update');
  console.log('===========================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  const results = {
    goldPrice: null,
    fedPolicy: null,
    dollarIndex: null,
    geopolitical: null
  };
  
  // Run updates sequentially with delays
  results.goldPrice = await updateGoldPrice();
  await delay(2000);
  
  results.fedPolicy = await updateFedData();
  await delay(2000);
  
  results.dollarIndex = await updateDollarIndex();
  await delay(2000);
  
  results.geopolitical = await updateGeopoliticalEvents();
  
  // Summary
  console.log('\n===========================================');
  console.log('📊 UPDATE SUMMARY');
  console.log('===========================================');
  Object.entries(results).forEach(([key, value]) => {
    console.log(`${value ? '✓' : '✗'} ${key}: ${value ? 'Success' : 'Failed'}`);
  });
  
  const successCount = Object.values(results).filter(v => v).length;
  console.log(`\n${successCount}/4 data sources updated successfully`);
  console.log(`Completed at: ${new Date().toISOString()}`);
  
  // Exit with error code if all updates failed
  if (successCount === 0) {
    console.error('\n❌ All updates failed - check API keys and rate limits');
    process.exit(1);
  }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
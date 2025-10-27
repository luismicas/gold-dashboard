import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Building2, Globe, Settings, Download, RefreshCw } from 'lucide-react';

function App() {
  // API Data State
  const [goldData, setGoldData] = useState(null);
  const [fedData, setFedData] = useState(null);
  const [dxyData, setDxyData] = useState(null);
  const [geoEvents, setGeoEvents] = useState(null);

  // Manual Data State (localStorage)
  const [centralBankData, setCentralBankData] = useState([]);
  const [manualEvents, setManualEvents] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Admin Form State
  const [cbForm, setCbForm] = useState({
    quarter: '',
    china: '',
    russia: '',
    india: '',
    turkey: '',
    other: ''
  });

  const [eventForm, setEventForm] = useState({
    date: new Date().toISOString().split('T')[0],
    event: '',
    severity: 'medium',
    impact: 'neutral'
  });

  // Load API data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gold, fed, dxy, geo] = await Promise.all([
          fetch('/data/gold-price.json').then(res => res.json()),
          fetch('/data/fed-policy.json').then(res => res.json()),
          fetch('/data/dollar-index.json').then(res => res.json()),
          fetch('/data/geopolitical-events.json').then(res => res.json())
        ]);

        setGoldData(gold);
        setFedData(fed);
        setDxyData(dxy);
        setGeoEvents(geo);
        setLastUpdated(new Date(gold.lastUpdated));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load manual data from localStorage
  useEffect(() => {
    const savedCB = localStorage.getItem('centralBankData');
    const savedEvents = localStorage.getItem('manualEvents');

    if (savedCB) setCentralBankData(JSON.parse(savedCB));
    if (savedEvents) setManualEvents(JSON.parse(savedEvents));
  }, []);

  // Save central bank data
  const handleAddCBData = (e) => {
    e.preventDefault();
    const newData = {
      quarter: cbForm.quarter,
      data: [
        { country: 'China', tonnes: parseFloat(cbForm.china) || 0 },
        { country: 'Russia', tonnes: parseFloat(cbForm.russia) || 0 },
        { country: 'India', tonnes: parseFloat(cbForm.india) || 0 },
        { country: 'Turkey', tonnes: parseFloat(cbForm.turkey) || 0 },
        { country: 'Other', tonnes: parseFloat(cbForm.other) || 0 }
      ]
    };

    const updated = [...centralBankData, newData];
    setCentralBankData(updated);
    localStorage.setItem('centralBankData', JSON.stringify(updated));
    setCbForm({ quarter: '', china: '', russia: '', india: '', turkey: '', other: '' });
  };

  // Save geopolitical event
  const handleAddEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now() };
    const updated = [newEvent, ...manualEvents];
    setManualEvents(updated);
    localStorage.setItem('manualEvents', JSON.stringify(updated));
    setEventForm({
      date: new Date().toISOString().split('T')[0],
      event: '',
      severity: 'medium',
      impact: 'neutral'
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate price change
  const getPriceChange = () => {
    if (!goldData || !goldData.history || goldData.history.length < 2) return null;
    const current = goldData.currentPrice;
    const previous = goldData.history[goldData.history.length - 2].price;
    const change = current - previous;
    const changePercent = ((change / previous) * 100).toFixed(2);
    return { change, changePercent, isPositive: change >= 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Loading Gold Dashboard...</h2>
        </div>
      </div>
    );
  }

  const priceChange = getPriceChange();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <DollarSign className="w-8 h-8" />
                Gold Investment KPI Dashboard
              </h1>
              <p className="text-yellow-100 mt-1">
                Last updated: {lastUpdated?.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="flex items-center gap-2 bg-white text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-50 transition"
            >
              <Settings className="w-5 h-5" />
              {showAdmin ? 'Hide Admin' : 'Show Admin'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Gold Price Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-semibold">Gold Price (XAU/USD)</h3>
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {formatCurrency(goldData?.currentPrice || 0)}
            </div>
            {priceChange && (
              <div className={`flex items-center gap-1 mt-2 ${priceChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-semibold">
                  {priceChange.isPositive ? '+' : ''}{formatCurrency(priceChange.change)} ({priceChange.changePercent}%)
                </span>
              </div>
            )}
          </div>

          {/* Fed Rate Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-semibold">Fed Funds Rate</h3>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {fedData?.currentFedRate || '0.00'}%
            </div>
            <p className="text-sm text-gray-500 mt-2">Federal Reserve</p>
          </div>

          {/* Real Yield Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-semibold">Real Yield (10Y TIPS)</h3>
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {fedData?.currentRealYield || '0.00'}%
            </div>
            <p className="text-sm text-gray-500 mt-2">Lower = Better for Gold</p>
          </div>

          {/* Dollar Index Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-semibold">Dollar Index (DXY)</h3>
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {dxyData?.currentDXY || '0.0'}
            </div>
            <p className="text-sm text-gray-500 mt-2">USD Strength</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gold Price Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gold Price Trend (6 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={goldData?.history || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="price" stroke="#ca8a04" fill="#fef08a" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-2">Source: {goldData?.source}</p>
          </div>

          {/* Fed Policy Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Fed Policy Rates</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fedData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fedRate" stroke="#3b82f6" name="Fed Rate %" />
                <Line type="monotone" dataKey="realYield" stroke="#a855f7" name="Real Yield %" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-2">Source: {fedData?.source}</p>
          </div>

          {/* Dollar Index Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Dollar Index (DXY)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dxyData?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="dxy" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-2">Source: {dxyData?.source}</p>
          </div>

          {/* Central Bank Purchases Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Central Bank Gold Purchases</h2>
            {centralBankData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={centralBankData[centralBankData.length - 1]?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="tonnes" fill="#ca8a04" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No central bank data. Add data via Admin Panel.</p>
              </div>
            )}
            {centralBankData.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Latest: {centralBankData[centralBankData.length - 1]?.quarter}
              </p>
            )}
          </div>
        </div>

        {/* Geopolitical Events */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Geopolitical Events</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Manual Events First */}
            {manualEvents.map(event => (
              <div key={event.id} className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{event.event}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>{event.date}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        event.severity === 'high' ? 'bg-red-100 text-red-700' :
                        event.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        event.impact === 'positive' ? 'bg-green-100 text-green-700' :
                        event.impact === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.impact}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Manual</span>
                </div>
              </div>
            ))}

            {/* API Events */}
            {geoEvents?.events?.slice(0, 10).map((event, idx) => (
              <div key={idx} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{event.event}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>{event.date}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        event.severity === 'high' ? 'bg-red-100 text-red-700' :
                        event.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        event.impact === 'positive' ? 'bg-green-100 text-green-700' :
                        event.impact === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.impact}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Auto</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Panel */}
        {showAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Admin Panel - Manual Data Entry
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Central Bank Data Form */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Central Bank Purchases</h3>
                <form onSubmit={handleAddCBData} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Quarter (e.g., Q1 2024)
                    </label>
                    <input
                      type="text"
                      required
                      value={cbForm.quarter}
                      onChange={(e) => setCbForm({...cbForm, quarter: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="Q1 2024"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">China (tonnes)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cbForm.china}
                        onChange={(e) => setCbForm({...cbForm, china: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Russia (tonnes)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cbForm.russia}
                        onChange={(e) => setCbForm({...cbForm, russia: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">India (tonnes)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cbForm.india}
                        onChange={(e) => setCbForm({...cbForm, india: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Turkey (tonnes)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={cbForm.turkey}
                        onChange={(e) => setCbForm({...cbForm, turkey: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Other Countries (tonnes)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cbForm.other}
                      onChange={(e) => setCbForm({...cbForm, other: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition font-semibold"
                  >
                    Add CB Data
                  </button>
                </form>
              </div>

              {/* Geopolitical Event Form */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Geopolitical Event</h3>
                <form onSubmit={handleAddEvent} className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Event Description</label>
                    <textarea
                      required
                      value={eventForm.event}
                      onChange={(e) => setEventForm({...eventForm, event: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      rows="3"
                      placeholder="Describe the geopolitical event..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                    <select
                      value={eventForm.severity}
                      onChange={(e) => setEventForm({...eventForm, severity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Impact on Gold</label>
                    <select
                      value={eventForm.impact}
                      onChange={(e) => setEventForm({...eventForm, impact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="positive">Positive (Bullish)</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative (Bearish)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Add Event
                  </button>
                </form>
              </div>
            </div>

            {/* Data Management */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Data Management</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm('Clear all central bank data?')) {
                      setCentralBankData([]);
                      localStorage.removeItem('centralBankData');
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Clear CB Data
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all manual events?')) {
                      setManualEvents([]);
                      localStorage.removeItem('manualEvents');
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Clear Events
                </button>
                <button
                  onClick={() => {
                    const data = {
                      centralBankData,
                      manualEvents,
                      exportDate: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `gold-dashboard-backup-${Date.now()}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm py-6">
          <p>Data sources: Twelve Data, FRED, NewsAPI</p>
          <p className="mt-1">Updates automatically every 6 hours via GitHub Actions</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

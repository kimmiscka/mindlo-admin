import { useEffect, useState } from 'react';
import { TrendingUp, Users, UserPlus, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';
import {
  getAnalyticsTotalUsers, getAnalyticsNewUsers, getAnalyticsDailyActiveUsers,
  getAnalyticsCheckInCompletion, getAnalyticsContentCompletion,
  getAnalyticsMoodDistribution, getAnalyticsThemeFrequency,
} from '../lib/contentApi';
import type { AnalyticsMetrics } from '../types';

const RANGE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

const MOOD_COLORS: Record<string, string> = {
  peaceful: '#10b981', anxious: '#f59e0b', sad: '#3b82f6', angry: '#ef4444',
  neutral: '#9ca3af',
};

const THEME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export default function Activity() {
  const { admin } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');

  const loadMetrics = async (dayRange: number) => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - dayRange * 86400000).toISOString().split('T')[0];

      const [total, newCount, dau, checkins, content, moods, themes] = await Promise.all([
        getAnalyticsTotalUsers(),
        getAnalyticsNewUsers(startDate, endDate),
        getAnalyticsDailyActiveUsers(startDate, endDate),
        getAnalyticsCheckInCompletion(startDate, endDate),
        getAnalyticsContentCompletion(startDate, endDate),
        getAnalyticsMoodDistribution(startDate, endDate),
        getAnalyticsThemeFrequency(startDate, endDate),
      ]);

      const topContent = content.slice(0, 5).map((c) => ({
        ...c,
        label: c.content_id.slice(0, 20),
      }));

      setMetrics({
        totalUsers: total,
        newUsers: newCount,
        dau: dau.map((d) => ({ ...d, date: new Date(d.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) })),
        checkins: checkins.map((c) => ({ ...c, date: new Date(c.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) })),
        topContent,
        moodDistribution: moods.filter((m) => m.mood_key),
        themeFrequency: themes.slice(0, 8),
      });
      setDays(dayRange);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(30); }, []);

  if (!admin || !['super_admin', 'support_moderator'].includes(admin.role)) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar title="Activity" subtitle="App usage monitoring" />
        <main className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Access restricted to Super Admin and Support Moderators.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Activity" subtitle="App usage and engagement monitoring" />
      <main className="flex-1 p-6 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Date range picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Time range:</span>
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => loadMetrics(p.days)}
              disabled={loading}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                days === p.days
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'border-gray-200 text-gray-600 hover:border-brand-teal/50'
              } disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => loadMetrics(days)}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-teal"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading analytics…</div>
        ) : metrics ? (
          <>
            {/* Overview stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Users</span>
                  <Users size={16} className="text-brand-teal" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Avg DAU</span>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.dau.length ? Math.round(metrics.dau.reduce((s, d) => s + d.count, 0) / metrics.dau.length) : 0}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">New Sign-ups</span>
                  <UserPlus size={16} className="text-brand-violet" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.newUsers}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Check-ins</span>
                  <Calendar size={16} className="text-brand-pink" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.checkins.reduce((s, c) => s + c.count, 0)}
                </p>
              </div>
            </div>

            {/* DAU chart */}
            {metrics.dau.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Daily Active Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.dau}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Check-ins chart */}
            {metrics.checkins.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Daily Check-ins</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.checkins}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top content */}
            {metrics.topContent.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm">Most Completed Content</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.topContent}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mood & themes row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mood distribution */}
              {metrics.moodDistribution.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm">Mood Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie dataKey="count" data={metrics.moodDistribution} cx="50%" cy="50%" outerRadius={100} label>
                        {metrics.moodDistribution.map((m, i) => (
                          <Cell key={i} fill={MOOD_COLORS[m.mood_key || 'neutral'] || '#9ca3af'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Theme frequency */}
              {metrics.themeFrequency.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm">Top Themes Selected</h3>
                  <div className="space-y-2">
                    {metrics.themeFrequency.map((t, i) => (
                      <div key={t.theme} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }}
                        />
                        <span className="text-sm text-gray-700 flex-1 capitalize">{t.theme}</span>
                        <span className="text-sm font-medium text-gray-900">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

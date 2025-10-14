'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { fetchWithApiKey } from '@/lib/api';

const COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  error: 'var(--error)',
  accent: 'var(--accent)',
  surface: 'var(--surface)',
  foreground: 'var(--foreground)',
  secondary: 'var(--text-secondary)',
};

interface JobsOverview {
  total: string;
  active: string;
  pending: string;
  closed: string;
  total_views: string;
  this_week: string;
}

interface CategoriesOverview {
  total: string;
  active: string;
  total_jobs_in_categories: string;
}

interface FeedbackOverview {
  total: string;
  pending: string;
  approved: string;
  rejected: string;
  this_week: string;
}

interface ContactOverview {
  total: string;
  pending: string;
  approved: string;
  rejected: string;
  this_week: string;
}

interface CategoryRequestsOverview {
  pending: string;
}

interface OverviewData {
  jobs: JobsOverview;
  categories: CategoriesOverview;
  feedback: FeedbackOverview;
  contact: ContactOverview;
  categoryRequests: CategoryRequestsOverview;
}

interface JobsAnalytics {
  byStatus: Array<{ status: string; count: string }>;
  byType: Array<{ job_type: string; count: string }>;
  byCategory: Array<{ category_name: string; icon: string; job_count: string }>;
  trend: Array<{ date: string; count: string }>;
}

interface FeedbackAnalytics {
  byType: Array<{ feedback_type: string; count: string }>;
  byStatus: Array<{ status: string; count: string }>;
  trend: Array<{ date: string; count: string }>;
}

export default function Analytics() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [jobsAnalytics, setJobsAnalytics] = useState<JobsAnalytics | null>(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setIsLoading(true);
      
      const [overviewRes, jobsRes, feedbackRes] = await Promise.all([
        fetchWithApiKey('/api/analytics/overview'),
        fetchWithApiKey('/api/analytics/jobs'),
        fetchWithApiKey('/api/analytics/feedback'),
      ]);

      const [overviewData, jobsData, feedbackData] = await Promise.all([
        overviewRes.json(),
        jobsRes.json(),
        feedbackRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (jobsData.success) setJobsAnalytics(jobsData.data);
      if (feedbackData.success) setFeedbackAnalytics(feedbackData.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  // Prepare chart data
  const jobsStatusData = jobsAnalytics?.byStatus.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: parseInt(item.count),
  })) || [];

  const jobsTypeData = jobsAnalytics?.byType.map(item => ({
    name: item.job_type ? item.job_type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown',
    value: parseInt(item.count),
  })) || [];

  const categoryJobsData = jobsAnalytics?.byCategory.slice(0, 10).map(item => ({
    name: item.category_name,
    jobs: parseInt(item.job_count),
    icon: item.icon,
  })) || [];

  const feedbackTypeData = feedbackAnalytics?.byType.map(item => ({
    name: item.feedback_type.charAt(0).toUpperCase() + item.feedback_type.slice(1),
    value: parseInt(item.count),
  })) || [];

  const statusColors = {
    'Active': COLORS.success,
    'Pending': COLORS.primary,
    'Closed': COLORS.error,
  };

  const typeColors = [
    COLORS.primary, 
    COLORS.success, 
    'hsl(258, 90%, 66%)',  // Purple
    'hsl(330, 81%, 60%)',  // Pink
    'hsl(38, 92%, 50%)'    // Orange
  ];

  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics & Reports</h1>
          <p className="text-text-secondary">Platform performance and insights</p>
        </div>

        {/* Google Analytics Section */}
        <div className="bg-gradient-to-br from-primary/5 via-success/5 to-primary/10 rounded-lg p-8 mb-8 border border-accent shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 border-2 border-primary/20 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" className="fill-primary"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" className="fill-success"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" className="fill-primary opacity-70"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" className="fill-error"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                  Google Analytics
                  <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded-full">Active</span>
                </h2>
                <p className="text-text-secondary">Real-time website analytics and user insights</p>
              </div>
            </div>
            <a
              href="https://analytics.google.com/analytics/web/#/p468091965/reports/intelligenthome"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-background hover:bg-primary-dark px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <span>Open Dashboard</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a
              href="https://analytics.google.com/analytics/web/#/p468091965/reports/intelligenthome"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface/80 backdrop-blur-sm hover:bg-surface p-5 rounded-lg transition-all border border-accent hover:border-primary group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-foreground font-semibold group-hover:text-primary transition-colors">Real-time</span>
              </div>
              <p className="text-text-secondary text-sm">View live users and events</p>
            </a>

            <a
              href="https://analytics.google.com/analytics/web/#/p468091965/reports/reportinghub"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface/80 backdrop-blur-sm hover:bg-surface p-5 rounded-lg transition-all border border-accent hover:border-primary group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-foreground font-semibold group-hover:text-primary transition-colors">Users</span>
              </div>
              <p className="text-text-secondary text-sm">Demographics and behavior</p>
            </a>

            <a
              href="https://analytics.google.com/analytics/web/#/p468091965/reports/lifecycle-traffic-acquisition"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface/80 backdrop-blur-sm hover:bg-surface p-5 rounded-lg transition-all border border-accent hover:border-primary group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-foreground font-semibold group-hover:text-primary transition-colors">Traffic</span>
              </div>
              <p className="text-text-secondary text-sm">Acquisition and sources</p>
            </a>

            <a
              href="https://analytics.google.com/analytics/web/#/p468091965/reports/lifecycle-engagement-pages-and-screens"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface/80 backdrop-blur-sm hover:bg-surface p-5 rounded-lg transition-all border border-accent hover:border-primary group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center group-hover:bg-error/20 transition-colors">
                  <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-foreground font-semibold group-hover:text-primary transition-colors">Pages</span>
              </div>
              <p className="text-text-secondary text-sm">Top pages and engagement</p>
            </a>
          </div>

          <div className="mt-6 p-4 bg-surface/60 backdrop-blur-sm rounded-lg border border-accent/50">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">Tracking ID: G-D5Z408GJ0V</p>
                <p className="text-text-secondary text-xs">Google Analytics is actively tracking all admin panel pages</p>
              </div>
              <span className="px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full">Connected</span>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Jobs"
            value={overview?.jobs.total || '0'}
            icon="💼"
            color="primary"
          />
          <StatCard
            title="Active Jobs"
            value={overview?.jobs.active || '0'}
            icon="✅"
            color="success"
          />
          <StatCard
            title="Active Categories"
            value={overview?.categories.active || '0'}
            icon="🏷️"
            color="primary"
          />
          <StatCard
            title="Total Views"
            value={overview?.jobs.total_views || '0'}
            icon="👁️"
            color="success"
          />
        </div>

        {/* Charts Row 1 - Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Jobs by Status - Pie Chart */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Jobs by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={100}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {jobsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name as keyof typeof statusColors] || COLORS.accent} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: COLORS.surface, 
                    border: `1px solid ${COLORS.accent}`,
                    borderRadius: '8px',
                    color: COLORS.foreground
                  }}
                  labelStyle={{ color: COLORS.foreground }}
                  itemStyle={{ color: COLORS.foreground }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-accent rounded-lg">
                <p className="text-text-secondary text-xs mb-1">Active</p>
                <p className="text-success text-xl font-bold">{overview?.jobs.active || 0}</p>
              </div>
              <div className="text-center p-3 bg-accent rounded-lg">
                <p className="text-text-secondary text-xs mb-1">Pending</p>
                <p className="text-primary text-xl font-bold">{overview?.jobs.pending || 0}</p>
              </div>
              <div className="text-center p-3 bg-accent rounded-lg">
                <p className="text-text-secondary text-xs mb-1">Closed</p>
                <p className="text-error text-xl font-bold">{overview?.jobs.closed || 0}</p>
              </div>
            </div>
          </div>

          {/* Jobs by Type - Pie Chart */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Jobs by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobsTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={100}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {jobsTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: COLORS.surface, 
                    border: `1px solid ${COLORS.accent}`,
                    borderRadius: '8px',
                    color: COLORS.foreground
                  }}
                  labelStyle={{ color: COLORS.foreground }}
                  itemStyle={{ color: COLORS.foreground }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {jobsTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: typeColors[index % typeColors.length] }}
                    />
                    <span className="text-foreground text-sm">{item.name}</span>
                  </div>
                  <span className="text-foreground font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 - Categories & Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Categories - Bar Chart */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Top Categories by Jobs</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryJobsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.accent} />
                <XAxis type="number" stroke={COLORS.secondary} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  stroke={COLORS.secondary}
                  tick={{ fill: COLORS.foreground }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: COLORS.surface, 
                    border: `1px solid ${COLORS.accent}`,
                    borderRadius: '8px',
                    color: COLORS.foreground
                  }}
                  labelStyle={{ color: COLORS.foreground }}
                  itemStyle={{ color: COLORS.foreground }}
                  cursor={{ fill: COLORS.accent }}
                />
                <Bar dataKey="jobs" fill={COLORS.primary} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feedback by Type - Pie Chart */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Feedback by Type</h2>
            {feedbackTypeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={feedbackTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                    >
                      {feedbackTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.surface, 
                      border: `1px solid ${COLORS.accent}`,
                      borderRadius: '8px',
                      color: COLORS.foreground
                    }}
                    labelStyle={{ color: COLORS.foreground }}
                    itemStyle={{ color: COLORS.foreground }}
                  />
                </PieChart>
              </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {feedbackTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: typeColors[index % typeColors.length] }}
                        />
                        <span className="text-foreground text-sm">{item.name}</span>
                      </div>
                      <span className="text-foreground font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-text-secondary">
                No feedback data yet
              </div>
            )}
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Jobs Overview */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Jobs Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Jobs</span>
                <span className="text-primary text-2xl font-bold">{overview?.jobs.total || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Active</span>
                <span className="text-success text-xl font-bold">{overview?.jobs.active || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Pending Approval</span>
                <span className="text-primary text-xl font-bold">{overview?.jobs.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Views</span>
                <span className="text-foreground text-xl font-bold">{overview?.jobs.total_views || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Posted This Week</span>
                <span className="text-foreground text-xl font-bold">{overview?.jobs.this_week || 0}</span>
              </div>
            </div>
          </div>

          {/* Categories Overview */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Categories Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Categories</span>
                <span className="text-primary text-2xl font-bold">{overview?.categories.total || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Active</span>
                <span className="text-success text-xl font-bold">{overview?.categories.active || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Jobs</span>
                <span className="text-foreground text-xl font-bold">{overview?.categories.total_jobs_in_categories || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Pending Requests</span>
                <span className="text-primary text-xl font-bold">{overview?.categoryRequests.pending || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback & Contact Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Feedback Analytics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Feedback</span>
                <span className="text-primary text-2xl font-bold">{overview?.feedback.total || 0}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Pending</p>
                  <p className="text-primary text-2xl font-bold">{overview?.feedback.pending || 0}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Approved</p>
                  <p className="text-success text-2xl font-bold">{overview?.feedback.approved || 0}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Rejected</p>
                  <p className="text-error text-2xl font-bold">{overview?.feedback.rejected || 0}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">This Week</span>
                <span className="text-foreground text-xl font-bold">{overview?.feedback.this_week || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
            <h2 className="text-xl font-bold text-foreground mb-6">Contact Messages</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">Total Messages</span>
                <span className="text-primary text-2xl font-bold">{overview?.contact.total || 0}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Pending</p>
                  <p className="text-primary text-2xl font-bold">{overview?.contact.pending || 0}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Approved</p>
                  <p className="text-success text-2xl font-bold">{overview?.contact.approved || 0}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Rejected</p>
                  <p className="text-error text-2xl font-bold">{overview?.contact.rejected || 0}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent rounded-lg">
                <span className="text-foreground font-medium">This Week</span>
                <span className="text-foreground text-xl font-bold">{overview?.contact.this_week || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Items Summary */}
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
          <h2 className="text-xl font-bold text-foreground mb-6">Pending Items Requiring Action</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-accent rounded-lg border-l-4 border-primary hover:border-primary transition-all">
              <p className="text-text-secondary text-sm mb-2">Pending Jobs</p>
              <p className="text-3xl font-bold text-primary mb-1">{overview?.jobs.pending || 0}</p>
              <p className="text-text-secondary text-xs">Need approval</p>
            </div>
            <div className="text-center p-6 bg-accent rounded-lg border-l-4 border-primary hover:border-primary transition-all">
              <p className="text-text-secondary text-sm mb-2">Category Requests</p>
              <p className="text-3xl font-bold text-primary mb-1">{overview?.categoryRequests.pending || 0}</p>
              <p className="text-text-secondary text-xs">Need review</p>
            </div>
            <div className="text-center p-6 bg-accent rounded-lg border-l-4 border-primary hover:border-primary transition-all">
              <p className="text-text-secondary text-sm mb-2">Pending Feedback</p>
              <p className="text-3xl font-bold text-primary mb-1">{overview?.feedback.pending || 0}</p>
              <p className="text-text-secondary text-xs">Need response</p>
            </div>
            <div className="text-center p-6 bg-accent rounded-lg border-l-4 border-primary hover:border-primary transition-all">
              <p className="text-text-secondary text-sm mb-2">Pending Contact</p>
              <p className="text-3xl font-bold text-primary mb-1">{overview?.contact.pending || 0}</p>
              <p className="text-text-secondary text-xs">Need response</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

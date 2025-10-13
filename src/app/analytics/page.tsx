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

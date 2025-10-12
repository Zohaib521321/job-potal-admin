'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

import { apiGet } from '@/lib/api';

interface Job {
  id: number;
  title: string;
  company_name: string;
  status: string;
  posted_at: string;
}

interface JobStats {
  total_jobs: string;
  active_jobs: string;
  pending_jobs: string;
  closed_jobs: string;
}

export default function Dashboard() {
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent jobs
      const jobsData = await apiGet('/api/jobs?page=1&limit=5&status=all');
      if (jobsData.success) {
        setRecentJobs(jobsData.data);
      }

      // Fetch job stats
      const statsData = await apiGet('/api/jobs/stats/summary');
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch categories count
      const categoriesData = await apiGet('/api/categories');
      if (categoriesData.success) {
        setCategoriesCount(categoriesData.count);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-text-secondary">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Jobs"
            value={stats?.total_jobs || '0'}
            icon="💼"
            color="primary"
          />
          <StatCard
            title="Active Jobs"
            value={stats?.active_jobs || '0'}
            icon="✅"
            color="success"
          />
          <StatCard
            title="Pending Jobs"
            value={stats?.pending_jobs || '0'}
            icon="⏳"
            color="primary"
          />
          <StatCard
            title="Total Categories"
            value={categoriesCount.toString()}
            icon="🏷️"
            color="success"
          />
        </div>

        {/* Recent Jobs */}
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Recent Jobs</h2>
            {/* <button className="text-primary hover:text-primary-dark text-sm font-medium">
              View All →
            </button> */}
          </div>
          
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold mb-1">{job.title}</h3>
                  <p className="text-text-secondary text-sm">{job.company_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-text-secondary text-sm">{getTimeAgo(job.posted_at)}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active'
                        ? 'bg-success/10 text-success'
                        : job.status === 'pending'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-error/10 text-error'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent">
          <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">Post New Job</p>
                <p className="text-text-secondary text-sm">Create a job listing</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold group-hover:text-success transition-colors">Add Category</p>
                <p className="text-text-secondary text-sm">Create new category</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-4 bg-accent hover:bg-accent/80 rounded-lg transition-all duration-200 group">
              <div className="w-12 h-12 bg-foreground/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-foreground font-semibold group-hover:text-primary transition-colors">View Reports</p>
                <p className="text-text-secondary text-sm">Detailed analytics</p>
              </div>
            </button>
          </div>
        </div> */}
      </main>
    </div>
  );
}

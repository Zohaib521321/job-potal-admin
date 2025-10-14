'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { apiGet, apiDelete } from '@/lib/api';

interface Subscription {
  id: number;
  email: string;
  category_id: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface SubscriptionsResponse {
  success: boolean;
  data: Subscription[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

function JobAlertsContent() {
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchCategories();
    
    // Set category filter from URL params
    const categoryParam = searchParams?.get('category');
    if (categoryParam) {
      setFilterCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterCategory]);

  const fetchCategories = async () => {
    try {
      const data = await apiGet<CategoriesResponse>('/api/categories');
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (filterCategory !== 'all') {
        params.append('category_id', filterCategory);
      }

      const data = await apiGet<SubscriptionsResponse>(`/api/job-alerts/subscriptions?${params}`);
      
      if (data.success) {
        setSubscriptions(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      await apiDelete(`/api/job-alerts/subscriptions/${id}`);
      fetchSubscriptions(); // Refresh the list
    } catch (err) {
      console.error('Error deleting subscription:', err);
      alert('Failed to delete subscription');
    }
  };

  // Search handler - resets page and fetches subscriptions
  // Disabled for now as search is done via filteredSubscriptions
  // const handleSearch = () => {
  //   setCurrentPage(1);
  //   fetchSubscriptions();
  // };

  const filteredSubscriptions = subscriptions.filter(sub => 
    searchTerm === '' || 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const activeCount = subscriptions.filter(s => s.is_active).length;
  const inactiveCount = subscriptions.filter(s => !s.is_active).length;
  
  const stats = {
    total: totalCount,
    active: activeCount,
    inactive: inactiveCount,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Alert Subscriptions</h1>
          <p className="text-text-secondary">Manage email subscriptions for job alerts</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Total Subscriptions</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Active</p>
                <p className="text-3xl font-bold text-success">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm mb-1">Categories</p>
                <p className="text-3xl font-bold text-primary">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg p-6 mb-6 border border-accent">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search Email</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email..."
                className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">All Categories ({totalCount} subscriptions)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filter Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="w-full bg-accent hover:bg-accent/70 text-foreground font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-surface rounded-lg border border-accent overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-text-secondary mt-4">Loading subscriptions...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-text-secondary text-lg">No subscriptions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">Subscribed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent">
                    {filteredSubscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{subscription.email}</p>
                              {!subscription.is_active && (
                                <span className="text-xs text-error">Unsubscribed</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                            {subscription.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-text-secondary text-sm">
                            <p>{new Date(subscription.created_at).toLocaleDateString()}</p>
                            <p className="text-xs">{new Date(subscription.created_at).toLocaleTimeString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(subscription.id)}
                            className="text-error hover:text-error/80 font-medium text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-accent flex items-center justify-between">
                  <div className="text-sm text-text-secondary">
                    Showing <span className="font-medium text-foreground">{filteredSubscriptions.length}</span> of{' '}
                    <span className="font-medium text-foreground">{totalCount}</span> subscriptions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-accent/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JobAlerts() {
  return (
    <Suspense fallback={
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <JobAlertsContent />
    </Suspense>
  );
}


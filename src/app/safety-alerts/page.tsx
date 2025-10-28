'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { apiRequest } from '@/lib/api';

// Types
interface SafetyAlert {
  id: number;
  title: string;
  slug: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

interface SafetyAlertStats {
  total: number;
  draft_count: number;
  published_count: number;
  archived_count: number;
  low_priority: number;
  medium_priority: number;
  high_priority: number;
  urgent_priority: number;
  recent_alerts: number;
}

interface CreateSafetyAlertData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

type PaginatedResponse<T> = ApiResponse<{
  alerts: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}>;

export default function SafetyAlertsPage() {
  // State
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [stats, setStats] = useState<SafetyAlertStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<SafetyAlert | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Form data
  const [formData, setFormData] = useState<CreateSafetyAlertData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'draft'
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  };

  // Clear error message
  const clearError = () => setError('');

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await apiRequest<ApiResponse<SafetyAlertStats>>(
        '/api/safety-alerts/stats/summary',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch safety alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Please log in to access this page');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const response = await apiRequest<PaginatedResponse<SafetyAlert>>(
        `/api/safety-alerts?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.success) {
        setAlerts(response.data.alerts);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch safety alerts');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, priorityFilter]);

  // Initial load
  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [fetchAlerts, fetchStats]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      if (isEditMode && selectedAlert) {
        // Update alert
        const response = await apiRequest<ApiResponse<SafetyAlert>>(
          `/api/safety-alerts/${selectedAlert.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.success) {
          alert(response.message || 'Safety alert updated successfully');
          await fetchAlerts();
          await fetchStats();
          handleCloseModal();
        }
      } else {
        // Create new alert
        const response = await apiRequest<ApiResponse<SafetyAlert>>(
          '/api/safety-alerts',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.success) {
          alert(response.message || 'Safety alert created successfully');
          await fetchAlerts();
          await fetchStats();
          handleCloseModal();
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save safety alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!alertToDelete) return;

    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      if (!token) return;

      const response = await apiRequest<ApiResponse<void>>(
        `/api/safety-alerts/${alertToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.success) {
        alert('Safety alert deleted successfully');
        await fetchAlerts();
        await fetchStats();
        setIsDeleteModalOpen(false);
        setAlertToDelete(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete safety alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle publish/unpublish
  const handlePublishToggle = async (alertItem: SafetyAlert) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const action = alertItem.status === 'published' ? 'unpublish' : 'publish';
      
      const response = await apiRequest<ApiResponse<SafetyAlert>>(
        `/api/safety-alerts/${alertItem.id}/publish`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action })
        }
      );

      if (response.success) {
        alert(response.message || `Alert ${action}ed successfully`);
        await fetchAlerts();
        await fetchStats();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update alert status');
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedAlert(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'draft'
    });
    clearError();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alert: SafetyAlert) => {
    setIsEditMode(true);
    setSelectedAlert(alert);
    setFormData({
      title: alert.title,
      description: alert.description,
      priority: alert.priority,
      status: alert.status
    });
    clearError();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedAlert(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'draft'
    });
  };

  const handleOpenDeleteModal = (alert: SafetyAlert) => {
    setAlertToDelete(alert);
    setIsDeleteModalOpen(true);
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: 'bg-error/10 text-error border-error/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-success/10 text-success border-success/20'
    };
    
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-success/10 text-success border-success/20',
      draft: 'bg-primary/10 text-primary border-primary/20',
      archived: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    };
    
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-56 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Job Seeker Safety Alerts</h1>
          <p className="text-text-secondary">Manage safety alerts to protect users from job scams and unsafe practices</p>
        </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-error/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-error font-medium">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-error hover:text-error/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Alerts</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Published</p>
                <p className="text-2xl font-bold text-success">{stats.published_count}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Draft</p>
                <p className="text-2xl font-bold text-primary">{stats.draft_count}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Urgent Priority</p>
                <p className="text-2xl font-bold text-error">{stats.urgent_priority}</p>
              </div>
              <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-surface rounded-lg p-6 border border-accent mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-accent rounded-lg px-4 py-2 text-foreground placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-accent rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-background border border-accent rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={handleOpenCreateModal}
              className="bg-primary hover:bg-primary-dark text-background font-medium px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Create Alert
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-surface rounded-lg border border-accent overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No safety alerts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent">
                  <th className="text-left p-4 text-text-secondary font-medium">Title</th>
                  <th className="text-left p-4 text-text-secondary font-medium">Priority</th>
                  <th className="text-left p-4 text-text-secondary font-medium">Status</th>
                  <th className="text-left p-4 text-text-secondary font-medium">Created</th>
                  <th className="text-left p-4 text-text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-accent hover:bg-accent/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <h3 className="font-medium text-foreground">{alert.title}</h3>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {alert.description.length > 100 
                            ? `${alert.description.substring(0, 100)}...`
                            : alert.description
                          }
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary text-sm">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Publish/Unpublish Button */}
                        <button
                          onClick={() => handlePublishToggle(alert)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            alert.status === 'published'
                              ? 'bg-text-secondary/10 hover:bg-text-secondary/20 text-text-secondary'
                              : 'bg-success/10 hover:bg-success/20 text-success'
                          }`}
                        >
                          {alert.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(alert)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleOpenDeleteModal(alert)}
                          className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-accent flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-accent rounded-lg hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-accent rounded-lg hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-accent rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-accent">
              <h2 className="text-xl font-bold text-foreground">
                {isEditMode ? 'Edit Safety Alert' : 'Create Safety Alert'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-background border border-accent rounded-lg px-4 py-3 text-foreground placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter job seeker safety alert title..."
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-background border border-accent rounded-lg px-4 py-3 text-foreground placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-vertical"
                  placeholder="Enter detailed job seeker safety alert description..."
                />
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                    Priority *
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    className="w-full bg-background border border-accent rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                    Status *
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
                    className="w-full bg-background border border-accent rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Warning for published status */}
              {formData.status === 'published' && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📧</span>
                    <div>
                      <h4 className="font-medium text-primary">Email Notification</h4>
                      <p className="text-sm text-foreground mt-1">
                        This alert will be sent to all verified users when saved as &quot;Published&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-accent">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-accent rounded-lg text-foreground hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-background font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                  )}
                  {isEditMode ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && alertToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-accent rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Delete Safety Alert</h3>
                  <p className="text-text-secondary text-sm">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-background rounded-lg p-4 mb-6">
                <p className="text-foreground font-medium">{alertToDelete.title}</p>
                <p className="text-text-secondary text-sm mt-1">
                  {alertToDelete.description.length > 100 
                    ? `${alertToDelete.description.substring(0, 100)}...`
                    : alertToDelete.description
                  }
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-accent rounded-lg text-foreground hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-error hover:bg-error/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Delete Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}

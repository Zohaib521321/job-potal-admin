'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

import { apiGet, apiPut, apiDelete } from '@/lib/api';

interface FeedbackItem {
  id: number;
  name: string;
  email: string;
  feedback_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface CategoryRequest {
  id: number;
  name: string;
  description: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Feedback() {
  const [activeTab, setActiveTab] = useState<'feedback' | 'suggestions'>('feedback');
  const [filterStatus, setFilterStatus] = useState('all');
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<CategoryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [iconInput, setIconInput] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedback();
    } else if (activeTab === 'suggestions') {
      fetchCategoryRequests();
    }
  }, [activeTab]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/feedback');
      
      if (data.success) {
        setAllFeedback(data.data);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryRequests = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/category-requests');
      
      if (data.success) {
        setAllSuggestions(data.data);
      }
    } catch (err) {
      console.error('Error fetching category requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const icon = iconInput[id] || '🏷️';
    
    try {
      const data = await apiPut(`/api/category-requests/${id}/approve`, { icon });

      if (data.success) {
        alert('Category request approved and category created!');
        await fetchCategoryRequests();
      } else {
        alert(data.error?.message || 'Failed to approve request');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this category suggestion?')) {
      return;
    }

    try {
      const data = await apiPut(`/api/category-requests/${id}/reject`, {});

      if (data.success) {
        await fetchCategoryRequests();
      } else {
        alert(data.error?.message || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request');
    }
  };

  const handleDeleteCategoryRequest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      const data = await apiDelete(`/api/category-requests/${id}`);

      if (data.success) {
        await fetchCategoryRequests();
      } else {
        alert(data.error?.message || 'Failed to delete request');
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request');
    }
  };

  const handleApproveFeedback = async (id: number) => {
    try {
      const data = await apiPut(`/api/feedback/${id}/approve`, {});

      if (data.success) {
        await fetchFeedback();
      } else {
        alert(data.error?.message || 'Failed to approve feedback');
      }
    } catch (err) {
      console.error('Error approving feedback:', err);
      alert('Failed to approve feedback');
    }
  };

  const handleRejectFeedback = async (id: number) => {
    if (!confirm('Are you sure you want to reject this feedback?')) {
      return;
    }

    try {
      const data = await apiPut(`/api/feedback/${id}/reject`, {});

      if (data.success) {
        await fetchFeedback();
      } else {
        alert(data.error?.message || 'Failed to reject feedback');
      }
    } catch (err) {
      console.error('Error rejecting feedback:', err);
      alert('Failed to reject feedback');
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const data = await apiDelete(`/api/feedback/${id}`);

      if (data.success) {
        await fetchFeedback();
      } else {
        alert(data.error?.message || 'Failed to delete feedback');
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const filteredFeedback = allFeedback.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );

  const filteredSuggestions = allSuggestions.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );

  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Feedback & Suggestions</h1>
          <p className="text-text-secondary">Manage user feedback and category suggestions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'feedback'
                ? 'bg-primary text-background'
                : 'bg-surface text-text-secondary hover:text-foreground'
            }`}
          >
            User Feedback ({allFeedback.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'suggestions'
                ? 'bg-primary text-background'
                : 'bg-surface text-text-secondary hover:text-foreground'
            }`}
          >
            Category Suggestions ({allSuggestions.length})
          </button>
        </div>

        {/* Filter */}
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent mb-6">
          <div className="flex items-center gap-4">
            <label className="text-foreground font-medium">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-background text-foreground border border-accent rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {activeTab === 'feedback' ? (
            <>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Total Feedback</p>
                <p className="text-2xl font-bold text-foreground">{allFeedback.length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-primary">{allFeedback.filter(f => f.status === 'pending').length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Approved</p>
                <p className="text-2xl font-bold text-success">{allFeedback.filter(f => f.status === 'approved').length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Rejected</p>
                <p className="text-2xl font-bold text-error">{allFeedback.filter(f => f.status === 'rejected').length}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Total Suggestions</p>
                <p className="text-2xl font-bold text-foreground">{allSuggestions.length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-primary">{allSuggestions.filter(s => s.status === 'pending').length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Approved</p>
                <p className="text-2xl font-bold text-success">{allSuggestions.filter(s => s.status === 'approved').length}</p>
              </div>
              <div className="bg-surface rounded-lg p-4 border border-accent">
                <p className="text-text-secondary text-sm mb-1">Rejected</p>
                <p className="text-2xl font-bold text-error">{allSuggestions.filter(s => s.status === 'rejected').length}</p>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        {activeTab === 'feedback' ? (
          /* User Feedback */
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-text-secondary mt-4">Loading feedback...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedback.map((item) => {
                  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div key={item.id} className="bg-surface rounded-lg p-6 shadow-lg border border-accent hover:border-primary/50 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                            <span className="px-3 py-1 bg-accent text-text-secondary text-xs rounded-full capitalize">
                              {item.feedback_type}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.status === 'approved'
                                  ? 'bg-success/10 text-success'
                                  : item.status === 'rejected'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm mb-3">{item.email} • {formattedDate}</p>
                          <p className="text-foreground leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-accent">
                        {item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveFeedback(item.id)}
                              className="bg-success/10 hover:bg-success/20 text-success font-medium px-4 py-2 rounded-lg transition-all duration-200"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectFeedback(item.id)}
                              className="bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-lg transition-all duration-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="bg-accent hover:bg-accent/80 text-text-secondary font-medium px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredFeedback.length === 0 && !isLoading && (
                  <div className="text-center py-12 bg-surface rounded-lg border border-accent">
                    <p className="text-text-secondary text-lg">No feedback found</p>
                    <p className="text-text-secondary text-sm mt-2">
                      {filterStatus !== 'all' ? 'Try adjusting your filter' : 'Feedback will appear here when users submit them'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Category Suggestions */
          <>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-text-secondary mt-4">Loading suggestions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSuggestions.map((item) => {
                  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div key={item.id} className="bg-surface rounded-lg p-6 shadow-lg border border-accent hover:border-primary/50 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.status === 'approved'
                                  ? 'bg-success/10 text-success'
                                  : item.status === 'rejected'
                                  ? 'bg-error/10 text-error'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm mb-3">{item.email} • {formattedDate}</p>
                          <p className="text-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <div className="mb-4 pt-4 border-t border-accent">
                          <label className="block text-foreground font-medium mb-2">
                            Icon (Emoji)
                          </label>
                          <input
                            type="text"
                            value={iconInput[item.id] || ''}
                            onChange={(e) => setIconInput({ ...iconInput, [item.id]: e.target.value })}
                            placeholder="🏷️ (leave empty for default)"
                            maxLength={2}
                            className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-accent">
                        {item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(item.id)}
                              className="bg-success/10 hover:bg-success/20 text-success font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve & Add Category
                            </button>
                            <button 
                              onClick={() => handleReject(item.id)}
                              className="bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDeleteCategoryRequest(item.id)}
                          className="bg-accent hover:bg-accent/80 text-text-secondary font-medium px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredSuggestions.length === 0 && !isLoading && (
                  <div className="text-center py-12 bg-surface rounded-lg border border-accent">
                    <p className="text-text-secondary text-lg">No category suggestions found</p>
                    <p className="text-text-secondary text-sm mt-2">
                      {filterStatus !== 'all' ? 'Try adjusting your filter' : 'Suggestions will appear here when users submit them'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}


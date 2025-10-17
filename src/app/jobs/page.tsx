'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range: string;
  status: string;
  priority?: string;
  posted_at: string;
  category_name?: string;
  category_id?: number;
  description: string;
  contact_email?: string;
  whatsapp?: string;
  apply_link?: string;
}

interface Category {
  id: number;
  name: string;
}

interface CategoriesApiResponse {
  success: boolean;
  data: Category[];
}

interface JobsApiResponse {
  success: boolean;
  data: Job[];
  pagination: {
    totalPages: number;
  };
}

interface JobActionResponse {
  success: boolean;
  error?: {
    message?: string;
  };
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const limit = 10;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category_id: '',
    job_type: 'full-time',
    salary_range: '',
    company_name: '',
    contact_email: '',
    whatsapp: '',
    apply_link: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchJobs();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  const fetchCategories = async () => {
    try {
      const data = await apiGet<CategoriesApiResponse>('/api/categories?status=active');
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        status: filterStatus,
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const data = await apiGet<JobsApiResponse>(`/api/jobs?${params}`);

      if (data.success) {
        setJobs(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const handleOpenModal = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        description: job.description,
        location: job.location || '',
        category_id: job.category_id?.toString() || '',
        job_type: job.job_type || 'full-time',
        salary_range: job.salary_range || '',
        company_name: job.company_name,
        contact_email: job.contact_email || '',
        whatsapp: job.whatsapp || '',
        apply_link: job.apply_link || '',
        priority: job.priority || 'normal',
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        location: '',
        category_id: '',
        job_type: 'full-time',
        salary_range: '',
        company_name: '',
        contact_email: '',
        whatsapp: '',
        apply_link: '',
        priority: 'normal',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingJob
        ? `/api/jobs/${editingJob.id}`
        : '/api/jobs';

      const body = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
      };

      const data = editingJob 
        ? await apiPut<JobActionResponse>(url, body)
        : await apiPost<JobActionResponse>(url, body);

      if (data.success) {
        await fetchJobs();
        handleCloseModal();
      } else {
        setError(data.error?.message || 'Failed to save job');
      }
    } catch (err) {
      console.error('Error saving job:', err);
      setError('Failed to save job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const data = await apiDelete<JobActionResponse>(`/api/jobs/${id}`);

      if (data.success) {
        await fetchJobs();
      } else {
        alert(data.error?.message || 'Failed to delete job');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const data = await apiPut<JobActionResponse>(`/api/jobs/${id}`, { status: newStatus });

      if (data.success) {
        await fetchJobs();
      } else {
        alert(data.error?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleCopyLinkedInPost = (job: Job) => {
    // Build LinkedIn-style post
    let post = `🎯 ${job.title}\n\n`;
    
    if (job.company_name) {
      post += `🏢 Company: ${job.company_name}\n`;
    }
    
    if (job.location) {
      post += `📍 Location: ${job.location}\n`;
    }
    
    if (job.job_type) {
      post += `💼 Type: ${job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}\n`;
    }
    
    if (job.salary_range) {
      post += `💰 Salary: ${job.salary_range}\n`;
    }
    
    if (job.category_name) {
      post += `🏷️ Category: ${job.category_name}\n`;
    }
    
    if (job.description) {
      post += `\n📋 Description:\n${job.description}\n`;
    }
    
    // Add application methods if available
    
    
   
    
    // Add website link
    post += `\n🔗 View Full Details: https://jobhunt.pk/jobs/${job.id}\n`;
    post += `\n#JobHunt #Hiring #Jobs #Career #JobOpportunity`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(post).then(() => {
      alert('✅ Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-56 p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Jobs Management</h1>
              <p className="text-text-secondary text-sm">Manage all job listings</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-dark text-background font-semibold px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Job
            </button>
          </div>

          {/* Filters */}
          <div className="bg-surface rounded-lg p-4 shadow-lg border border-accent mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary-dark text-background font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-sm"
                >
                  Search
                </button>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 border border-accent">
              <p className="text-text-secondary text-xs mb-1">Total Jobs</p>
              <p className="text-xl font-bold text-foreground">{jobs.length}</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-accent">
              <p className="text-text-secondary text-xs mb-1">Active</p>
              <p className="text-xl font-bold text-success">{jobs.filter(j => j.status === 'active').length}</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-accent">
              <p className="text-text-secondary text-xs mb-1">Pending</p>
              <p className="text-xl font-bold text-primary">{jobs.filter(j => j.status === 'pending').length}</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-accent">
              <p className="text-text-secondary text-xs mb-1">Closed</p>
              <p className="text-xl font-bold text-error">{jobs.filter(j => j.status === 'closed').length}</p>
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-text-secondary mt-4">Loading jobs...</p>
            </div>
          ) : (
            <>
              {/* Jobs Table */}
              <div className="bg-surface rounded-lg shadow-lg border border-accent overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-accent">
                      <tr>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Job Title</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Company</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Category</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Priority</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Location</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Type</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Status</th>
                        <th className="text-left text-foreground font-semibold px-4 py-3 text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-t border-accent hover:bg-accent/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-foreground font-medium text-sm">{job.title}</p>
                            <p className="text-text-secondary text-xs">{job.salary_range || 'Not specified'}</p>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-sm">{job.company_name}</td>
                          <td className="px-4 py-3">
                            {job.category_name ? (
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                {job.category_name}
                              </span>
                            ) : (
                              <span className="text-text-secondary text-xs">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                              job.priority === 'high' ? 'bg-error/10 text-error' :
                              job.priority === 'medium' ? 'bg-primary/10 text-primary' :
                              job.priority === 'low' ? 'bg-accent text-text-secondary' :
                              'bg-surface text-foreground border border-accent'
                            }`}>
                              {job.priority === 'high' ? '🔴 High' :
                               job.priority === 'medium' ? '🟡 Medium' :
                               job.priority === 'low' ? '⚫ Low' :
                               '⚪ Normal'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-sm">{job.location || 'Remote'}</td>
                          <td className="px-4 py-3">
                            <span className="text-text-secondary text-xs capitalize">{job.job_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={job.status}
                              onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                              className={`px-2 py-1 rounded-full text-[10px] font-medium border-0 cursor-pointer ${
                                job.status === 'active'
                                  ? 'bg-success/10 text-success'
                                  : job.status === 'pending'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-error/10 text-error'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleCopyLinkedInPost(job)}
                                className="text-primary hover:text-primary-dark transition-colors p-1"
                                title="Copy LinkedIn Post"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleOpenModal(job)}
                                className="text-foreground hover:text-primary transition-colors p-1"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDelete(job.id, job.title)}
                                className="text-error hover:text-error/80 transition-colors p-1"
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
              </div>

              {/* No Results */}
              {jobs.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-surface rounded-lg border border-accent">
                  <p className="text-text-secondary text-lg">No jobs found</p>
                  <p className="text-text-secondary text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-surface text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-primary text-background'
                              : 'bg-surface text-foreground hover:bg-accent'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-surface text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingJob ? 'Edit Job' : 'Add New Job'}
            </h2>

            {error && (
              <div className="mb-3 p-2 bg-error/10 border border-error rounded-lg text-error text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Senior Frontend Developer"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., TechCorp Inc."
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., San Francisco, CA or Remote"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Job Type
                  </label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., $120k - $160k"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="high">🔴 High (Top Priority)</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="normal">⚪ Normal (Default)</option>
                    <option value="low">⚫ Low</option>
                  </select>
                  <p className="text-text-secondary text-[10px] mt-1">High priority jobs appear at the top of listings</p>
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Apply Link (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.apply_link}
                    onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://company.com/apply"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-sm">
                    Job Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={5}
                    className="w-full bg-background text-foreground text-sm border border-accent rounded-lg px-3 py-2 focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Detailed job description, requirements, responsibilities..."
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-accent hover:bg-accent/80 text-foreground font-medium px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-dark text-background font-semibold px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Admin {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  google_connected?: boolean;
  blogger_enabled?: boolean;
  google_blog_id?: string;
  google_connected_at?: string;
}

interface AdminsApiResponse {
  success: boolean;
  data: Admin[];
}

interface AdminActionResponse {
  success: boolean;
  error?: {
    message?: string;
  };
}

export default function Admins() {
  const { admin: currentAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<{[key: number]: boolean}>({});

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && currentAdmin) {
      if (currentAdmin.role !== 'super_admin') {
        // Redirect regular admins to dashboard
        router.push('/');
      }
    }
  }, [currentAdmin, authLoading, router]);

  useEffect(() => {
    if (currentAdmin?.role === 'super_admin') {
      fetchAdmins();
    }
  }, [currentAdmin]);

  // Check for Google OAuth success/error in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleConnected = urlParams.get('google_connected');
    const googleError = urlParams.get('google_error');
    const blogName = urlParams.get('blog_name');
    
    if (googleConnected === 'true') {
      alert(`✅ Successfully connected to Google Blogger! Blog: ${blogName || 'Default'}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchAdmins(); // Refresh admin list
    } else if (googleError === 'true') {
      alert('❌ Failed to connect to Google. Please try again.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<AdminsApiResponse>('/api/admins');

      if (data.success) {
        setAdmins(data.data);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        username: admin.username,
        email: admin.email,
        password: '',
        role: admin.role,
      });
    } else {
      setEditingAdmin(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingAdmin
        ? `/api/admins/${editingAdmin.id}`
        : '/api/admins';

      // For edit, only send password if it's provided
      const body = editingAdmin && !formData.password
        ? { username: formData.username, email: formData.email, role: formData.role }
        : formData;

      const data = editingAdmin
        ? await apiPut<AdminActionResponse>(url, body)
        : await apiPost<AdminActionResponse>(url, body);

      if (data.success) {
        await fetchAdmins();
        handleCloseModal();
      } else {
        setError(data.error?.message || 'Failed to save admin');
      }
    } catch (err) {
      console.error('Error saving admin:', err);
      setError('Failed to save admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`Are you sure you want to delete admin "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const data = await apiDelete<AdminActionResponse>(`/api/admins/${id}`);

      if (data.success) {
        await fetchAdmins();
      } else {
        alert(data.error?.message || 'Failed to delete admin');
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
      alert('Failed to delete admin');
    }
  };

  const handleGoogleConnect = async (adminId: number) => {
    try {
      setIsConnectingGoogle(prev => ({ ...prev, [adminId]: true }));
      
      console.log('🔗 Initiating Google OAuth for admin:', adminId);
      const data = await apiGet<{success: boolean; data: {authUrl: string}}>(`/api/oauth/google/connect?admin_id=${adminId}`);
      
      console.log('📡 OAuth response:', data);
      
      if (data.success && data.data.authUrl) {
        console.log('✅ Redirecting to Google OAuth:', data.data.authUrl);
        // Redirect to Google OAuth
        window.location.href = data.data.authUrl;
      } else {
        console.error('❌ OAuth initiation failed:', data);
        alert('Failed to initiate Google OAuth');
      }
    } catch (err) {
      console.error('❌ Error connecting to Google:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to connect to Google: ${errorMessage}`);
    } finally {
      setIsConnectingGoogle(prev => ({ ...prev, [adminId]: false }));
    }
  };

  const handleGoogleDisconnect = async (adminId: number) => {
    if (!confirm('Are you sure you want to disconnect Google Blogger integration?')) {
      return;
    }

    try {
      const data = await apiPost<{success: boolean; message: string}>(`/api/oauth/google/disconnect/${adminId}`);
      
      if (data.success) {
        alert('Google account disconnected successfully');
        await fetchAdmins();
      } else {
        alert('Failed to disconnect Google account');
      }
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      alert('Failed to disconnect Google account');
    }
  };


  // Show loading while checking auth or fetching data
  if (authLoading || isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // If not super admin, show access denied
  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-error/10 rounded-full mb-6">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-text-secondary mb-6">You need Super Admin privileges to access this page.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-primary hover:bg-primary-dark text-background font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              Go to Dashboard
            </button>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Management</h1>
              <p className="text-text-secondary">Manage admin users</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-dark text-background font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Admin
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Total Admins</p>
              <p className="text-2xl font-bold text-foreground">{admins.length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Super Admins</p>
              <p className="text-2xl font-bold text-error">{admins.filter(a => a.role === 'super_admin').length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Regular Admins</p>
              <p className="text-2xl font-bold text-success">{admins.filter(a => a.role === 'admin').length}</p>
            </div>
          </div>

          {/* Admins Table */}
          <div className="bg-surface rounded-lg shadow-lg border border-accent overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent">
                  <tr>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Admin</th>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Email</th>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Role</th>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Google Blogger</th>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Created</th>
                    <th className="text-left text-foreground font-semibold px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => {
                    const createdDate = new Date(admin.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={admin.id} className="border-t border-accent hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-lg">
                                {admin.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{admin.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{admin.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              admin.role === 'super_admin'
                                ? 'bg-error/10 text-error'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {admin.google_connected ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                Connected
                              </span>
                              <button
                                onClick={() => handleGoogleDisconnect(admin.id)}
                                className="text-error hover:text-error/80 transition-colors p-1"
                                title="Disconnect Google"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGoogleConnect(admin.id)}
                              disabled={isConnectingGoogle[admin.id]}
                              className="bg-primary/10 hover:bg-primary/20 text-primary font-medium px-3 py-1 rounded-full text-xs transition-all duration-200 disabled:opacity-50 flex items-center gap-1"
                            >
                              {isConnectingGoogle[admin.id] ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                  </svg>
                                  Connect Google
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{createdDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenModal(admin)}
                              className="text-foreground hover:text-primary transition-colors p-2"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(admin.id, admin.username)}
                              className="text-error hover:text-error/80 transition-colors p-2"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {admins.length === 0 && (
            <div className="text-center py-12 bg-surface rounded-lg border border-accent mt-6">
              <p className="text-text-secondary">No admins found</p>
            </div>
          )}

          {/* Info Cards */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-lg p-6 border border-accent">
              <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Admin Roles
              </h3>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-error">•</span>
                  <span><strong className="text-foreground">Super Admin:</strong> Full access to all features including admin management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Admin:</strong> Access to manage jobs, categories, feedback, and contact messages</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-accent">
              <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Google Blogger Integration
              </h3>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-success">•</span>
                  <span><strong className="text-foreground">Auto-posting:</strong> New jobs are automatically posted to your Blogger blog</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">•</span>
                  <span><strong className="text-foreground">Rich formatting:</strong> Jobs are posted with professional HTML formatting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">•</span>
                  <span><strong className="text-foreground">SEO optimized:</strong> Posts include proper labels and metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">•</span>
                  <span><strong className="text-foreground">Branded:</strong> Posts include JobHunt.pk branding and links</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-foreground font-medium mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="admin_username"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  Password {editingAdmin ? '(leave empty to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingAdmin}
                  minLength={6}
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="Min 6 characters"
                />
                <p className="text-text-secondary text-xs mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-accent hover:bg-accent/80 text-foreground font-medium px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-dark text-background font-semibold px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


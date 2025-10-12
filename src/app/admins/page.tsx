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

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/admins');

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

      const method = editingAdmin ? 'PUT' : 'POST';

      // For edit, only send password if it's provided
      const body = editingAdmin && !formData.password
        ? { username: formData.username, email: formData.email, role: formData.role }
        : formData;

      const data = editingAdmin
        ? await apiPut(url, body)
        : await apiPost(url, body);

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
      const data = await apiDelete(`/api/admins/${id}`);

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

          {/* Info Card */}
          <div className="mt-8 bg-surface rounded-lg p-6 border border-accent">
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


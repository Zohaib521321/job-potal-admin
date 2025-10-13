'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  job_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CategoriesApiResponse {
  success: boolean;
  data: Category[];
}

interface CategoryActionResponse {
  success: boolean;
  error?: {
    message?: string;
  };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '🏷️' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<CategoriesApiResponse>('/api/categories');
      
      if (data.success) {
        setCategories(data.data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '🏷️',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '🏷️' });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '🏷️' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';

      const data = editingCategory
        ? await apiPut<CategoryActionResponse>(url, formData)
        : await apiPost<CategoryActionResponse>(url, formData);

      if (data.success) {
        await fetchCategories();
        handleCloseModal();
      } else {
        setError(data.error?.message || 'Failed to save category');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      setError('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const data = await apiDelete<CategoryActionResponse>(`/api/categories/${id}`);

      if (data.success) {
        await fetchCategories();
      } else {
        alert(data.error?.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading categories...</p>
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Categories Management</h1>
              <p className="text-text-secondary">Manage job categories</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary hover:bg-primary-dark text-background font-semibold px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Category
            </button>
          </div>

          {/* Search */}
          <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent mb-6">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Total Categories</p>
              <p className="text-2xl font-bold text-foreground">{categories.length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Active</p>
              <p className="text-2xl font-bold text-success">{categories.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-accent">
              <p className="text-text-secondary text-sm mb-1">Total Jobs</p>
              <p className="text-2xl font-bold text-primary">{categories.reduce((sum, c) => sum + c.job_count, 0)}</p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-surface rounded-lg p-6 shadow-lg border border-accent hover:border-primary transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-3xl">
                    {category.icon}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      category.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {category.status}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">{category.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">
                      <span className="font-semibold text-foreground">{category.job_count}</span> jobs
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-accent">
                  <button 
                    onClick={() => handleOpenModal(category)}
                    className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary font-medium px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(category.id, category.name)}
                    className="bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-surface rounded-lg">
              <p className="text-text-secondary">No categories found</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-foreground font-medium mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g., Frontend Development"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Brief description of the category"
                />
              </div>

              <div>
                <label className="block text-foreground font-medium mb-2">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  placeholder="🏷️"
                  maxLength={2}
                />
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
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

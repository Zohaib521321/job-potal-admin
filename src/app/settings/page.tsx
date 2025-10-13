'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings as useSettingsContext } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';

import { apiGet, apiPut } from '@/lib/api';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  description: string;
}

interface SettingsApiResponse {
  success: boolean;
  data: Setting[];
}

interface SettingsUpdateResponse {
  success: boolean;
  error?: {
    message?: string;
  };
}

export default function Settings() {
  const { admin: currentAdmin, isLoading: authLoading } = useAuth();
  const { refreshSettings } = useSettingsContext();
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!authLoading && currentAdmin) {
      if (currentAdmin.role !== 'super_admin') {
        router.push('/');
      } else {
        fetchSettings();
      }
    }
  }, [currentAdmin, authLoading, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<SettingsApiResponse>('/api/settings/detailed');

      if (data.success) {
        setSettings(data.data);
        
        // Initialize form data
        const initialData: Record<string, string> = {};
        data.data.forEach((setting: Setting) => {
          initialData[setting.setting_key] = setting.setting_value || '';
        });
        setFormData(initialData);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setErrorMessage('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const data = await apiPut<SettingsUpdateResponse>('/api/settings', { settings: formData });

      if (data.success) {
        setSuccessMessage('Settings saved successfully!');
        // Refresh settings context to apply changes immediately
        await refreshSettings();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error?.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

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
            <p className="text-text-secondary mb-6">You need Super Admin privileges to access settings.</p>
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

  const tabs = [
    { id: 'general', label: 'General', icon: '🌐' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'social', label: 'Social Media', icon: '🔗' },
    { id: 'seo', label: 'SEO & Meta', icon: '🔍' },
  ];

  const getSettingsByCategory = (category: string) => {
    const categoryMap: Record<string, string[]> = {
      general: ['site_name', 'site_tagline', 'site_description', 'logo_url', 'logo_dark_url', 'favicon_url'],
      contact: ['contact_email', 'contact_phone', 'contact_address', 'support_email'],
      social: ['social_facebook', 'social_twitter', 'social_linkedin', 'social_instagram'],
      seo: ['meta_keywords', 'google_analytics_id', 'jobs_per_page', 'admin_jobs_per_page'],
    };

    return settings.filter(s => categoryMap[category]?.includes(s.setting_key));
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Website Settings</h1>
          <p className="text-text-secondary">Manage your website configuration and appearance</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg text-success">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg text-error">
            {errorMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-surface rounded-lg p-2 shadow-lg border border-accent mb-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-background'
                  : 'text-text-secondary hover:text-foreground hover:bg-accent'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="bg-surface rounded-lg p-8 shadow-lg border border-accent">
          <div className="space-y-6">
            {getSettingsByCategory(activeTab).map((setting) => (
              <div key={setting.setting_key}>
                <label className="block text-foreground font-medium mb-2 capitalize">
                  {setting.setting_key.replace(/_/g, ' ')}
                </label>
                {setting.description && (
                  <p className="text-text-secondary text-sm mb-2">{setting.description}</p>
                )}
                
                {setting.setting_type === 'color' ? (
                  <div className="flex gap-4">
                    <input
                      type="color"
                      value={formData[setting.setting_key] || getComputedStyle(document.documentElement).getPropertyValue('--background').trim()}
                      onChange={(e) => setFormData({ ...formData, [setting.setting_key]: e.target.value })}
                      className="w-20 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData[setting.setting_key] || ''}
                      onChange={(e) => setFormData({ ...formData, [setting.setting_key]: e.target.value })}
                      className="flex-1 bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter color (e.g., #FCD535)"
                    />
                  </div>
                ) : setting.setting_key.includes('description') ? (
                  <textarea
                    value={formData[setting.setting_key] || ''}
                    onChange={(e) => setFormData({ ...formData, [setting.setting_key]: e.target.value })}
                    className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    rows={4}
                    placeholder={setting.description}
                  />
                ) : (
                  <input
                    type={setting.setting_type === 'email' ? 'email' : setting.setting_type === 'number' ? 'number' : 'text'}
                    value={formData[setting.setting_key] || ''}
                    onChange={(e) => setFormData({ ...formData, [setting.setting_key]: e.target.value })}
                    className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder={setting.description}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-accent">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary-dark text-background font-semibold px-8 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-accent rounded-lg p-6 border border-primary/20">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-primary mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-foreground font-semibold mb-2">Super Admin Settings</h3>
              <p className="text-text-secondary text-sm">
                These settings affect both the admin panel and user-facing website. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


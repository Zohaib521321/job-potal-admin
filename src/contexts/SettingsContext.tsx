'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiGet } from '@/lib/api';

interface Settings {
  site_name?: string;
  site_tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  support_email?: string;
  color_primary?: string;
  color_primary_dark?: string;
  color_background?: string;
  color_surface?: string;
  color_accent?: string;
  color_text_primary?: string;
  color_text_secondary?: string;
  color_success?: string;
  color_error?: string;
  [key: string]: string | undefined;
}

interface SettingsApiResponse {
  success: boolean;
  data: Settings;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isLoading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiGet<SettingsApiResponse>('/api/settings');

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}


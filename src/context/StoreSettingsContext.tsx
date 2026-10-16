import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { dataService } from '../lib/firebase';
import { INITIAL_STORE_SETTINGS } from '../lib/mockData';

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = dataService.subscribeSettings((fresh) => {
      setSettings(fresh);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = await dataService.updateSettings(newSettings);
    setSettings(updated);
  };

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const fresh = await dataService.getSettings();
      setSettings(fresh);
    } catch (err) {
      console.error('Error refreshing settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = (): StoreSettingsContextType => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

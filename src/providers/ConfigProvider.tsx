
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SANDALS_BRAND, ORACLE_AVATAR, DEFAULT_HERO_IMAGES } from '../constants';
import { fetchPlatformConfig } from '../services/supabaseService';

interface ConfigContextType {
  appLogo: string | null;
  oracleAvatar: string;
  heroImages: string[];
  heroVideos: any[];
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appLogo, setAppLogo] = useState<string | null>(SANDALS_BRAND.logo);
  const [oracleAvatar, setOracleAvatar] = useState<string>(ORACLE_AVATAR);
  const [heroImages, setHeroImages] = useState<string[]>(DEFAULT_HERO_IMAGES);
  const [heroVideos, setHeroVideos] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState({});

  const refreshConfig = useCallback(async () => {
    try {
      const config = await fetchPlatformConfig();
      if (config) {
        setAppLogo(config.app_logo || SANDALS_BRAND.logo);
        setOracleAvatar(config.oracle_avatar || ORACLE_AVATAR);
        setHeroImages(config.hero_images || DEFAULT_HERO_IMAGES);
        setHeroVideos(config.hero_videos || []);
        setSocialLinks({
          facebook: config.facebook_url,
          instagram: config.instagram_url,
          twitter: config.twitter_url,
          tiktok: config.tiktok_url
        });
      }
    } catch (e) {
      console.error("Config fetch error:", e);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  return (
    <ConfigContext.Provider value={{ appLogo, oracleAvatar, heroImages, heroVideos, socialLinks, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};

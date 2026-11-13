import { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeMode, ThemeScheduleConfig } from '../types';

const STORAGE_KEY = 'omniflow_theme_config_v1';

const DEFAULT_CONFIG: ThemeScheduleConfig = {
  mode: 'schedule',
  sunriseTime: '06:30',
  sunsetTime: '18:30',
  useGeolocation: false,
  autoDimming: true,
};

export function useAutoTheme() {
  const [config, setConfig] = useState<ThemeScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      // ignore JSON parse error
    }
    return DEFAULT_CONFIG;
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Save to localStorage when config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  }, [config]);

  // Keep OS color scheme in sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Timer to update time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Optional Geolocation solar estimation
  useEffect(() => {
    if (config.useGeolocation && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // Approximate sunrise/sunset calculation based on day of year & latitude
          const now = new Date();
          const start = new Date(now.getFullYear(), 0, 0);
          const diff = now.getTime() - start.getTime();
          const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

          // Solar declination approx
          const declination = 23.45 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI);
          const latRad = (lat * Math.PI) / 180;
          const decRad = (declination * Math.PI) / 180;
          const hourAngle = Math.acos(
            Math.max(-1, Math.min(1, -Math.tan(latRad) * Math.tan(decRad)))
          );
          const solarNoonMinutes = 12 * 60 - lon * 4; // approx noon in local solar time
          const halfDayMinutes = (hourAngle * 180) / Math.PI * 4;

          const sunriseMin = Math.round(solarNoonMinutes - halfDayMinutes);
          const sunsetMin = Math.round(solarNoonMinutes + halfDayMinutes);

          const formatHourMin = (totalMin: number) => {
            const normalized = ((totalMin % 1440) + 1440) % 1440;
            const h = Math.floor(normalized / 60);
            const m = normalized % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          };

          setConfig((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            sunriseTime: formatHourMin(sunriseMin),
            sunsetTime: formatHourMin(sunsetMin),
          }));
        },
        (err) => {
          console.warn('Geolocation access failed for solar calculation:', err.message);
        },
        { timeout: 8000 }
      );
    }
  }, [config.useGeolocation]);

  // Compute effective dark mode
  const { isDark, schedulePhase, nextTransitionText } = useMemo(() => {
    if (config.mode === 'dark') {
      return { isDark: true, schedulePhase: 'manual-dark', nextTransitionText: 'Manual Dark Mode' };
    }
    if (config.mode === 'light') {
      return { isDark: false, schedulePhase: 'manual-light', nextTransitionText: 'Manual Light Mode' };
    }
    if (config.mode === 'system') {
      return {
        isDark: systemIsDark,
        schedulePhase: 'system',
        nextTransitionText: `Synced with OS (${systemIsDark ? 'Dark' : 'Light'})`,
      };
    }

    // Schedule mode calculation
    const [riseH, riseM] = config.sunriseTime.split(':').map(Number);
    const [setH, setM] = config.sunsetTime.split(':').map(Number);
    const sunriseMin = (riseH || 6) * 60 + (riseM || 30);
    const sunsetMin = (setH || 18) * 60 + (setM || 30);

    const isDay = currentTimeMinutes >= sunriseMin && currentTimeMinutes < sunsetMin;
    const computedDark = !isDay;

    // Calculate time until next transition
    let minutesUntil: number;
    let nextPhaseName: string;

    if (isDay) {
      minutesUntil = sunsetMin - currentTimeMinutes;
      nextPhaseName = 'Sunset (Dark)';
    } else {
      if (currentTimeMinutes >= sunsetMin) {
        minutesUntil = 1440 - currentTimeMinutes + sunriseMin;
      } else {
        minutesUntil = sunriseMin - currentTimeMinutes;
      }
      nextPhaseName = 'Sunrise (Light)';
    }

    const hours = Math.floor(minutesUntil / 60);
    const mins = minutesUntil % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      isDark: computedDark,
      schedulePhase: isDay ? 'day' : 'night',
      nextTransitionText: `${nextPhaseName} in ${timeStr}`,
    };
  }, [config.mode, config.sunriseTime, config.sunsetTime, currentTimeMinutes, systemIsDark]);

  // Sync to <html> element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const updateConfig = useCallback((partial: Partial<ThemeScheduleConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const toggleQuick = useCallback(() => {
    // Quick toggle switches between explicit dark/light if manual, or toggles mode
    setConfig((prev) => {
      if (prev.mode === 'schedule') {
        // Toggle to manual inverse of current schedule state
        return { ...prev, mode: isDark ? 'light' : 'dark' };
      }
      if (prev.mode === 'dark') return { ...prev, mode: 'light' };
      if (prev.mode === 'light') return { ...prev, mode: 'schedule' };
      return { ...prev, mode: 'dark' };
    });
  }, [isDark]);

  return {
    config,
    isDark,
    schedulePhase,
    nextTransitionText,
    updateConfig,
    setMode,
    toggleQuick,
  };
}

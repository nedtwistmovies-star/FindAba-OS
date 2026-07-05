import { useState, useEffect } from 'react';

export interface BatteryStatus {
  level: number; // 0 to 1
  charging: boolean;
  supported: boolean;
}

export const useBattery = (): BatteryStatus => {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 1,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    let activeBattery: any = null;

    const updateBatteryInfo = () => {
      if (activeBattery) {
        setBattery({
          level: activeBattery.level,
          charging: activeBattery.charging,
          supported: true,
        });
      }
    };

    // Defensive check as getBattery() is not supported on all devices/browsers (like iOS Safari)
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((batt: any) => {
          activeBattery = batt;
          updateBatteryInfo();

          batt.addEventListener('levelchange', updateBatteryInfo);
          batt.addEventListener('chargingchange', updateBatteryInfo);
        }).catch((err: any) => {
          console.warn('[Battery Hook] API call failed:', err);
        });
      } catch (err) {
        console.warn('[Battery Hook] API not available:', err);
      }
    }

    return () => {
      if (activeBattery) {
        try {
          activeBattery.removeEventListener('levelchange', updateBatteryInfo);
          activeBattery.removeEventListener('chargingchange', updateBatteryInfo);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  return battery;
};

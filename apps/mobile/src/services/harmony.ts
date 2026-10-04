declare global {
  interface Window {
    HarmonyBridge?: {
      vibrate?: (durationMs?: number) => void;
      isHarmonyOS?: () => boolean;
      getDeviceInfo?: () => string;
      getHeading?: () => number;
      getSystemHealth?: () => string;
      getColorMode?: () => string;
      getFontSizeScale?: () => number;
      getNativeLocation?: () => string;
    };
  }
}

export interface HarmonySystemHealth {
  batterySoc: number;
  isOnline: boolean;
  isLowPower: boolean;
}

export interface HarmonyAccessibility {
  colorMode: 'dark' | 'light';
  fontSizeScale: number;
}

export interface HarmonyNativeLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

/**
 * Checks if the runtime environment is an OpenHarmony / HarmonyOS native container.
 */
export function isHarmonyOS(): boolean {
  if (typeof window !== 'undefined' && window.HarmonyBridge?.isHarmonyOS) {
    try {
      return Boolean(window.HarmonyBridge.isHarmonyOS());
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Returns current compass/orientation heading in degrees (0-360) from OpenHarmony SensorServiceKit.
 */
export function getHarmonyHeading(): number | null {
  if (typeof window !== 'undefined' && window.HarmonyBridge?.getHeading) {
    try {
      const heading = window.HarmonyBridge.getHeading();
      if (typeof heading === 'number' && !isNaN(heading)) {
        return Math.round(heading);
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Subscribes to periodic heading updates from the native orientation sensor.
 */
export function subscribeHarmonyHeading(onUpdate: (heading: number) => void, intervalMs: number = 300): () => void {
  if (!isHarmonyOS()) {
    return () => {};
  }
  let lastHeading = -1;
  const timer = setInterval(() => {
    const h = getHarmonyHeading();
    if (h !== null && h !== lastHeading) {
      lastHeading = h;
      onUpdate(h);
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}

/**
 * Returns battery and connectivity state from OpenHarmony BasicServicesKit & NetworkKit.
 */
export function getHarmonySystemHealth(): HarmonySystemHealth | null {
  if (typeof window !== 'undefined' && window.HarmonyBridge?.getSystemHealth) {
    try {
      const raw = window.HarmonyBridge.getSystemHealth();
      if (raw) {
        return JSON.parse(raw) as HarmonySystemHealth;
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Returns system-level accessibility settings (color mode and font scale) from ArkUI Configuration.
 */
export function getHarmonyAccessibility(): HarmonyAccessibility | null {
  if (!isHarmonyOS()) {
    return null;
  }
  try {
    const colorMode = window.HarmonyBridge?.getColorMode ? window.HarmonyBridge.getColorMode() : 'light';
    const fontSizeScale = window.HarmonyBridge?.getFontSizeScale ? window.HarmonyBridge.getFontSizeScale() : 1.0;
    return {
      colorMode: colorMode === 'dark' ? 'dark' : 'light',
      fontSizeScale: typeof fontSizeScale === 'number' && fontSizeScale > 0 ? fontSizeScale : 1.0,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the last known GNSS position from OpenHarmony LocationKit (geoLocationManager).
 */
export function getHarmonyNativeLocation(): HarmonyNativeLocation | null {
  if (typeof window !== 'undefined' && window.HarmonyBridge?.getNativeLocation) {
    try {
      const raw = window.HarmonyBridge.getNativeLocation();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
          return {
            lat: parsed.lat,
            lon: parsed.lon,
            accuracy: parsed.accuracy || 0,
          };
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

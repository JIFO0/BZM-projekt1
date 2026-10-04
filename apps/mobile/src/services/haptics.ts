import { Platform } from 'react-native';

declare global {
  interface Window {
    HarmonyBridge?: {
      vibrate?: (durationMs?: number) => void;
      isHarmonyOS?: () => boolean;
      getDeviceInfo?: () => string;
    };
  }
}

export type HapticAction = 'route' | 'report' | 'location' | 'default';

/**
 * Checks whether the application is currently running inside the native HarmonyOS / OpenHarmony container.
 */
export function isHarmonyOSPlatform(): boolean {
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
 * Retrieves the device brand and model string if running under HarmonyOS.
 */
export function getHarmonyDeviceInfo(): string | null {
  if (typeof window !== 'undefined' && window.HarmonyBridge?.getDeviceInfo) {
    try {
      return window.HarmonyBridge.getDeviceInfo();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Triggers subtle, gentle haptic feedback customized for accessibility:
 * - 'location': Brief 30ms tap when user centers on their GPS coordinates.
 * - 'route': 45ms confirmation pulse when an accessible route is calculated.
 * - 'report': 50ms tactile feedback when a barrier report or OSM correction is submitted.
 *
 * Automatically delegates to native OpenHarmony SensorServiceKit (vibrator) when running
 * in HarmonyOS, falls back to standard navigator.vibrate in mobile browsers, or degrades silently.
 */
export function triggerGentleHaptic(action: HapticAction = 'default'): void {
  let duration = 35; // default gentle tap (ms)

  switch (action) {
    case 'location':
      duration = 30; // crisp, very subtle tap
      break;
    case 'route':
      duration = 45; // distinctive single confirmation pulse
      break;
    case 'report':
      duration = 55; // reassuring tactile confirmation
      break;
    default:
      duration = 35;
      break;
  }

  // 1. Native HarmonyOS ArkTS Bridge via ArkWeb
  if (typeof window !== 'undefined' && window.HarmonyBridge?.vibrate) {
    try {
      window.HarmonyBridge.vibrate(duration);
      return;
    } catch (e) {
      console.warn('[Haptics] HarmonyBridge vibration failed:', e);
    }
  }

  // 2. Standard Web Vibration API (mobile web / PWA fallback)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignored if user has not interacted or browser restricts background vibration
    }
  }
}

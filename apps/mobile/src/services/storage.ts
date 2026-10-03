import { Platform } from 'react-native';

/**
 * Universal cookie / persistence helper that works across:
 * - Web (reads/writes document.cookie with fallback to window.localStorage)
 * - Native iOS/Android/Mock (in-memory persistent fallback if no native cookies)
 */

const inMemoryStore = new Map<string, string>();

export function getCookie(name: string): string | null {
  const encodedName = encodeURIComponent(name);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // 1. Try document.cookie
    try {
      const cookies = document.cookie ? document.cookie.split('; ') : [];
      for (const cookie of cookies) {
        const [k, ...v] = cookie.split('=');
        if (k === encodedName) {
          return decodeURIComponent(v.join('='));
        }
      }
    } catch {
      // Ignore document.cookie reading restrictions
    }

    // 2. Fallback to localStorage if cookie is blocked or in special contexts
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(`cookie_${name}`);
        if (val !== null) return val;
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }

  // Native or in-memory fallback
  return inMemoryStore.get(name) ?? null;
}

export function setCookie(name: string, value: string, days = 365): void {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // 1. Save to document.cookie
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${encodedName}=${encodedValue}; expires=${expires}; path=/; SameSite=Lax`;
    } catch {
      // Ignore cookie write failure
    }

    // 2. Sync to localStorage for robust cross-session persistence on web
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`cookie_${name}`, value);
      }
    } catch {
      // Ignore localStorage write failure
    }
  }

  // Native or in-memory fallback
  inMemoryStore.set(name, value);
}

export function removeCookie(name: string): void {
  setCookie(name, '', -1);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(`cookie_${name}`);
    } catch {
      // Ignore
    }
  }
  inMemoryStore.delete(name);
}

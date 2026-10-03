import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface UserCoordinates {
  lat: number;
  lon: number;
}

export interface UserLocationResult extends UserCoordinates {
  address?: string;
}

/**
 * Checks or requests foreground location permission across native and web platforms.
 */
export async function checkOrRequestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      return true;
    }
    const req = await Location.requestForegroundPermissionsAsync();
    return req.status === 'granted';
  } catch (err) {
    // Web fallback if navigator.permissions is not fully supported
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      return true;
    }
    console.warn('[LocationService] Permission check error:', err);
    return false;
  }
}

/**
 * Tries reverse geocoding to human-readable street/district, falls back gracefully.
 */
async function tryReverseGeocode(lat: number, lon: number): Promise<string> {
  let address = 'Moja lokalizacja';
  if (Platform.OS === 'web') {
    return address;
  }
  try {
    const reversed = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });

    if (reversed && reversed.length > 0) {
      const place = reversed[0];
      const streetPart = [place.street, place.streetNumber].filter(Boolean).join(' ');
      if (streetPart) {
        address = `Moja lokalizacja (${streetPart})`;
      } else if (place.name) {
        address = `Moja lokalizacja (${place.name})`;
      } else if (place.district || place.city) {
        address = `Moja lokalizacja (${place.district || place.city})`;
      }
    }
  } catch {
    // Non-fatal
  }
  return address;
}

/**
 * Requests location permissions and fetches current device location.
 * Uses fast cached position if available, then fresh GPS fix with timeout.
 */
export async function getCurrentUserLocation(): Promise<UserLocationResult | null> {
  const granted = await checkOrRequestLocationPermission();
  if (!granted) {
    return null;
  }

  // 1. Web navigator.geolocation direct fallback for reliability
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
        });
      });
      return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        address: 'Moja lokalizacja',
      };
    } catch (webErr) {
      console.warn('[LocationService] Web geolocation error:', webErr);
    }
  }

  // 2. Native / Expo Location
  try {
    // Try fresh GPS fix with 8s timeout to prevent hanging
    const positionPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GPS timeout')), 8000),
    );

    let location: Location.LocationObject;
    try {
      location = await Promise.race([positionPromise, timeoutPromise]);
    } catch {
      // Fallback to last known position if fresh fix timed out
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (!lastKnown) {
        throw new Error('No GPS fix available');
      }
      location = lastKnown;
    }

    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    const address = await tryReverseGeocode(lat, lon);

    return {
      lat,
      lon,
      address,
    };
  } catch (error) {
    console.warn('[LocationService] Failed to obtain location:', error);
    return null;
  }
}

/**
 * Subscribes to live GPS updates as the user moves.
 * Calls onUpdate whenever new coordinates arrive.
 * Returns an unsubscribe cleanup function.
 */
export async function watchUserLocation(
  onUpdate: (location: UserLocationResult) => void,
): Promise<(() => void) | null> {
  const granted = await checkOrRequestLocationPermission();
  if (!granted) {
    return null;
  }

  // Web live watch
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          onUpdate({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            address: 'Moja lokalizacja',
          });
        },
        (err) => {
          console.warn('[LocationService] Web watch position error:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        },
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } catch (err) {
      console.warn('[LocationService] Failed to start web watcher:', err);
      return null;
    }
  }

  // Native live watch
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2500, // every 2.5s
        distanceInterval: 3, // or every 3 metres
      },
      (loc) => {
        onUpdate({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
      },
    );

    return () => {
      subscription.remove();
    };
  } catch (err) {
    console.warn('[LocationService] watchPositionAsync failed:', err);
    return null;
  }
}

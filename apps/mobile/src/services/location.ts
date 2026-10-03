import * as Location from 'expo-location';

export interface UserCoordinates {
  lat: number;
  lon: number;
}

export interface UserLocationResult extends UserCoordinates {
  address?: string;
}

/**
 * Requests location permissions and fetches current device location.
 * Gracefully returns null if permissions are denied or GPS is unavailable.
 */
export async function getCurrentUserLocation(): Promise<UserLocationResult | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    let address = 'Moja lokalizacja';

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
      // Reverse geocoding failure is non-fatal
    }

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

import { DEMO_SNAPSHOT } from '@krakow-bez-barier/core';
import type { PlaceInfo } from './types';

export class PlacesRegistry {
  private places = new Map<string, PlaceInfo>();
  private aliases = new Map<string, string>();

  constructor() {
    this.seedDefaultPlaces();
  }

  private seedDefaultPlaces(): void {
    // Seed from DEMO_SNAPSHOT.places
    for (const p of DEMO_SNAPSHOT.places) {
      const info: PlaceInfo = {
        id: p.id,
        name: p.name,
        position: {
          lat: p.position.lat,
          lon: p.position.lon,
        },
      };
      this.registerPlace(info);

      // Add convenient short aliases, e.g. "place-sukiennice", "sukiennice"
      const shortId = p.id.replace(/^sample-place-/, '');
      this.aliases.set(`place-${shortId}`, p.id);
      this.aliases.set(shortId, p.id);
    }

    // Seed canonical Krakow landmarks if not already present
    if (!this.getPlace('place-sukiennice')) {
      this.registerPlace({
        id: 'place-sukiennice',
        name: 'Sukiennice',
        position: { lat: 50.0619, lon: 19.9373 },
      });
    }
  }

  public registerPlace(place: PlaceInfo): void {
    this.places.set(place.id, place);
  }

  public registerAlias(alias: string, targetPlaceId: string): void {
    this.aliases.set(alias, targetPlaceId);
  }

  public getPlace(placeId: string): PlaceInfo | null {
    if (this.places.has(placeId)) {
      return this.places.get(placeId)!;
    }
    const targetId = this.aliases.get(placeId);
    if (targetId && this.places.has(targetId)) {
      return this.places.get(targetId)!;
    }
    return null;
  }

  public hasPlace(placeId: string): boolean {
    return this.getPlace(placeId) !== null;
  }
}

export const defaultPlacesRegistry = new PlacesRegistry();

import type { Fact, LonLat } from './types';
import { haversineDistanceMetres } from './geometry';

export type PlaceCategory = 'entrance' | 'inside' | 'toilet' | 'surroundings';

export interface CategorizedPlaceFact {
  category: PlaceCategory;
  fact: Fact;
  displayCategory: string;
}

export interface PlaceAnalysisReport {
  placeName: string;
  position: LonLat;
  matchConfidence: number;
  isConfidentMatch: boolean;
  factsByCategory: Record<PlaceCategory, Fact[]>;
  allFacts: Fact[];
  summaryMessage: string;
  isSample: boolean;
}

/**
 * Categorize a fact into one of the 4 standard challenge categories:
 * - Entrance (Wejście): wheelchair ramp, doors, steps at entrance, buzzer
 * - Inside (Wnętrze): elevator, doors width, rooms, circulation
 * - Toilet (Toaleta): toilets:wheelchair, accessible toilet
 * - Surroundings (Otoczenie): parking, pathway, tactile paving
 */
export function categorizeFact(fact: Fact): PlaceCategory {
  const crit = fact.criterion.toLowerCase();
  const val = fact.value.toLowerCase();

  if (
    crit.includes('toilet') ||
    val.includes('toaleta') ||
    crit.includes('wc') ||
    crit === 'toilets:wheelchair'
  ) {
    return 'toilet';
  }

  if (
    crit.includes('entrance') ||
    crit.includes('door') ||
    crit.includes('step') ||
    crit.includes('ramp') ||
    crit.includes('drzwi') ||
    crit.includes('wejscie') ||
    crit.includes('wejście')
  ) {
    return 'entrance';
  }

  if (
    crit.includes('parking') ||
    crit.includes('kerb') ||
    crit.includes('crossing') ||
    crit.includes('sidewalk') ||
    crit.includes('otoczenie') ||
    crit.includes('pavement')
  ) {
    return 'surroundings';
  }

  return 'inside';
}

export function computePlaceMatchConfidence(
  targetPos: LonLat,
  foundPos: LonLat,
  maxDistanceMetres: number,
  nameSimilarity = 1.0,
): number {
  const distance = haversineDistanceMetres(targetPos, foundPos);
  if (distance > maxDistanceMetres) return 0;

  // Linear decay with distance, weighted by name similarity
  const distanceScore = Math.max(0, 1 - distance / maxDistanceMetres);
  const confidence = distanceScore * 0.6 + nameSimilarity * 0.4;
  return Math.round(confidence * 100) / 100;
}

export function analyzePlace(
  placeName: string,
  targetPosition: LonLat,
  matchedFacts: Fact[],
  maxDistanceMetres = 40,
  isSample = false,
): PlaceAnalysisReport {
  // Check match confidence
  let matchConfidence = 0;
  if (matchedFacts.length > 0) {
    const firstFact = matchedFacts[0]!;
    matchConfidence = computePlaceMatchConfidence(
      targetPosition,
      { lat: firstFact.subject.lat, lon: firstFact.subject.lon },
      maxDistanceMetres,
    );
  }

  const isConfidentMatch = matchConfidence >= 0.5 && matchedFacts.length > 0;

  const factsByCategory: Record<PlaceCategory, Fact[]> = {
    entrance: [],
    inside: [],
    toilet: [],
    surroundings: [],
  };

  for (const fact of matchedFacts) {
    const cat = categorizeFact(fact);
    factsByCategory[cat].push(fact);
  }

  const summaryMessage = isConfidentMatch
    ? `Dopasowano obiekt OSM z pewnością ${Math.round(matchConfidence * 100)}%`
    : 'Brak danych o dostępności tego miejsca w OpenStreetMap';

  return {
    placeName,
    position: targetPosition,
    matchConfidence,
    isConfidentMatch,
    factsByCategory,
    allFacts: matchedFacts,
    summaryMessage,
    isSample,
  };
}

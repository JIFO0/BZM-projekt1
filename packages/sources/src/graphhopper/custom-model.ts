import type { BarrierThresholds } from '@krakow-bez-barier/core';
import type {
  GraphHopperCustomModel,
  GraphHopperCustomModelStatement,
  RoutingWeightMode,
} from './types';

/**
 * Carriageway classes. Parallel `highway=footway` / `footway=sidewalk`
 * keeps the default priority (1), so a sidewalk of similar length wins
 * over the street centreline. Roads stay usable where no sidewalk is mapped.
 */
const CARRIAGEWAY_PRIORITY: GraphHopperCustomModelStatement = {
  if: [
    'road_class == MOTORWAY',
    'road_class == TRUNK',
    'road_class == PRIMARY',
    'road_class == SECONDARY',
    'road_class == TERTIARY',
    'road_class == RESIDENTIAL',
    'road_class == UNCLASSIFIED',
  ].join(' || '),
  multiply_by: '0.35',
};

/**
 * Standard Surface enum values known by GraphHopper core engine.
 */
export const GRAPHHOPPER_SURFACE_ENUMS: Record<string, string> = {
  asphalt: 'ASPHALT',
  concrete: 'CONCRETE',
  paving_stones: 'PAVING_STONES',
  compacted: 'COMPACTED',
  fine_gravel: 'FINE_GRAVEL',
  gravel: 'GRAVEL',
  ground: 'GROUND',
  dirt: 'DIRT',
  grass: 'GRASS',
  sand: 'SAND',
  wood: 'WOOD',
  cobblestone: 'COBBLESTONE',
  unpaved: 'UNPAVED',
};

/**
 * Builds a dynamic Custom Model for GraphHopper based on mobility thresholds.
 *
 * Implements "Forgiving Routing":
 * - Null/unmapped data in OSM is treated as passable and not penalized.
 * - Only explicit, mapped obstacles (steps, narrow paths, unsuitable surfaces) are penalized.
 */
export function buildCustomModel(
  thresholds: BarrierThresholds,
  options?: { includeSlope?: boolean; mode?: RoutingWeightMode },
): GraphHopperCustomModel {
  const mode = options?.mode ?? 'strict';
  const priority: GraphHopperCustomModelStatement[] = [CARRIAGEWAY_PRIORITY];

  if (mode === 'practical') {
    return { priority };
  }

  // 1. Handling Steps
  const blockedRoads = new Set(
    (thresholds.blockedRoadTypes ?? thresholds.blockedSurfaces ?? []).map((s) => s.toLowerCase().trim()),
  );

  if (thresholds.stepsAreBlocker || blockedRoads.has('steps')) {
    priority.push({
      if: 'road_class == STEPS',
      multiply_by: '0.0',
    });
  } else {
    // For profiles like stroller where steps are a warning/inconvenience rather than complete blocker
    priority.push({
      if: 'road_class == STEPS',
      multiply_by: '0.2',
    });
  }

  // 2. Minimum Width (max_width tag in OSM)
  if (thresholds.minWidthMetres > 0) {
    priority.push({
      if: `max_width < ${thresholds.minWidthMetres}`,
      multiply_by: '0.0',
    });
  }

  // 3. Surface restrictions
  // Check which known GraphHopper surfaces are blocked or disallowed for this mobility profile
  const normalizedAllowed = new Set(thresholds.allowedSurfaces.map((s) => s.toLowerCase().trim()));

  for (const [osmKey, ghEnum] of Object.entries(GRAPHHOPPER_SURFACE_ENUMS)) {
    if (blockedRoads.has(osmKey)) {
      // 0.0 completely avoids and blocks this surface from the route
      priority.push({
        if: `surface == ${ghEnum}`,
        multiply_by: '0.0',
      });
    } else if (!normalizedAllowed.has(osmKey)) {
      let penalty = '0.1';
      if (osmKey === 'sand' || osmKey === 'dirt') {
        penalty = '0.05';
      } else if (osmKey === 'gravel' || osmKey === 'unpaved') {
        penalty = '0.15';
      } else if (osmKey === 'cobblestone') {
        penalty = '0.1';
      }

      priority.push({
        if: `surface == ${ghEnum}`,
        multiply_by: penalty,
      });
    }
  }

  // 4. Incline from the mobility profile. GraphHopper stores slope in percent.
  // Missing slope stays unpenalized (comparisons with MISSING are false).
  if (options?.includeSlope !== false && thresholds.maxInclinePercent > 0) {
    const limit = thresholds.maxInclinePercent;
    priority.push({
      if: `max_slope > ${limit} || average_slope > ${limit}`,
      multiply_by: '0.0',
    });
  }

  // 5. Smoothness penalty for strict profiles (e.g. wheelchairs or low kerb tolerance)
  if (thresholds.maxKerbMillimetres <= 30) {
    priority.push({
      if: 'smoothness == BAD || smoothness == VERY_BAD || smoothness == HORRIBLE || smoothness == VERY_HORRIBLE || smoothness == IMPASSABLE',
      multiply_by: '0.1',
    });
  }

  return {
    priority,
  };
}

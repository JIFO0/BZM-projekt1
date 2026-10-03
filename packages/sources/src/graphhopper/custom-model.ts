import type { BarrierThresholds } from '@krakow-bez-barier/core';
import type { GraphHopperCustomModel, GraphHopperCustomModelStatement } from './types';

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
export function buildCustomModel(thresholds: BarrierThresholds): GraphHopperCustomModel {
  const priority: GraphHopperCustomModelStatement[] = [];

  // 1. Handling Steps
  if (thresholds.stepsAreBlocker) {
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
  // Check which known GraphHopper surfaces are disallowed for this mobility profile
  const normalizedAllowed = new Set(thresholds.allowedSurfaces.map((s) => s.toLowerCase().trim()));

  for (const [osmKey, ghEnum] of Object.entries(GRAPHHOPPER_SURFACE_ENUMS)) {
    if (!normalizedAllowed.has(osmKey)) {
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

  // 4. Smoothness penalty for strict profiles (e.g. wheelchairs or low kerb tolerance)
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

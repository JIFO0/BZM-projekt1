import type { Fact, LonLat } from './types';
import type { WalkingRoute } from './providers';

export interface SampleRouteData {
  id: string;
  title: string;
  isSample: boolean;
  start: { name: string; position: LonLat };
  end: { name: string; position: LonLat };
  walkingRoute: WalkingRoute;
  facts: Fact[];
}

export interface SamplePlaceData {
  id: string;
  name: string;
  label: string;
  position: LonLat;
  isSample: boolean;
  facts: Fact[];
}

export interface DemoSnapshot {
  snapshotVersion: string;
  isSample: boolean;
  label: string;
  generatedAt: string;
  demoArea: string;
  sources: Array<{ name: string; url: string; licence: string }>;
  routes: SampleRouteData[];
  places: SamplePlaceData[];
}

import snapshotJson from '../../../fixtures/krakow-demo-snapshot.json';

export const DEMO_SNAPSHOT = snapshotJson as unknown as DemoSnapshot;

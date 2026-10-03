import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseCityConfig } from './city-config';
import { evaluateKerbHeight, evaluateSteps, evaluateSurface } from './profile';

const city = parseCityConfig(
  JSON.parse(readFileSync(path.join(__dirname, '../../../cities/krakow.json'), 'utf8')),
);

describe('profile thresholds', () => {
  it('loads Kraków config and keeps the city id out of the rules themselves', () => {
    expect(city.id).toBe('krakow');
    expect(city.mapy.routeType).toBe('foot_fast');
    expect(city.stalenessMonths).toBe(24);
  });

  it('rates kerb height against wheelchair profile limits', () => {
    expect(evaluateKerbHeight(40, city.profiles.wheelchair)).toBe('blocker');
    expect(evaluateKerbHeight(20, city.profiles.wheelchair)).toBe('ok');
    expect(evaluateKerbHeight(null, city.profiles.wheelchair)).toBe('unknown');
  });

  it('treats steps as a wheelchair blocker and downgrades them when a ramp is present', () => {
    expect(evaluateSteps({ stepCount: 12, ramp: false }, city.profiles.wheelchair)).toBe('blocker');
    expect(evaluateSteps({ stepCount: 12, ramp: true }, city.profiles.wheelchair)).toBe('warning');
    expect(evaluateSteps({ stepCount: 12, ramp: false }, city.profiles.custom)).toBe('warning');
    expect(evaluateSteps({ stepCount: null, ramp: true }, city.profiles.wheelchair)).toBe('unknown');
  });

  it('respects explicit stepsTreatment: allowed, warning, and blocker', () => {
    expect(
      evaluateSteps({ stepCount: 12, ramp: false }, { ...city.profiles.custom, stepsTreatment: 'allowed' })
    ).toBe('ok');
    expect(
      evaluateSteps({ stepCount: 12, ramp: false }, { ...city.profiles.custom, stepsTreatment: 'warning' })
    ).toBe('warning');
    expect(
      evaluateSteps({ stepCount: 12, ramp: false }, { ...city.profiles.custom, stepsTreatment: 'blocker' })
    ).toBe('blocker');
  });

  it('does not treat a missing surface as acceptable', () => {
    expect(evaluateSurface(null, city.profiles.wheelchair)).toBe('unknown');
    expect(evaluateSurface('sand', city.profiles.wheelchair)).toBe('blocker');
    expect(evaluateSurface('sand', city.profiles.custom)).toBe('warning');
    expect(evaluateSurface('asphalt', city.profiles.wheelchair)).toBe('ok');
  });

  it('treats blocked road types such as cobblestone and sand as blockers for wheelchair profile', () => {
    // Wheelchair profile has cobblestone and sand in blockedRoadTypes
    expect(evaluateSurface('cobblestone', city.profiles.wheelchair)).toBe('blocker');
    expect(evaluateSurface('sand', city.profiles.wheelchair)).toBe('blocker');
    // Custom profile does not block cobblestone or sand by default, so it is a warning
    expect(evaluateSurface('cobblestone', city.profiles.custom)).toBe('warning');
    expect(evaluateSurface('sand', city.profiles.custom)).toBe('warning');
  });
});

import type { BarrierThresholds } from '@krakow-bez-barier/core';
import { buildCustomModel } from './custom-model';

describe('buildCustomModel', () => {
  const wheelchairThresholds: BarrierThresholds = {
    maxKerbMillimetres: 30,
    minWidthMetres: 0.9,
    maxInclinePercent: 6,
    stepsAreBlocker: true,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted'],
  };

  const strollerThresholds: BarrierThresholds = {
    maxKerbMillimetres: 60,
    minWidthMetres: 0.75,
    maxInclinePercent: 8,
    stepsAreBlocker: false,
    allowedSurfaces: ['asphalt', 'concrete', 'paving_stones', 'compacted', 'fine_gravel'],
  };

  it('blocks steps completely for wheelchair profile', () => {
    const model = buildCustomModel(wheelchairThresholds);
    expect(model.priority).toBeDefined();
    const stepsRule = model.priority?.find((r) => r.if === 'road_class == STEPS');
    expect(stepsRule).toEqual({
      if: 'road_class == STEPS',
      multiply_by: '0.0',
    });
  });

  it('penalizes steps as non-blocking for stroller profile', () => {
    const model = buildCustomModel(strollerThresholds);
    const stepsRule = model.priority?.find((r) => r.if === 'road_class == STEPS');
    expect(stepsRule).toEqual({
      if: 'road_class == STEPS',
      multiply_by: '0.2',
    });
  });

  it('penalizes narrow ways smaller than minWidthMetres', () => {
    const model = buildCustomModel(wheelchairThresholds);
    const widthRule = model.priority?.find((r) => r.if.startsWith('max_width <'));
    expect(widthRule).toEqual({
      if: 'max_width < 0.9',
      multiply_by: '0.0',
    });
  });

  it('penalizes cobblestone and unallowed surfaces while sparing allowed surfaces', () => {
    const model = buildCustomModel(wheelchairThresholds);
    const cobblestoneRule = model.priority?.find((r) => r.if.includes('COBBLESTONE'));
    expect(cobblestoneRule).toBeDefined();
    expect(cobblestoneRule?.multiply_by).toBe('0.1');

    // Asphalt, concrete, paving_stones, compacted are allowed, so they should not have penalty rules
    const asphaltRule = model.priority?.find((r) => r.if.includes('ASPHALT'));
    expect(asphaltRule).toBeUndefined();
  });

  it('forgiving routing: does not penalize unmapped or null surfaces', () => {
    const model = buildCustomModel(wheelchairThresholds);
    // There must be no rule matching surface == MISSING or surface == null with 0.0
    const missingRule = model.priority?.find((r) => r.if.includes('MISSING') || r.if.includes('null'));
    expect(missingRule).toBeUndefined();
  });

  it('blocks slopes steeper than the profile incline limit', () => {
    const model = buildCustomModel(wheelchairThresholds);
    const slopeRule = model.priority?.find((r) => r.if.includes('max_slope'));
    expect(slopeRule).toEqual({
      if: 'max_slope > 6 || average_slope > 6',
      multiply_by: '0.0',
    });
    const loose = buildCustomModel(strollerThresholds);
    expect(loose.priority?.find((r) => r.if.includes('max_slope'))?.if).toContain('max_slope > 8');
  });

  it('penalizes bad smoothness for low kerb tolerance profiles', () => {
    const model = buildCustomModel(wheelchairThresholds);
    const smoothnessRule = model.priority?.find((r) => r.if.includes('smoothness == BAD'));
    expect(smoothnessRule).toBeDefined();
  });

  it('prefers sidewalks by lowering carriageway priority', () => {
    const model = buildCustomModel(wheelchairThresholds);
    const sidewalkRule = model.priority?.find((r) => r.if.includes('road_class == RESIDENTIAL'));
    expect(sidewalkRule?.multiply_by).toBe('0.35');
    expect(sidewalkRule?.if).not.toContain('FOOTWAY');
  });

  it('practical mode keeps sidewalk preference and does not forbid surfaces', () => {
    const model = buildCustomModel(
      { ...wheelchairThresholds, blockedRoadTypes: ['cobblestone'] },
      { mode: 'practical' },
    );
    expect(model.priority).toHaveLength(1);
    expect(model.priority?.[0]?.if).toContain('road_class == RESIDENTIAL');
    expect(model.priority?.some((r) => r.multiply_by === '0.0')).toBe(false);
  });

  it('completely blocks (multiply_by 0.0) surfaces in blockedRoadTypes such as cobblestone', () => {
    const model = buildCustomModel({
      ...wheelchairThresholds,
      blockedRoadTypes: ['cobblestone'],
    });
    const cobblestoneRule = model.priority?.find((r) => r.if === 'surface == COBBLESTONE');
    expect(cobblestoneRule).toEqual({
      if: 'surface == COBBLESTONE',
      multiply_by: '0.0',
    });
  });
});

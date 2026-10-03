import { isBarrierFreeDetourUnreasonable } from './detour';

describe('isBarrierFreeDetourUnreasonable', () => {
  it('keeps a longer barrier-free walk that stays near the practical route', () => {
    expect(
      isBarrierFreeDetourUnreasonable({
        practicalMetres: 1800,
        barrierFreeMetres: 4200,
        maxLateralMetres: 400,
      }),
    ).toBe(false);
  });

  it('rejects about a dozen extra kilometres', () => {
    expect(
      isBarrierFreeDetourUnreasonable({
        practicalMetres: 2000,
        barrierFreeMetres: 14_500,
        maxLateralMetres: 600,
      }),
    ).toBe(true);
  });

  it('rejects a multi-kilometre swing in another direction', () => {
    expect(
      isBarrierFreeDetourUnreasonable({
        practicalMetres: 2500,
        barrierFreeMetres: 7000,
        maxLateralMetres: 3200,
      }),
    ).toBe(true);
  });

  it('does not treat a short local deviation as unreasonable', () => {
    expect(
      isBarrierFreeDetourUnreasonable({
        practicalMetres: 900,
        barrierFreeMetres: 1600,
        maxLateralMetres: 2800,
      }),
    ).toBe(false);
  });
});

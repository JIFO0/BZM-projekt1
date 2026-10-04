import { buildRouteAccessibilityQuery, buildRouteKerbQuery } from './provider';

describe('route accessibility overpass query', () => {
  const bbox = '50.05,19.92,50.07,19.95';

  it('asks for measured kerbs and crossings without every surfaced road', () => {
    const query = buildRouteAccessibilityQuery(bbox);
    expect(query).toContain('node["kerb:height"]');
    expect(query).toContain('node["highway"="crossing"]');
    expect(query).toContain('way["highway"="footway"]');
    expect(query).not.toContain('way["surface"]');
    expect(query).not.toContain('way["width"]');
  });

  it('keeps a smaller kerb retry when the full query fails', () => {
    const query = buildRouteKerbQuery(bbox);
    expect(query).toContain('node["kerb"]');
    expect(query).toContain('node["highway"="crossing"]');
    expect(query).not.toContain('way["highway"="footway"]');
  });
});

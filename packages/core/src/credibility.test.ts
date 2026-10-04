import {
  conciseSourceCredit,
  credibilityFromReports,
  credibilityFromSource,
  reportsAreCorroborated,
} from './credibility';

describe('credibility index', () => {
  it('treats 5+ other reports as the highest tier, with or without photos', () => {
    expect(reportsAreCorroborated(5, 0)).toBe(true);
    expect(credibilityFromReports({ supportCount: 5, photoCount: 0 }).rank).toBe('corroborated');
    expect(credibilityFromReports({ supportCount: 5, photoCount: 0 }).score).toBe(100);
  });

  it('treats 3+ other reports as highest only when a photo exists', () => {
    expect(reportsAreCorroborated(3, 1)).toBe(true);
    expect(reportsAreCorroborated(3, 0)).toBe(false);
    expect(credibilityFromReports({ supportCount: 3, photoCount: 1 }).rank).toBe('corroborated');
    expect(credibilityFromReports({ supportCount: 4, photoCount: 0 }).rank).toBe('partial_report');
    expect(credibilityFromReports({ supportCount: 2, photoCount: 3 }).rank).toBe('partial_report');
  });

  it('keeps a lone report at the bottom', () => {
    const single = credibilityFromReports({ supportCount: 0, photoCount: 1 });
    expect(single.rank).toBe('single_report');
    expect(single.score).toBeLessThan(
      credibilityFromSource({ name: 'Geoportal.gov.pl', licence: 'BDOT10k' }).score,
    );
  });

  it('ranks providers below corroborated reports and above a single report', () => {
    const top = credibilityFromReports({ supportCount: 6, photoCount: 0 }).score;
    const osmVerified = credibilityFromSource({
      name: 'OpenStreetMap',
      licence: 'ODbL',
      status: 'verified',
      hasAuditDate: true,
    }).score;
    const city = credibilityFromSource({
      name: 'BIP Miasta Krakowa',
      licence: 'informacja publiczna',
      status: 'verified',
    }).score;
    const msip = credibilityFromSource({ name: 'MSIP Kraków / ZDMK', status: 'verified' }).score;
    const wawel = credibilityFromSource({
      name: 'Zamek Królewski na Wawelu',
      status: 'verified',
    }).score;
    const audit = credibilityFromSource({
      name: 'Audyt Dostępności UMK',
      status: 'verified',
    }).score;
    const osmCommunity = credibilityFromSource({
      name: 'OpenStreetMap',
      licence: 'ODbL',
      status: 'community',
    }).score;
    const basemap = credibilityFromSource({ name: 'Geoportal BDOT10k' }).score;
    const single = credibilityFromReports({ supportCount: 0, photoCount: 0 }).score;

    expect(top).toBeGreaterThan(osmVerified);
    expect(osmVerified).toBeGreaterThan(city);
    expect(city).toBeGreaterThan(msip);
    expect(msip).toBeGreaterThan(wawel);
    expect(wawel).toBeGreaterThan(audit);
    expect(audit).toBeGreaterThan(osmCommunity);
    expect(osmCommunity).toBeGreaterThan(basemap);
    expect(basemap).toBeGreaterThan(single);
  });

  it('does not promote OSM to verified from the provider name alone', () => {
    expect(
      credibilityFromSource({
        name: 'OpenStreetMap',
        status: 'community',
        hasAuditDate: false,
      }).rank,
    ).toBe('osm_community');
    expect(
      credibilityFromSource({
        name: 'OpenStreetMap',
        status: 'verified',
      }).rank,
    ).toBe('osm_verified');
  });

  it('does not let a conflicting fact keep an official score', () => {
    expect(
      credibilityFromSource({
        name: 'OpenStreetMap',
        status: 'conflicting',
        hasAuditDate: true,
      }).rank,
    ).toBe('conflicting');
  });

  it('adds a short credit only when the owner is missing', () => {
    expect(conciseSourceCredit({ name: 'OpenStreetMap', licence: 'ODbL' })).toBe(
      '© OSM contributors',
    );
    expect(
      conciseSourceCredit({
        name: 'OpenStreetMap',
        licence: 'ODbL © OpenStreetMap contributors',
      }),
    ).toBeNull();
    expect(conciseSourceCredit({ name: 'ZDMK', licence: 'Informacja Publiczna' })).toBeNull();
    expect(conciseSourceCredit({ name: 'ZDMK', licence: 'ODbL' })).toBe('informacja publiczna');
    expect(conciseSourceCredit({ name: '', licence: '' })).toBe('źródło niepodane');
  });
});

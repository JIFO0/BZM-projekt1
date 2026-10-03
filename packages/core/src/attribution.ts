import type { SourceDescriptor } from './types';

/**
 * Mapy.com attribution required wherever Mapy data or tiles are shown.
 * https://developer.mapy.com/rest-api-mapy-cz/atribution/
 * The copyright sentence is kept in the form required by that page.
 */
export const MAPY_ATTRIBUTION: SourceDescriptor = {
  name: 'Mapy.com',
  url: 'https://mapy.com/',
  licence: 'Mapy.com REST API terms',
  attribution: 'Seznam.cz a.s. and others',
  updateFrequency: 'live request; cache before repeating',
};

export const MAPY_LOGO = {
  svg: 'https://api.mapy.com/img/api/logo.svg',
  minHeightPxAboveMap: 30,
  minHeightPxOutsideMap: 10,
  href: 'https://mapy.com/',
  copyrightHref: 'https://api.mapy.com/copyright',
} as const;

/**
 * OSM data licence and the credit line used next to OSM-derived facts.
 * https://www.openstreetmap.org/copyright
 */
export const OSM_ATTRIBUTION: SourceDescriptor = {
  name: 'OpenStreetMap',
  url: 'https://www.openstreetmap.org/copyright',
  licence: 'ODbL',
  attribution: '© OpenStreetMap contributors',
  updateFrequency: 'continuous community edits; not a confirmation date',
};

export const OSM_ODBL_URL = 'https://opendatacommons.org/licenses/odbl/';

/**
 * Public Overpass instance used until a paid or self-hosted instance is configured.
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 * Identify the app. Do not send a browser User-Agent. Cache responses.
 * On HTTP 429 or 406, wait before retrying. One chunk at a time.
 */
export const OVERPASS_INTERPRETER = 'https://overpass-api.de/api/interpreter';

export function overpassHeaders(userAgent: string): Record<string, string> {
  const trimmed = userAgent.trim();
  if (trimmed.length < 8) {
    throw new Error('Overpass requires an identifying User-Agent');
  }
  return {
    Accept: 'application/json',
    'User-Agent': trimmed,
  };
}

import {
  GEOPORTAL_BDOT10K_ATTRIBUTION,
  MAPY_ATTRIBUTION,
  OSM_ATTRIBUTION,
  type RouteFinding,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';

import { useSession } from '@/state/session';
import { city } from '@/config/city';
import { getLocalizedFactValue, t } from '@/i18n/strings';

export interface MapViewProps {
  route?: WalkingRoute | null;
  findings?: RouteFinding[];
  center?: { lat: number; lon: number };
  zoom?: number;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  startLocation?: { name?: string; lat: number; lon: number };
  endLocation?: { name?: string; lat: number; lon: number };
  clickedLocation?: { name?: string; lat: number; lon: number } | null;
  userLocation?: { lat: number; lon: number } | null;
  onMapClick?: (coords: { lat: number; lon: number }) => void;
  isPickingMode?: boolean;
}

export function MapView({
  route,
  findings = [],
  center,
  zoom = 15,
  fullScreen = false,
  style,
  startLocation,
  endLocation,
  clickedLocation,
  userLocation,
  onMapClick,
  isPickingMode = false,
}: MapViewProps) {
  const { colors, isHighContrast, locale } = useSession();
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);
  const isMapLoaded = useRef(false);

  const pendingUserLocation = useRef(userLocation);
  pendingUserLocation.current = userLocation;
  const pendingClickedLocation = useRef(clickedLocation);
  pendingClickedLocation.current = clickedLocation;

  const currentPositionRef = useRef<{ lat: number; lon: number; zoom: number } | null>(null);
  const prevRouteRef = useRef(route);
  if (prevRouteRef.current !== route) {
    prevRouteRef.current = route;
    currentPositionRef.current = null;
  }

  // Fixed initial center so the iframe is never destroyed/reloaded on center or click updates
  const initialCenterRef = useRef<{ lat: number; lon: number }>({
    lat: center ? center.lat : (userLocation ? userLocation.lat : (route?.coordinates?.[0]?.[1] ?? 50.0619)),
    lon: center ? center.lon : (userLocation ? userLocation.lon : (route?.coordinates?.[0]?.[0] ?? 19.9373)),
  });

  // Reliable cross-platform message dispatch to the active Leaflet map
  const sendToMap = useCallback((msg: { type: string; lat?: number; lon?: number; zoom?: number; markers?: any[] }) => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        const win = iframeRef.current.contentWindow as any;
        if (msg.type === 'SET_MARKERS' && typeof win.updateMarkers === 'function') {
          win.updateMarkers(msg.markers);
          return;
        }
        if (msg.type === 'SET_USER_LOCATION' && typeof win.updateUserMarker === 'function') {
          win.updateUserMarker(msg.lat, msg.lon);
          return;
        }
        if (msg.type === 'SET_CENTER' && typeof win.setMapCenter === 'function') {
          win.setMapCenter(msg.lat, msg.lon, msg.zoom);
          return;
        }
        if (msg.type === 'SET_CLICKED_LOCATION' && typeof win.updateClickedMarker === 'function') {
          win.updateClickedMarker(msg.lat, msg.lon);
          return;
        }
        if (msg.type === 'CLEAR_CLICKED_LOCATION' && typeof win.clearClickedMarker === 'function') {
          win.clearClickedMarker();
          return;
        }
      } catch {
        // Fallback to postMessage
      }
      iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), '*');
    } else if (Platform.OS !== 'web' && webViewRef.current) {
      if (msg.type === 'SET_MARKERS') {
        const js = `if (typeof updateMarkers === 'function') { updateMarkers(${JSON.stringify(msg.markers || [])}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_USER_LOCATION') {
        const js = `if (typeof updateUserMarker === 'function') { updateUserMarker(${msg.lat}, ${msg.lon}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_CENTER') {
        const js = `if (typeof setMapCenter === 'function') { setMapCenter(${msg.lat}, ${msg.lon}, ${msg.zoom || 16}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_CLICKED_LOCATION') {
        const js = `if (typeof updateClickedMarker === 'function') { updateClickedMarker(${msg.lat}, ${msg.lon}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'CLEAR_CLICKED_LOCATION') {
        const js = `if (typeof clearClickedMarker === 'function') { clearClickedMarker(); } true;`;
        webViewRef.current.injectJavaScript(js);
      }
    }
  }, []);

  const markersData = useMemo(() => {
    return findings.map((f, i) => {
      let color = colors.infoBorder;
      if (f.severity === 'blocker') color = colors.blockerBorder;
      else if (f.severity === 'warning') color = colors.warningBorder;
      else if (f.severity === 'ok') color = colors.okBorder;
      else if (f.severity === 'unknown') color = colors.unknownBorder;

      const distLabel =
        f.distanceFromStartMetres && f.distanceFromStartMetres > 0
          ? ` (${f.distanceFromStartMetres} m)`
          : '';

      const typeLabel =
        f.type === 'steps'
          ? locale === 'pl' ? 'Schody' : locale === 'uk' ? 'Сходи' : 'Steps'
          : f.type === 'kerb'
          ? locale === 'pl' ? 'Krawężnik' : locale === 'uk' ? 'Бордюр' : 'Kerb'
          : f.type === 'surface'
          ? locale === 'pl' ? 'Nawierzchnia' : locale === 'uk' ? 'Покриття' : 'Surface'
          : f.type === 'incline'
          ? locale === 'pl' ? 'Nachylenie' : locale === 'uk' ? 'Нахил' : 'Incline'
          : f.type === 'width'
          ? locale === 'pl' ? 'Szerokość' : locale === 'uk' ? 'Ширина' : 'Width'
          : f.type === 'wheelchair'
          ? locale === 'pl' ? 'Dostępność dla wózków' : locale === 'uk' ? 'Доступність' : 'Accessibility'
          : f.type;

      const localizedVal = getLocalizedFactValue(f.fact.value, locale);
      const cleanVal = localizedVal.replace(/\s*\(?wheelchair=[a-z_]+\)?/gi, '').trim();

      return {
        index: i + 1,
        type: f.type,
        lat: f.fact.subject.lat,
        lon: f.fact.subject.lon,
        title: `#${i + 1}${distLabel}: ${typeLabel}`,
        value: cleanVal || localizedVal || f.fact.value,
        severity: f.severity,
        color,
      };
    });
  }, [findings, colors, locale]);

  const initialMarkersRef = useRef(markersData);
  const pendingMarkers = useRef(markersData);
  pendingMarkers.current = markersData;

  useEffect(() => {
    if (!isMapLoaded.current) return;
    sendToMap({
      type: 'SET_MARKERS',
      markers: markersData,
    });
  }, [markersData, sendToMap]);

  const flushPendingUpdates = useCallback(() => {
    isMapLoaded.current = true;
    if (pendingMarkers.current) {
      sendToMap({
        type: 'SET_MARKERS',
        markers: pendingMarkers.current,
      });
    }
    if (pendingUserLocation.current) {
      sendToMap({
        type: 'SET_USER_LOCATION',
        lat: pendingUserLocation.current.lat,
        lon: pendingUserLocation.current.lon,
      });
    }
    if (pendingClickedLocation.current) {
      sendToMap({
        type: 'SET_CLICKED_LOCATION',
        lat: pendingClickedLocation.current.lat,
        lon: pendingClickedLocation.current.lon,
      });
    }
  }, [sendToMap]);

  // Smooth dynamic user marker update without reloading iframe / WebView
  useEffect(() => {
    if (!userLocation) return;
    sendToMap({
      type: 'SET_USER_LOCATION',
      lat: userLocation.lat,
      lon: userLocation.lon,
    });
  }, [userLocation, sendToMap]);

  // Smooth dynamic clicked location pin update without reloading iframe / WebView
  useEffect(() => {
    if (clickedLocation) {
      sendToMap({
        type: 'SET_CLICKED_LOCATION',
        lat: clickedLocation.lat,
        lon: clickedLocation.lon,
      });
    } else {
      sendToMap({
        type: 'CLEAR_CLICKED_LOCATION',
      });
    }
  }, [clickedLocation, sendToMap]);

  // Smooth dynamic centering
  useEffect(() => {
    if (!center) return;
    sendToMap({
      type: 'SET_CENTER',
      lat: center.lat,
      lon: center.lon,
      zoom,
    });
  }, [center, zoom, sendToMap]);

  const mapyApiKey = process.env.EXPO_PUBLIC_MAPY_API_KEY;
  const hasMapyKey = Boolean(
    mapyApiKey &&
    mapyApiKey !== 'replace-with-mapy-api-key' &&
    mapyApiKey.trim().length > 5
  );

  const isGeoportal = city.adapters.tiles === 'geoportal';

  const tileUrl = isGeoportal
    ? 'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/BDOT10k-BDOO?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BDOT10k-BDOO&STYLE=default&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png'
    : hasMapyKey
    ? `https://api.mapy.com/v1/maptiles/${city.mapy?.tileMapset ?? 'basic'}/256/{z}/{x}/{y}?apikey=${mapyApiKey}`
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = isGeoportal
    ? `${GEOPORTAL_BDOT10K_ATTRIBUTION.attribution} • Geoportal.gov.pl`
    : hasMapyKey
    ? MAPY_ATTRIBUTION.attribution
    : OSM_ATTRIBUTION.attribution;

  // htmlContent is memoized so it does NOT reload on userLocation updates
  const htmlContent = useMemo(() => {
    const routeGeoJsonCoords = route ? route.coordinates.map(([lon, lat]) => [lat, lon]) : [];
    const surfaceSpans = (route?.surfaceSpans ?? []).map((span) => ({
      tone: span.tone,
      coordinates: span.coordinates.map(([lon, lat]) => [lat, lon]),
    }));
    const okRouteColor = isHighContrast ? '#42A5F5' : '#005CA9';
    const otherRouteColor = '#F57C00';

    const startPin = startLocation || (route && route.coordinates.length > 0 ? {
      name: 'Start',
      lat: route.coordinates[0]![1],
      lon: route.coordinates[0]![0],
    } : null);

    const endPin = endLocation || (route && route.coordinates.length > 0 ? {
      name: locale === 'pl' ? 'Cel' : locale === 'uk' ? 'Ціль' : 'Destination',
      lat: route.coordinates[route.coordinates.length - 1]![1],
      lon: route.coordinates[route.coordinates.length - 1]![0],
    } : null);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4leaflet/1.0.2/proj4leaflet.min.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e3df; overflow: hidden; }
    .custom-marker {
      background: transparent !important;
      border: none !important;
    }
    .custom-marker-badge {
      background-color: #FFFFFF;
      border-radius: 50%;
      border-width: 3px;
      border-style: solid;
      width: 30px;
      height: 30px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.38);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 2px;
      transition: transform 0.15s ease-out;
    }
    .endpoint-marker {
      background-color: #22C55E;
      color: #FFFFFF;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      font-weight: 800;
      text-align: center;
      line-height: 26px;
      font-size: 13px;
      width: 32px !important;
      height: 32px !important;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      z-index: 10000 !important;
    }
    .endpoint-marker.start {
      background-color: #22C55E;
    }
    .endpoint-marker.destination {
      background-color: #D32F2F;
    }
    .user-location-marker {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px !important;
      height: 26px !important;
    }
    .user-dot {
      width: 14px;
      height: 14px;
      background-color: #007AFF;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      position: absolute;
      z-index: 2;
    }
    .user-pulse {
      position: absolute;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.35);
      animation: user-pulse-anim 2s infinite ease-out;
      z-index: 1;
    }
    @keyframes user-pulse-anim {
      0% { transform: scale(0.6); opacity: 0.9; }
      70% { transform: scale(1.7); opacity: 0; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    .clicked-location-marker {
      width: 30px;
      height: 38px;
      position: relative;
      background: transparent !important;
      border: none !important;
    }
    .clicked-pin-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 30px;
      height: 38px;
      filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));
      z-index: 2;
      pointer-events: none;
    }
    .clicked-pin-pulse {
      position: absolute;
      top: 38px;
      left: 15px;
      width: 22px;
      height: 22px;
      margin-top: -11px;
      margin-left: -11px;
      border-radius: 50%;
      background: rgba(0, 92, 169, 0.4);
      animation: user-pulse-anim 1.8s infinite ease-out;
      z-index: 1;
      pointer-events: none;
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(255, 255, 255, 0.85) !important;
      padding: 2px 6px !important;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-popup-content {
      margin: 10px 12px;
      font-size: 13px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var isGeoportal = ${Boolean(isGeoportal)};
    var currentPos = ${JSON.stringify(currentPositionRef.current)};
    var initialCenterLat = currentPos ? currentPos.lat : ${initialCenterRef.current.lat};
    var initialCenterLon = currentPos ? currentPos.lon : ${initialCenterRef.current.lon};
    var initialZoom = currentPos ? currentPos.zoom : ${zoom};

    var mapOptions = {
      zoomControl: false,
      attributionControl: true
    };

    if (isGeoportal && typeof L.Proj !== 'undefined') {
      try {
        var crs2180 = new L.Proj.CRS(
          'EPSG:2180',
          '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs',
          {
            origin: [100000.0, 850000.0],
            resolutions: [
              2116.6708999999995,
              1058.3354499999997,
              529.1677249999999,
              264.58386249999994,
              132.29193124999997,
              66.14596562499999,
              26.45838625,
              13.229193125,
              6.6145965625,
              2.645838625,
              1.3229193125,
              0.529167725,
              0.2645838625
            ]
          }
        );
        mapOptions.crs = crs2180;
        mapOptions.minZoom = 0;
        mapOptions.maxZoom = 12;
        if (!currentPos && initialZoom > 12) {
          initialZoom = Math.min(12, Math.max(0, initialZoom - 5));
        }
      } catch (e) {
        console.warn('Failed to initialize EPSG:2180 CRS, falling back to standard WebMercator:', e);
      }
    }

    var map = L.map('map', mapOptions).setView([initialCenterLat, initialCenterLon], initialZoom);

    if (isGeoportal && map.options.crs && map.options.crs.code === 'EPSG:2180') {
      var CachedTileLayer = L.TileLayer.extend({
        createTile: function(coords, done) {
          var tile = document.createElement('img');
          tile.alt = '';
          tile.setAttribute('role', 'presentation');
          var url = this.getTileUrl(coords);

          if (typeof window !== 'undefined' && 'caches' in window) {
            caches.open('geoportal-bdot10k-v1').then(function(cache) {
              cache.match(url).then(function(cachedResponse) {
                if (cachedResponse) {
                  cachedResponse.blob().then(function(blob) {
                    tile.src = URL.createObjectURL(blob);
                    done(null, tile);
                  }).catch(function() {
                    tile.src = url;
                    L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
                    L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));
                  });
                } else {
                  fetch(url, { mode: 'cors' }).then(function(networkRes) {
                    if (networkRes.ok) {
                      var clone = networkRes.clone();
                      cache.put(url, clone);
                      return networkRes.blob();
                    }
                    throw new Error('HTTP ' + networkRes.status);
                  }).then(function(blob) {
                    tile.src = URL.createObjectURL(blob);
                    done(null, tile);
                  }).catch(function() {
                    tile.src = url;
                    L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
                    L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));
                  });
                }
              }).catch(function() {
                tile.src = url;
                L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
                L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));
              });
            }).catch(function() {
              tile.src = url;
              L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
              L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));
            });
          } else {
            tile.src = url;
            L.DomEvent.on(tile, 'load', L.Util.bind(done, null, null, tile));
            L.DomEvent.on(tile, 'error', L.Util.bind(done, null, null, tile));
          }

          return tile;
        }
      });

      var geoportalLayer = new CachedTileLayer(
        'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/BDOT10k-BDOO?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BDOT10k-BDOO&STYLE=default&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png',
        {
          minZoom: 0,
          maxZoom: 12,
          tileSize: 512,
          attribution: '${tileAttribution}'
        }
      );
      geoportalLayer.addTo(map);

      // Pre-warm local persistent tile cache for Krakow center and immediate surroundings
      if (typeof window !== 'undefined' && 'caches' in window) {
        setTimeout(function() {
          caches.open('geoportal-bdot10k-v1').then(function(cache) {
            var krakowPreloadTiles = [
              { z: 0, r: 0, c: 0 },
              { z: 1, r: 1, c: 0 },
              { z: 2, r: 2, c: 1 },
              { z: 3, r: 4, c: 3 },
              { z: 4, r: 8, c: 6 },
              { z: 5, r: 17, c: 13 },
              { z: 6, r: 44, c: 34 },
              { z: 7, r: 89, c: 68 },
              { z: 7, r: 89, c: 69 },
              { z: 8, r: 178, c: 137 },
              { z: 8, r: 178, c: 138 },
              { z: 8, r: 179, c: 137 },
              { z: 8, r: 179, c: 138 },
              { z: 9, r: 446, c: 344 },
              { z: 9, r: 447, c: 344 },
              { z: 9, r: 448, c: 344 },
              { z: 9, r: 446, c: 345 },
              { z: 9, r: 447, c: 345 },
              { z: 9, r: 448, c: 345 },
              { z: 10, r: 892, c: 688 },
              { z: 10, r: 893, c: 688 },
              { z: 10, r: 894, c: 688 },
              { z: 10, r: 895, c: 688 },
              { z: 10, r: 892, c: 689 },
              { z: 10, r: 893, c: 689 },
              { z: 10, r: 894, c: 689 },
              { z: 10, r: 895, c: 689 }
            ];
            krakowPreloadTiles.forEach(function(t) {
              var u = 'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/BDOT10k-BDOO?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BDOT10k-BDOO&STYLE=default&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:' + t.z + '&TILEROW=' + t.r + '&TILECOL=' + t.c + '&FORMAT=image/png';
              cache.match(u).then(function(has) {
                if (!has) {
                  fetch(u, { mode: 'cors' }).then(function(r) {
                    if (r.ok) cache.put(u, r);
                  }).catch(function() {});
                }
              });
            });
          }).catch(function() {});
        }, 800);
      }
    } else {
      L.tileLayer('${tileUrl}', {
        maxZoom: 19,
        attribution: '${tileAttribution}'
      }).addTo(map);
    }

    var routeCoords = ${JSON.stringify(routeGeoJsonCoords)};
    var surfaceSpans = ${JSON.stringify(surfaceSpans)};
    var routeLine = null;
    if (routeCoords.length > 0) {
      L.polyline(routeCoords, { color: '#FFFFFF', weight: 8, opacity: 0.95 }).addTo(map);
      if (surfaceSpans.length > 0) {
        surfaceSpans.forEach(function(span) {
          var color = span.tone === 'other' ? '${otherRouteColor}' : '${okRouteColor}';
          routeLine = L.polyline(span.coordinates, { color: color, weight: 5, opacity: 0.95 }).addTo(map);
        });
      } else {
        routeLine = L.polyline(routeCoords, { color: '${colors.accent}', weight: 5, opacity: 0.95 }).addTo(map);
      }
      if (!currentPos) {
        map.fitBounds(L.polyline(routeCoords).getBounds(), { padding: [40, 40] });
      }
    }

    var startPin = ${JSON.stringify(startPin)};
    if (startPin && startPin.lat && startPin.lon) {
      var startIcon = L.divIcon({
        className: 'endpoint-marker start',
        html: 'A',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      var startPopupLabel = ${JSON.stringify(t(locale, 'from') || 'Start')};
      var startFallback = ${JSON.stringify(locale === 'pl' ? 'Początek trasy' : locale === 'uk' ? 'Початок маршруту' : 'Start')};
      L.marker([startPin.lat, startPin.lon], { icon: startIcon, zIndexOffset: 10000 }).addTo(map)
        .bindPopup('<b>' + startPopupLabel + ':</b> ' + (startPin.name || startFallback));
    }

    var endPin = ${JSON.stringify(endPin)};
    if (endPin && endPin.lat && endPin.lon) {
      var endIcon = L.divIcon({
        className: 'endpoint-marker destination',
        html: 'B',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      var endPopupLabel = ${JSON.stringify(t(locale, 'to') || (locale === 'pl' ? 'Cel' : locale === 'uk' ? 'Ціль' : 'Destination'))};
      var endFallback = ${JSON.stringify(locale === 'pl' ? 'Koniec trasy' : locale === 'uk' ? 'Кінець маршруту' : 'Destination')};
      L.marker([endPin.lat, endPin.lon], { icon: endIcon, zIndexOffset: 10000 }).addTo(map)
        .bindPopup('<b>' + endPopupLabel + ':</b> ' + (endPin.name || endFallback));
    }

    function getObstacleSvgIcon(type, color) {
      var sWidth = "2.3";
      if (type === 'steps') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 5h-5v5h-5v5H6v5H3" />' +
          '</svg>';
      }
      if (type === 'kerb') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 17h6V7h12" />' +
          '<line x1="9" y1="7" x2="9" y2="17" stroke-width="3.5" />' +
          '</svg>';
      }
      if (type === 'surface') {
        // Nawierzchnia / droga: perspektywa jezdni z krawędziami i linią przerywaną
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M4 21L8 3" />' +
          '<path d="M20 21L16 3" />' +
          '<line x1="12" y1="4" x2="12" y2="7" stroke-width="2" />' +
          '<line x1="12" y1="11" x2="12" y2="14" stroke-width="2" />' +
          '<line x1="12" y1="18" x2="12" y2="21" stroke-width="2" />' +
          '</svg>';
      }
      if (type === 'wheelchair') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="5" r="2.5" />' +
          '<path d="M9 19a5 5 0 1 0 5-5H9v-5h4" />' +
          '</svg>';
      }
      if (type === 'incline') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 19h18L3 8v11z" fill="' + color + '" fill-opacity="0.18" />' +
          '<path d="M14 6h7v7" />' +
          '<path d="M21 6L10 17" />' +
          '</svg>';
      }
      if (type === 'width') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<line x1="3" y1="4" x2="3" y2="20" stroke-width="2.6" />' +
          '<line x1="21" y1="4" x2="21" y2="20" stroke-width="2.6" />' +
          '<path d="M3 12h6m-2-3l3 3-3 3" />' +
          '<path d="M21 12h-6m2-3l-3 3 3 3" />' +
          '</svg>';
      }
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="9" />' +
        '<line x1="12" y1="8" x2="12" y2="12" stroke-width="2.5" />' +
        '<circle cx="12" cy="16" r="0.8" fill="' + color + '" />' +
        '</svg>';
    }

    var markersLayer = L.layerGroup().addTo(map);

    function renderMarkers(markersList) {
      if (!map || !markersLayer) return;
      markersLayer.clearLayers();
      if (!Array.isArray(markersList)) return;

      markersList.forEach(function(m) {
        var iconSvg = getObstacleSvgIcon(m.type, m.color);
        var icon = L.divIcon({
          className: 'custom-marker',
          html: '<div class="custom-marker-badge" style="border-color:' + m.color + '; color:' + m.color + ';" title="' + m.title + '">' + iconSvg + '</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        var statusText = m.severity === 'blocker' ? '${t(locale, 'severityBlocker')}' : m.severity === 'warning' ? '${t(locale, 'severityWarning')}' : m.severity === 'ok' ? '${t(locale, 'severityOk')}' : m.severity;
        var statusBg = m.severity === 'blocker' ? '#fee2e2' : m.severity === 'warning' ? '#ffedd5' : m.severity === 'ok' ? '#dcfce7' : '#f1f5f9';
        var statusColor = m.severity === 'blocker' ? '#b91c1c' : m.severity === 'warning' ? '#c2410c' : m.severity === 'ok' ? '#15803d' : '#475569';

        var popupHtml = '<div style="min-width: 170px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
          '<div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px; color: #0f172a;">' + m.title + '</div>' +
          '<div style="font-size: 12px; margin-bottom: 6px; color: #334155; line-height: 1.35;">' + m.value + '</div>' +
          '<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + ';">' + statusText + '</span>' +
          '</div>';

        var marker = L.marker([m.lat, m.lon], { icon: icon }).addTo(markersLayer);
        marker.bindPopup(popupHtml);
      });
    }

    window.updateMarkers = renderMarkers;
    renderMarkers(${JSON.stringify(initialMarkersRef.current)});

    var userMarker = null;

    window.updateUserMarker = function(lat, lon) {
      if (!map) return;
      if (userMarker) {
        userMarker.setLatLng([lat, lon]);
      } else {
        var userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-pulse"></div><div class="user-dot"></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        var userPopupLabel = ${JSON.stringify(locale === 'pl' ? 'Twoja lokalizacja' : locale === 'uk' ? 'Ваше розташування' : 'Your location')};
        userMarker = L.marker([lat, lon], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map).bindPopup('<b>' + userPopupLabel + '</b>');
      }
    };

    var clickedMarker = null;
    var clickedSvgIconHtml = '<div class="clicked-pin-pulse"></div>' +
      '<div class="clicked-pin-icon">' +
        '<svg width="30" height="38" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 10.8 29.1 11.26 29.5C11.68 29.87 12.32 29.87 12.74 29.5C13.2 29.1 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z" fill="${colors.accent}"/>' +
          '<circle cx="12" cy="11" r="5.2" fill="#FFFFFF"/>' +
          '<circle cx="12" cy="11" r="2.8" fill="${colors.accent}"/>' +
        '</svg>' +
      '</div>';

    window.updateClickedMarker = function(lat, lon) {
      if (!map) return;
      if (clickedMarker) {
        clickedMarker.setLatLng([lat, lon]);
      } else {
        var clickedIcon = L.divIcon({
          className: 'clicked-location-marker',
          html: clickedSvgIconHtml,
          iconSize: [30, 38],
          iconAnchor: [15, 38]
        });
        clickedMarker = L.marker([lat, lon], {
          icon: clickedIcon,
          zIndexOffset: 950
        }).addTo(map);
      }
    };

    window.clearClickedMarker = function() {
      if (clickedMarker && map) {
        map.removeLayer(clickedMarker);
        clickedMarker = null;
      }
    };

    window.setMapCenter = function(lat, lon, zoomLevel) {
      if (!map) return;
      var targetZoom = zoomLevel || map.getZoom() || 16;
      if (isGeoportal && map.options.crs && map.options.crs.code === 'EPSG:2180') {
        if (targetZoom > 12) {
          targetZoom = Math.min(12, Math.max(0, targetZoom - 5));
        }
      }
      map.setView([lat, lon], targetZoom, { animate: true });
    };

    map.on('click', function(e) {
      window.updateClickedMarker(e.latlng.lat, e.latlng.lng);
      var msg = JSON.stringify({ type: 'MAP_CLICK', lat: e.latlng.lat, lon: e.latlng.lng });
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    });

    map.on('moveend', function() {
      var c = map.getCenter();
      var z = map.getZoom();
      var msg = JSON.stringify({ type: 'MAP_MOVE_END', lat: c.lat, lon: c.lng, zoom: z });
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, '*');
      }
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    });

    if (${Boolean(isPickingMode)}) {
      map.getContainer().style.cursor = 'crosshair';
    }

    function handleMapMessage(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;
        if (data.type === 'SET_MARKERS') {
          window.updateMarkers(data.markers);
        } else if (data.type === 'SET_CENTER') {
          window.setMapCenter(data.lat, data.lon, data.zoom);
        } else if (data.type === 'SET_USER_LOCATION') {
          window.updateUserMarker(data.lat, data.lon);
        } else if (data.type === 'SET_CLICKED_LOCATION') {
          window.updateClickedMarker(data.lat, data.lon);
        } else if (data.type === 'CLEAR_CLICKED_LOCATION') {
          window.clearClickedMarker();
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleMapMessage);
    document.addEventListener('message', handleMapMessage);

    window.addEventListener('resize', function() {
      map.invalidateSize();
    });
    setTimeout(function() {
      map.invalidateSize();
    }, 250);
  </script>
</body>
</html>
    `;
  }, [
    route,
    startLocation,
    endLocation,
    zoom,
    tileUrl,
    tileAttribution,
    colors.accent,
    isHighContrast,
    locale,
    isPickingMode,
    isGeoportal,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;
        if (data.type === 'MAP_CLICK' && onMapClick) {
          onMapClick({ lat: data.lat, lon: data.lon });
        } else if (data.type === 'MAP_MOVE_END') {
          currentPositionRef.current = { lat: data.lat, lon: data.lon, zoom: data.zoom };
        }
      } catch {}
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onMapClick]);

  return (
    <View
      style={[
        fullScreen ? styles.fullContainer : styles.cardContainer,
        {
          borderColor: colors.border,
          borderWidth: fullScreen ? 0 : (isHighContrast ? 2.5 : 1.5),
        },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          title="Mapa trasy"
          srcDoc={htmlContent}
          onLoad={flushPendingUpdates}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          onLoadEnd={flushPendingUpdates}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (!data) return;
              if (data.type === 'MAP_CLICK' && onMapClick) {
                onMapClick({ lat: data.lat, lon: data.lon });
              } else if (data.type === 'MAP_MOVE_END') {
                currentPositionRef.current = { lat: data.lat, lon: data.lon, zoom: data.zoom };
              }
            } catch {}
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    height: 290,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  fullContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

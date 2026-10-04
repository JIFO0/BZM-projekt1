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
import { subscribeHarmonyHeading } from '@/services/harmony';
import { getTextSizeMultiplier } from '@/theme/tokens';

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
  inspectedPlace?: { name?: string; lat: number; lon: number } | null;
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
  inspectedPlace,
  userLocation,
  onMapClick,
  isPickingMode = false,
}: MapViewProps) {
  const { colors, isHighContrast, locale, textSize, fontSize } = useSession();
  const iconScale = getTextSizeMultiplier(textSize);

  const customMarkerSize = Math.round(30 * iconScale);
  const customMarkerAnchor = Math.round(customMarkerSize / 2);
  const obstacleSvgSize = Math.round(16 * iconScale);
  const obstacleStrokeWidth = (2.3 * Math.min(1.35, iconScale)).toFixed(1);

  const endpointMarkerSize = Math.round(34 * iconScale);
  const endpointMarkerAnchor = Math.round(endpointMarkerSize / 2);
  const endpointFontSize = Math.round(14 * iconScale);
  const endpointLineHeight = endpointMarkerSize - Math.round(6 * iconScale);
  const endpointBorder = Math.max(2, Math.round(3 * iconScale));

  const userMarkerSize = Math.round(26 * iconScale);
  const userMarkerAnchor = Math.round(userMarkerSize / 2);
  const userDotSize = Math.round(14 * iconScale);

  const clickedPinWidth = Math.round(30 * iconScale);
  const clickedPinHeight = Math.round(38 * iconScale);
  const clickedPinAnchorX = Math.round(clickedPinWidth / 2);
  const clickedPinAnchorY = clickedPinHeight;
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);
  const isMapLoaded = useRef(false);

  const pendingUserLocation = useRef(userLocation);
  pendingUserLocation.current = userLocation;
  const pendingClickedLocation = useRef(clickedLocation);
  pendingClickedLocation.current = clickedLocation;
  const pendingInspectedPlace = useRef(inspectedPlace);
  pendingInspectedPlace.current = inspectedPlace;
  const pendingStartLocation = useRef(startLocation);
  pendingStartLocation.current = startLocation;
  const pendingEndLocation = useRef(endLocation);
  pendingEndLocation.current = endLocation;
  const pendingRoute = useRef(route);
  pendingRoute.current = route;

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
  const sendToMap = useCallback((msg: { type: string; lat?: number; lon?: number; zoom?: number; name?: string; markers?: any[]; startLocation?: any; endLocation?: any; route?: any }) => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        const win = iframeRef.current.contentWindow as any;
        if (msg.type === 'SET_MARKERS' && typeof win.updateMarkers === 'function') {
          win.updateMarkers(msg.markers);
        } else if (msg.type === 'SET_USER_LOCATION' && typeof win.updateUserMarker === 'function') {
          win.updateUserMarker(msg.lat, msg.lon);
        } else if (msg.type === 'SET_HEADING' && typeof win.updateUserMarker === 'function') {
          win.updateUserMarker(undefined, undefined, (msg as any).heading);
        } else if (msg.type === 'SET_CENTER' && typeof win.setMapCenter === 'function') {
          win.setMapCenter(msg.lat, msg.lon, msg.zoom);
        } else if (msg.type === 'SET_CLICKED_LOCATION' && typeof win.updateClickedMarker === 'function') {
          win.updateClickedMarker(msg.lat, msg.lon);
        } else if (msg.type === 'CLEAR_CLICKED_LOCATION' && typeof win.clearClickedMarker === 'function') {
          win.clearClickedMarker();
        } else if (msg.type === 'SET_INSPECTED_PLACE' && typeof win.updateInspectedPlaceMarker === 'function') {
          win.updateInspectedPlaceMarker(msg.lat, msg.lon, msg.name);
        } else if (msg.type === 'CLEAR_INSPECTED_PLACE' && typeof win.clearInspectedPlaceMarker === 'function') {
          win.clearInspectedPlaceMarker();
        } else if (msg.type === 'SET_ENDPOINTS' && typeof win.updateEndpoints === 'function') {
          win.updateEndpoints(msg.startLocation, msg.endLocation);
        } else if (msg.type === 'SET_ROUTE' && typeof win.updateRoute === 'function') {
          win.updateRoute(msg.route);
        }
      } catch {
        // Fallback or cross-origin boundary
      }
      try {
        iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), '*');
      } catch {}
    } else if (Platform.OS !== 'web' && webViewRef.current) {
      if (msg.type === 'SET_MARKERS') {
        const js = `if (typeof updateMarkers === 'function') { updateMarkers(${JSON.stringify(msg.markers || [])}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_USER_LOCATION') {
        const js = `if (typeof updateUserMarker === 'function') { updateUserMarker(${msg.lat}, ${msg.lon}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_HEADING') {
        const js = `if (typeof updateUserMarker === 'function') { updateUserMarker(undefined, undefined, ${(msg as any).heading}); } true;`;
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
      } else if (msg.type === 'SET_INSPECTED_PLACE') {
        const js = `if (typeof updateInspectedPlaceMarker === 'function') { updateInspectedPlaceMarker(${msg.lat}, ${msg.lon}, ${JSON.stringify(msg.name || '')}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'CLEAR_INSPECTED_PLACE') {
        const js = `if (typeof clearInspectedPlaceMarker === 'function') { clearInspectedPlaceMarker(); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_ENDPOINTS') {
        const js = `if (typeof updateEndpoints === 'function') { updateEndpoints(${JSON.stringify(msg.startLocation || null)}, ${JSON.stringify(msg.endLocation || null)}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_ROUTE') {
        const js = `if (typeof updateRoute === 'function') { updateRoute(${JSON.stringify(msg.route || null)}); } true;`;
        webViewRef.current.injectJavaScript(js);
      }
    }
  }, []);

  useEffect(() => {
    return subscribeHarmonyHeading((h) => {
      sendToMap({ type: 'SET_HEADING', heading: h } as any);
    });
  }, [sendToMap]);

  const markersData = useMemo(() => {
    return findings.map((f, i) => {
      let color = colors.infoBorder;
      if (f.severity === 'blocker') color = colors.blockerBorder;
      else if (f.severity === 'warning') color = isHighContrast ? colors.warningBorder : '#CA8A04';
      else if (f.severity === 'ok') color = colors.okBorder;
      else if (f.severity === 'unknown') color = colors.unknownBorder;

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
          : f.type === 'report'
          ? locale === 'pl' ? 'Zgłoszenie' : locale === 'uk' ? 'Повідомлення' : 'Report'
          : f.type;

      const localizedVal = getLocalizedFactValue(f.fact.value, locale, f.fact.criterion);
      const cleanVal = localizedVal.replace(/\s*\(?wheelchair=[a-z_]+\)?/gi, '').trim();
      const isReport = f.type === 'report';

      const valueText = cleanVal || localizedVal || f.fact.value;
      return {
        index: i + 1,
        type: f.type,
        lat: f.fact.subject.lat,
        lon: f.fact.subject.lon,
        title: isReport ? typeLabel : `${typeLabel}: ${valueText}`,
        short: isReport ? typeLabel : valueText,
        value: valueText,
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
    if (pendingInspectedPlace.current) {
      sendToMap({
        type: 'SET_INSPECTED_PLACE',
        lat: pendingInspectedPlace.current.lat,
        lon: pendingInspectedPlace.current.lon,
        name: pendingInspectedPlace.current.name,
      });
    }
    sendToMap({
      type: 'SET_ENDPOINTS',
      startLocation: pendingStartLocation.current,
      endLocation: pendingEndLocation.current,
    });
    sendToMap({
      type: 'SET_ROUTE',
      route: pendingRoute.current,
    });
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

  // Smooth dynamic inspected place pin update without reloading iframe / WebView
  useEffect(() => {
    if (inspectedPlace) {
      sendToMap({
        type: 'SET_INSPECTED_PLACE',
        lat: inspectedPlace.lat,
        lon: inspectedPlace.lon,
        name: inspectedPlace.name,
      });
    } else {
      sendToMap({
        type: 'CLEAR_INSPECTED_PLACE',
      });
    }
  }, [inspectedPlace, sendToMap]);

  // Smooth dynamic endpoint markers update (A & B) without reloading iframe / WebView
  useEffect(() => {
    if (!isMapLoaded.current) return;
    sendToMap({
      type: 'SET_ENDPOINTS',
      startLocation,
      endLocation,
    });
  }, [startLocation, endLocation, sendToMap]);

  // Smooth dynamic route polyline update without reloading iframe / WebView
  useEffect(() => {
    if (!isMapLoaded.current) return;
    sendToMap({
      type: 'SET_ROUTE',
      route,
    });
  }, [route, sendToMap]);

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

  const routeSignature = route
    ? `${route.lengthMetres}:${route.coordinates.length}:${route.coordinates[0]?.join(',') ?? ''}:${route.coordinates[route.coordinates.length - 1]?.join(',') ?? ''}:${(route.surfaceSpans ?? []).map((span) => `${span.tone}:${span.coordinates.length}`).join('|')}`
    : 'none';
  const markerSignature = markersData.reduce((hash, marker) => {
    const lat = Math.round((marker.lat || 0) * 1e5);
    const lon = Math.round((marker.lon || 0) * 1e5);
    return (hash + lat + lon + marker.severity.length + marker.type.length) | 0;
  }, markersData.length);
  const startSignature = startLocation
    ? `${startLocation.lat},${startLocation.lon},${startLocation.name}`
    : '';
  const endSignature = endLocation ? `${endLocation.lat},${endLocation.lon},${endLocation.name}` : '';
  const inspectedSignature = inspectedPlace ? `${inspectedPlace.lat},${inspectedPlace.lon},${inspectedPlace.name}` : '';
  // HarmonyOS ArkWeb ignores later srcdoc updates and drops postMessage into that
  // frame, so each new route or barrier set mounts a fresh document that already
  // contains the pins.
  const mapDocumentKey = `${routeSignature}:${markerSignature}:${startSignature}:${endSignature}:${inspectedSignature}`;

  // htmlContent is memoized so it does NOT reload on userLocation updates
  const htmlContent = useMemo(() => {
    const okRouteColor = isHighContrast ? '#42A5F5' : colors.accent;
    const otherRouteColor = isHighContrast ? colors.warningBorder : '#CA8A04';

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
      border-width: ${Math.max(2, Math.round(3 * iconScale))}px;
      border-style: solid;
      width: ${customMarkerSize}px;
      height: ${customMarkerSize}px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.38);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: 2px;
      transition: transform 0.15s ease-out;
    }
    .custom-marker-label {
      position: absolute;
      left: ${customMarkerSize + 2}px;
      top: 6px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 1px 5px;
      font: 700 11px/1.3 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
      color: #0f172a;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.28);
      pointer-events: none;
    }
    .endpoint-marker {
      background-color: ${colors.okBorder};
      color: #FFFFFF;
      border: ${endpointBorder}px solid #FFFFFF;
      border-radius: 50%;
      font-weight: 800;
      text-align: center;
      line-height: ${endpointLineHeight}px;
      font-size: ${endpointFontSize}px;
      width: ${endpointMarkerSize}px !important;
      height: ${endpointMarkerSize}px !important;
      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
      z-index: 10000 !important;
    }
    .endpoint-marker.start {
      background-color: ${colors.okBorder};
    }
    .endpoint-marker.destination {
      background-color: ${colors.blockerBorder};
    }
    .user-location-marker {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${userMarkerSize}px !important;
      height: ${userMarkerSize}px !important;
    }
    .user-dot {
      width: ${userDotSize}px;
      height: ${userDotSize}px;
      background-color: #007AFF;
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      position: absolute;
      z-index: 2;
    }
    .user-pulse {
      position: absolute;
      width: ${userMarkerSize}px;
      height: ${userMarkerSize}px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.35);
      animation: user-pulse-anim 2s infinite ease-out;
      z-index: 1;
    }
    .user-heading {
      position: absolute;
      top: -8px;
      left: 7px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 12px solid #007AFF;
      transform-origin: 6px 21px;
      transition: transform 0.2s ease-out;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
      z-index: 3;
    }
    @keyframes user-pulse-anim {
      0% { transform: scale(0.6); opacity: 0.9; }
      70% { transform: scale(1.7); opacity: 0; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    .clicked-location-marker {
      width: ${clickedPinWidth}px;
      height: ${clickedPinHeight}px;
      position: relative;
      background: transparent !important;
      border: none !important;
    }
    .clicked-pin-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: ${clickedPinWidth}px;
      height: ${clickedPinHeight}px;
      filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));
      z-index: 2;
      pointer-events: none;
    }
    .clicked-pin-pulse {
      position: absolute;
      top: ${clickedPinHeight}px;
      left: ${clickedPinAnchorX}px;
      width: ${Math.round(22 * iconScale)}px;
      height: ${Math.round(22 * iconScale)}px;
      margin-top: -${Math.round(11 * iconScale)}px;
      margin-left: -${Math.round(11 * iconScale)}px;
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
      font-size: ${fontSize(13)}px;
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

    var routeLayer = L.layerGroup().addTo(map);
    var endpointsLayer = L.layerGroup().addTo(map);

    function renderEndpoints(startLoc, endLoc) {
      if (!map || !endpointsLayer) return;
      endpointsLayer.clearLayers();

      if (startLoc && typeof startLoc.lat === 'number' && typeof startLoc.lon === 'number') {
        var startIcon = L.divIcon({
          className: 'endpoint-marker start',
          html: 'A',
          iconSize: [${endpointMarkerSize}, ${endpointMarkerSize}],
          iconAnchor: [${endpointMarkerAnchor}, ${endpointMarkerAnchor}]
        });
        var startPopupLabel = ${JSON.stringify(t(locale, 'from') || 'Start')};
        var startFallback = ${JSON.stringify(locale === 'pl' ? 'Początek trasy' : locale === 'uk' ? 'Початок маршруту' : 'Start')};
        L.marker([startLoc.lat, startLoc.lon], { icon: startIcon, zIndexOffset: 10000 }).addTo(endpointsLayer)
          .bindPopup('<b>' + startPopupLabel + ':</b> ' + (startLoc.name || startFallback));
      }

      if (endLoc && typeof endLoc.lat === 'number' && typeof endLoc.lon === 'number') {
        var endIcon = L.divIcon({
          className: 'endpoint-marker destination',
          html: 'B',
          iconSize: [${endpointMarkerSize}, ${endpointMarkerSize}],
          iconAnchor: [${endpointMarkerAnchor}, ${endpointMarkerAnchor}]
        });
        var endPopupLabel = ${JSON.stringify(t(locale, 'to') || (locale === 'pl' ? 'Cel' : locale === 'uk' ? 'Ціль' : 'Destination'))};
        var endFallback = ${JSON.stringify(locale === 'pl' ? 'Koniec trasy' : locale === 'uk' ? 'Кінець маршруту' : 'Destination')};
        L.marker([endLoc.lat, endLoc.lon], { icon: endIcon, zIndexOffset: 10000 }).addTo(endpointsLayer)
          .bindPopup('<b>' + endPopupLabel + ':</b> ' + (endLoc.name || endFallback));
      }
    }

    function renderRoute(routeData) {
      if (!map || !routeLayer) return;
      routeLayer.clearLayers();
      if (!routeData || !Array.isArray(routeData.coordinates) || routeData.coordinates.length === 0) {
        return;
      }
      var coords = routeData.coordinates.map(function(pt) { return [pt[1], pt[0]]; });
      L.polyline(coords, { color: '#FFFFFF', weight: 8, opacity: 0.95 }).addTo(routeLayer);

      if (Array.isArray(routeData.surfaceSpans) && routeData.surfaceSpans.length > 0) {
        routeData.surfaceSpans.forEach(function(span) {
          var isWarning = span.tone === 'other';
          var color = isWarning ? '${otherRouteColor}' : '${okRouteColor}';
          var polyOpts = {
            color: color,
            weight: isWarning ? 6 : 5,
            opacity: 0.95
          };
          if (isWarning) {
            polyOpts.dashArray = '8, 8';
          }
          var spanCoords = (span.coordinates || []).map(function(pt) { return [pt[1], pt[0]]; });
          L.polyline(spanCoords, polyOpts).addTo(routeLayer);
        });
      } else {
        L.polyline(coords, { color: '${colors.accent}', weight: 5, opacity: 0.95 }).addTo(routeLayer);
      }
      map.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
    }

    window.updateEndpoints = renderEndpoints;
    window.updateRoute = renderRoute;
    renderEndpoints(${JSON.stringify(startPin)}, ${JSON.stringify(endPin)});
    renderRoute(${JSON.stringify(route ? { coordinates: route.coordinates, surfaceSpans: route.surfaceSpans } : null)});

    function getObstacleSvgIcon(type, color) {
      var sWidth = "${obstacleStrokeWidth}";
      var svgW = "${obstacleSvgSize}";
      var svgH = "${obstacleSvgSize}";
      if (type === 'steps') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 5h-5v5h-5v5H6v5H3" />' +
          '</svg>';
      }
      if (type === 'kerb') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 17h6V7h12" />' +
          '<line x1="9" y1="7" x2="9" y2="17" stroke-width="3.5" />' +
          '</svg>';
      }
      if (type === 'surface') {
        // Nawierzchnia / droga: perspektywa jezdni z krawędziami i linią przerywaną
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M4 21L8 3" />' +
          '<path d="M20 21L16 3" />' +
          '<line x1="12" y1="4" x2="12" y2="7" stroke-width="2" />' +
          '<line x1="12" y1="11" x2="12" y2="14" stroke-width="2" />' +
          '<line x1="12" y1="18" x2="12" y2="21" stroke-width="2" />' +
          '</svg>';
      }
      if (type === 'wheelchair') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="5" r="2.5" />' +
          '<path d="M9 19a5 5 0 1 0 5-5H9v-5h4" />' +
          '</svg>';
      }
      if (type === 'incline') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 19h18L3 8v11z" fill="' + color + '" fill-opacity="0.18" />' +
          '<path d="M14 6h7v7" />' +
          '<path d="M21 6L10 17" />' +
          '</svg>';
      }
      if (type === 'width') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<line x1="3" y1="4" x2="3" y2="20" stroke-width="2.6" />' +
          '<line x1="21" y1="4" x2="21" y2="20" stroke-width="2.6" />' +
          '<path d="M3 12h6m-2-3l3 3-3 3" />' +
          '<path d="M21 12h-6m2-3l-3 3 3 3" />' +
          '</svg>';
      }
      if (type === 'report') {
        return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M5 21V4" />' +
          '<path d="M5 4h12l-2.5 4L17 12H5" fill="' + color + '" fill-opacity="0.2" />' +
          '</svg>';
      }
      return '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="9" />' +
        '<line x1="12" y1="8" x2="12" y2="12" stroke-width="2.5" />' +
        '<circle cx="12" cy="16" r="0.8" fill="' + color + '" />' +
        '</svg>';
    }

    var markersLayer = L.layerGroup().addTo(map);

    function escHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderMarkers(markersList) {
      if (!map || !markersLayer) return;
      markersLayer.clearLayers();
      if (!Array.isArray(markersList)) return;

      var seenAt = {};
      markersList.forEach(function(m) {
        if (typeof m.lat !== 'number' || typeof m.lon !== 'number') return;
        var pileKey = m.lat.toFixed(5) + ',' + m.lon.toFixed(5);
        var pile = seenAt[pileKey] || 0;
        seenAt[pileKey] = pile + 1;
        var lat = m.lat + pile * 0.00004;
        var lon = m.lon + pile * 0.00004;
        var iconSvg = getObstacleSvgIcon(m.type, m.color);
        var label = escHtml(m.short || m.value || '');
        var isWarning = m.severity === 'warning';
        var badgeBg = isWarning ? '#FEF9C3' : '#FFFFFF';
        var icon = L.divIcon({
          className: 'custom-marker',
          html: '<div class="custom-marker-badge" style="background-color:' + badgeBg + '; border-color:' + m.color + '; color:' + m.color + ';" title="' + escHtml(m.title) + '">' + iconSvg + '</div>' +
            (label ? '<div class="custom-marker-label" style="border-color:' + m.color + '; color:' + m.color + ';">' + label + '</div>' : ''),
          iconSize: [${customMarkerSize}, ${customMarkerSize}],
          iconAnchor: [${customMarkerAnchor}, ${customMarkerAnchor}]
        });

        var statusText = m.severity === 'blocker' ? '${t(locale, 'severityBlocker')}' : m.severity === 'warning' ? '${t(locale, 'severityWarning')}' : m.severity === 'ok' ? '${t(locale, 'severityOk')}' : m.severity;
        var statusBg = m.severity === 'blocker' ? '${colors.blockerBg}' : m.severity === 'warning' ? '${colors.warningBg}' : m.severity === 'ok' ? '${colors.okBg}' : '${colors.unknownBg}';
        var statusColor = m.severity === 'blocker' ? '${colors.blockerText}' : m.severity === 'warning' ? '${colors.warningText}' : m.severity === 'ok' ? '${colors.okText}' : '${colors.unknownText}';

        var popupHtml = '<div style="min-width: 170px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
          '<div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px; color: #0f172a;">' + escHtml(m.title) + '</div>' +
          '<div style="font-size: 12px; margin-bottom: 6px; color: #334155; line-height: 1.35;">' + escHtml(m.value) + '</div>' +
          '<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + ';">' + statusText + '</span>' +
          '</div>';

        var marker = L.marker([lat, lon], { icon: icon }).addTo(markersLayer);
        marker.bindPopup(popupHtml);
      });
    }

    window.updateMarkers = renderMarkers;
    if (window._pendingMarkers) {
      renderMarkers(window._pendingMarkers);
      window._pendingMarkers = null;
    } else {
      renderMarkers(${JSON.stringify(markersData)});
    }

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(JSON.stringify({ type: 'MAP_READY' }), '*');
      }
    } catch (e) {}

    var userMarker = null;
    window._currentHeading = null;

    window.updateUserMarker = function(lat, lon, heading) {
      if (!map) return;
      if (typeof heading === 'number') {
        window._currentHeading = heading;
      }
      var currentHeading = window._currentHeading;
      var headingHtml = (typeof currentHeading === 'number') ? '<div class="user-heading" style="transform: rotate(' + currentHeading + 'deg);"></div>' : '';
      var markerHtml = '<div class="user-pulse"></div><div class="user-dot"></div>' + headingHtml;

      if (userMarker) {
        if (typeof lat === 'number' && typeof lon === 'number') {
          userMarker.setLatLng([lat, lon]);
        }
        var elem = userMarker.getElement();
        if (elem) {
          elem.innerHTML = markerHtml;
        }
      } else if (typeof lat === 'number' && typeof lon === 'number') {
        var userIcon = L.divIcon({
          className: 'user-location-marker',
          html: markerHtml,
          iconSize: [${userMarkerSize}, ${userMarkerSize}],
          iconAnchor: [${userMarkerAnchor}, ${userMarkerAnchor}]
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
        '<svg width="${clickedPinWidth}" height="${clickedPinHeight}" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
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
          iconSize: [${clickedPinWidth}, ${clickedPinHeight}],
          iconAnchor: [${clickedPinAnchorX}, ${clickedPinAnchorY}]
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

    var inspectedMarker = null;
    var inspectedSvgIconHtml = '<div class="clicked-pin-pulse" style="background: rgba(0, 79, 147, 0.4);"></div>' +
      '<div class="clicked-pin-icon">' +
        '<svg width="${clickedPinWidth}" height="${clickedPinHeight}" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
          '<path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.8 10.8 29.1 11.26 29.5C11.68 29.87 12.32 29.87 12.74 29.5C13.2 29.1 24 19.8 24 12C24 5.37258 18.6274 0 12 0Z" fill="${colors.accent}"/>' +
          '<circle cx="12" cy="11" r="5.2" fill="#FFFFFF"/>' +
          '<circle cx="12" cy="11" r="2.8" fill="${colors.accent}"/>' +
        '</svg>' +
      '</div>';

    window.updateInspectedPlaceMarker = function(lat, lon, name) {
      if (!map) return;
      var label = escHtml(name || '');
      var popupContent = '<div style="min-width: 140px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
        '<div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">' + (label || ${JSON.stringify(t(locale, 'pointOnMap'))}) + '</div>' +
        '<div style="font-size: 11px; color: #64748b;">' + lat.toFixed(5) + ', ' + lon.toFixed(5) + '</div>' +
        '</div>';

      if (inspectedMarker) {
        inspectedMarker.setLatLng([lat, lon]);
        inspectedMarker.setPopupContent(popupContent);
      } else {
        var inspectedIcon = L.divIcon({
          className: 'clicked-location-marker',
          html: inspectedSvgIconHtml + (label ? '<div class="custom-marker-label" style="border-color:${colors.accent}; color:${colors.accent}; top:-22px; left:-20px;">' + label + '</div>' : ''),
          iconSize: [${clickedPinWidth}, ${clickedPinHeight}],
          iconAnchor: [${clickedPinAnchorX}, ${clickedPinAnchorY}]
        });
        inspectedMarker = L.marker([lat, lon], {
          icon: inspectedIcon,
          zIndexOffset: 980
        }).addTo(map).bindPopup(popupContent);
      }
    };

    window.clearInspectedPlaceMarker = function() {
      if (inspectedMarker && map) {
        map.removeLayer(inspectedMarker);
        inspectedMarker = null;
      }
    };

    var initialInspected = ${JSON.stringify(inspectedPlace ? { name: inspectedPlace.name, lat: inspectedPlace.lat, lon: inspectedPlace.lon } : null)};
    if (initialInspected && typeof initialInspected.lat === 'number' && typeof initialInspected.lon === 'number') {
      window.updateInspectedPlaceMarker(initialInspected.lat, initialInspected.lon, initialInspected.name);
    }

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
          if (typeof window.updateMarkers === 'function') {
            window.updateMarkers(data.markers);
          } else {
            window._pendingMarkers = data.markers;
          }
        } else if (data.type === 'SET_CENTER') {
          window.setMapCenter(data.lat, data.lon, data.zoom);
        } else if (data.type === 'SET_USER_LOCATION') {
          window.updateUserMarker(data.lat, data.lon, data.heading);
        } else if (data.type === 'SET_HEADING') {
          window.updateUserMarker(undefined, undefined, data.heading);
        } else if (data.type === 'SET_CLICKED_LOCATION') {
          window.updateClickedMarker(data.lat, data.lon);
        } else if (data.type === 'CLEAR_CLICKED_LOCATION') {
          window.clearClickedMarker();
        } else if (data.type === 'SET_ENDPOINTS') {
          window.updateEndpoints(data.startLocation, data.endLocation);
        } else if (data.type === 'SET_ROUTE') {
          window.updateRoute(data.route);
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
    mapDocumentKey,
    zoom,
    tileUrl,
    tileAttribution,
    colors.accent,
    isHighContrast,
    locale,
    isPickingMode,
    isGeoportal,
    iconScale,
    fontSize,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;
        if (data.type === 'MAP_READY') {
          isMapLoaded.current = true;
          flushPendingUpdates();
        } else if (data.type === 'MAP_CLICK' && onMapClick) {
          onMapClick({ lat: data.lat, lon: data.lon });
        } else if (data.type === 'MAP_MOVE_END') {
          currentPositionRef.current = { lat: data.lat, lon: data.lon, zoom: data.zoom };
        }
      } catch {}
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onMapClick, flushPendingUpdates]);

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
          key={mapDocumentKey}
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

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

export interface MapViewProps {
  route?: WalkingRoute | null;
  findings?: RouteFinding[];
  center?: { lat: number; lon: number };
  zoom?: number;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  startLocation?: { name?: string; lat: number; lon: number };
  endLocation?: { name?: string; lat: number; lon: number };
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
  const pendingCenter = useRef(center);
  pendingCenter.current = center;

  let defaultLat = 50.0619;
  let defaultLon = 19.9373;

  if (center) {
    defaultLat = center.lat;
    defaultLon = center.lon;
  } else if (userLocation) {
    defaultLat = userLocation.lat;
    defaultLon = userLocation.lon;
  } else if (route && route.coordinates.length > 0) {
    const midIdx = Math.floor(route.coordinates.length / 2);
    defaultLon = route.coordinates[midIdx]![0];
    defaultLat = route.coordinates[midIdx]![1];
  }

  // Reliable cross-platform message dispatch to the active Leaflet map
  const sendToMap = useCallback((msg: { type: string; lat: number; lon: number; zoom?: number }) => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      try {
        const win = iframeRef.current.contentWindow as any;
        if (msg.type === 'SET_USER_LOCATION' && typeof win.updateUserMarker === 'function') {
          win.updateUserMarker(msg.lat, msg.lon);
          return;
        }
        if (msg.type === 'SET_CENTER' && typeof win.setMapCenter === 'function') {
          win.setMapCenter(msg.lat, msg.lon, msg.zoom);
          return;
        }
      } catch {
        // Fallback to postMessage
      }
      iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), '*');
    } else if (Platform.OS !== 'web' && webViewRef.current) {
      if (msg.type === 'SET_USER_LOCATION') {
        const js = `if (typeof updateUserMarker === 'function') { updateUserMarker(${msg.lat}, ${msg.lon}); } true;`;
        webViewRef.current.injectJavaScript(js);
      } else if (msg.type === 'SET_CENTER') {
        const js = `if (typeof setMapCenter === 'function') { setMapCenter(${msg.lat}, ${msg.lon}, ${msg.zoom || 16}); } true;`;
        webViewRef.current.injectJavaScript(js);
      }
    }
  }, []);

  const flushPendingUpdates = useCallback(() => {
    isMapLoaded.current = true;
    if (pendingUserLocation.current) {
      sendToMap({
        type: 'SET_USER_LOCATION',
        lat: pendingUserLocation.current.lat,
        lon: pendingUserLocation.current.lon,
      });
    }
    if (pendingCenter.current) {
      sendToMap({
        type: 'SET_CENTER',
        lat: pendingCenter.current.lat,
        lon: pendingCenter.current.lon,
        zoom,
      });
    }
  }, [sendToMap, zoom]);

  // Smooth dynamic user marker update without reloading iframe / WebView
  useEffect(() => {
    if (!userLocation) return;
    sendToMap({
      type: 'SET_USER_LOCATION',
      lat: userLocation.lat,
      lon: userLocation.lon,
    });
  }, [userLocation, sendToMap]);

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

    const markersData = findings.map((f, i) => {
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
          : f.type;

      return {
        index: i + 1,
        lat: f.fact.subject.lat,
        lon: f.fact.subject.lon,
        title: `#${i + 1}${distLabel}: ${typeLabel}`,
        value: f.fact.value,
        severity: f.severity,
        color,
      };
    });

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
      font-weight: 800;
      text-align: center;
      line-height: 22px;
      font-size: 11px;
      width: 28px;
      height: 28px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.38);
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .endpoint-marker {
      background-color: #005CA9;
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
    var initialZoom = ${zoom};
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
        initialZoom = (${zoom} > 12) ? Math.min(12, Math.max(0, ${zoom} - 5)) : ${zoom};
      } catch (e) {
        console.warn('Failed to initialize EPSG:2180 CRS, falling back to standard WebMercator:', e);
      }
    }

    var map = L.map('map', mapOptions).setView([${defaultLat}, ${defaultLon}], initialZoom);

    if (isGeoportal && map.options.crs && map.options.crs.code === 'EPSG:2180') {
      var geoportalLayer = L.tileLayer(
        'https://mapy.geoportal.gov.pl/wss/service/WMTS/guest/wmts/BDOT10k-BDOO?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BDOT10k-BDOO&STYLE=default&TILEMATRIXSET=EPSG:2180&TILEMATRIX=EPSG:2180:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png',
        {
          minZoom: 0,
          maxZoom: 12,
          tileSize: 512,
          attribution: '${tileAttribution}'
        }
      );
      geoportalLayer.addTo(map);
    } else {
      L.tileLayer('${tileUrl}', {
        maxZoom: 19,
        attribution: '${tileAttribution}'
      }).addTo(map);
    }

    var routeCoords = ${JSON.stringify(routeGeoJsonCoords)};
    if (routeCoords.length > 0) {
      var routeLineBg = L.polyline(routeCoords, { color: '#FFFFFF', weight: 8, opacity: 0.95 }).addTo(map);
      var routeLine = L.polyline(routeCoords, { color: '${colors.accent}', weight: 5, opacity: 0.95 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    var startPin = ${JSON.stringify(startPin)};
    if (startPin && startPin.lat && startPin.lon) {
      var startIcon = L.divIcon({
        className: 'endpoint-marker',
        html: 'A',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([startPin.lat, startPin.lon], { icon: startIcon }).addTo(map)
        .bindPopup('<b>Start:</b> ' + (startPin.name || 'Początek trasy'));
    }

    var endPin = ${JSON.stringify(endPin)};
    if (endPin && endPin.lat && endPin.lon) {
      var endIcon = L.divIcon({
        className: 'endpoint-marker destination',
        html: 'B',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([endPin.lat, endPin.lon], { icon: endIcon }).addTo(map)
        .bindPopup('<b>Cel:</b> ' + (endPin.name || 'Koniec trasy'));
    }

    var markers = ${JSON.stringify(markersData)};
    markers.forEach(function(m) {
      var icon = L.divIcon({
        className: 'custom-marker',
        html: '<div class="custom-marker-badge" style="border-color:' + m.color + '; color:' + m.color + ';">' + m.index + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      var statusText = m.severity === 'blocker' ? 'Blokada' : m.severity === 'warning' ? 'Ostrzeżenie' : m.severity === 'ok' ? 'Dostępne' : m.severity;
      var statusBg = m.severity === 'blocker' ? '#fee2e2' : m.severity === 'warning' ? '#ffedd5' : m.severity === 'ok' ? '#dcfce7' : '#f1f5f9';
      var statusColor = m.severity === 'blocker' ? '#b91c1c' : m.severity === 'warning' ? '#c2410c' : m.severity === 'ok' ? '#15803d' : '#475569';

      var popupHtml = '<div style="min-width: 170px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">' +
        '<div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px; color: #0f172a;">' + m.title + '</div>' +
        '<div style="font-size: 12px; margin-bottom: 6px; color: #334155; line-height: 1.35;">' + m.value + '</div>' +
        '<span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + ';">' + statusText + '</span>' +
        '</div>';

      var marker = L.marker([m.lat, m.lon], { icon: icon }).addTo(map);
      marker.bindPopup(popupHtml);
    });

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
        userMarker = L.marker([lat, lon], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map).bindPopup('<b>Twoja lokalizacja</b>');
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
      var msg = JSON.stringify({ type: 'MAP_CLICK', lat: e.latlng.lat, lon: e.latlng.lng });
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
        if (data.type === 'SET_CENTER') {
          window.setMapCenter(data.lat, data.lon, data.zoom);
        } else if (data.type === 'SET_USER_LOCATION') {
          window.updateUserMarker(data.lat, data.lon);
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
    findings,
    startLocation,
    endLocation,
    defaultLat,
    defaultLon,
    zoom,
    tileUrl,
    tileAttribution,
    colors.accent,
    colors.infoBorder,
    colors.blockerBorder,
    colors.warningBorder,
    colors.okBorder,
    colors.unknownBorder,
    locale,
    isPickingMode,
    isGeoportal,
  ]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !onMapClick) return;
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'MAP_CLICK') {
          onMapClick({ lat: data.lat, lon: data.lon });
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
              if (data && data.type === 'MAP_CLICK' && onMapClick) {
                onMapClick({ lat: data.lat, lon: data.lon });
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

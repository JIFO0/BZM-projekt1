import {
  MAPY_ATTRIBUTION,
  OSM_ATTRIBUTION,
  type RouteFinding,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
}: MapViewProps) {
  const { colors, isHighContrast, locale } = useSession();

  let defaultLat = 50.0619;
  let defaultLon = 19.9373;

  if (center) {
    defaultLat = center.lat;
    defaultLon = center.lon;
  } else if (route && route.coordinates.length > 0) {
    const midIdx = Math.floor(route.coordinates.length / 2);
    defaultLon = route.coordinates[midIdx]![0];
    defaultLat = route.coordinates[midIdx]![1];
  }

  const routeGeoJsonCoords = route ? route.coordinates.map(([lon, lat]) => [lat, lon]) : [];

  const markersData = findings.map((f, i) => {
    let color = colors.infoBorder;
    if (f.severity === 'blocker') color = colors.blockerBorder;
    else if (f.severity === 'warning') color = colors.warningBorder;
    else if (f.severity === 'ok') color = colors.okBorder;
    else if (f.severity === 'unknown') color = colors.unknownBorder;

    return {
      index: i + 1,
      lat: f.fact.subject.lat,
      lon: f.fact.subject.lon,
      title: `#${i + 1} (${f.distanceFromStartMetres} m): ${f.type}`,
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

  const mapyApiKey = process.env.EXPO_PUBLIC_MAPY_API_KEY;
  const hasMapyKey = Boolean(
    mapyApiKey &&
    mapyApiKey !== 'replace-with-mapy-api-key' &&
    mapyApiKey.trim().length > 5
  );

  const tileUrl = hasMapyKey
    ? `https://api.mapy.com/v1/maptiles/${city.mapy?.tileMapset ?? 'basic'}/256/{z}/{x}/{y}?apikey=${mapyApiKey}`
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = hasMapyKey
    ? MAPY_ATTRIBUTION.attribution
    : OSM_ATTRIBUTION.attribution;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e3df; overflow: hidden; }
    .custom-marker {
      background-color: white;
      border-radius: 50%;
      border: 3px solid;
      color: black;
      font-weight: bold;
      text-align: center;
      line-height: 22px;
      font-size: 11px;
      width: 26px !important;
      height: 26px !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.35);
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
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${defaultLat}, ${defaultLon}], ${zoom});

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${tileAttribution}'
    }).addTo(map);

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
        html: '<div style="border-color:' + m.color + '; color:' + m.color + ';">' + m.index + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      var marker = L.marker([m.lat, m.lon], { icon: icon }).addTo(map);
      marker.bindPopup('<b>' + m.title + '</b><br/>' + m.value + '<br/><i>Status: ' + m.severity + '</i>');
    });

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
          title="Mapa trasy"
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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

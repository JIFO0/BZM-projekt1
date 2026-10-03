import {
  MAPY_ATTRIBUTION,
  OSM_ATTRIBUTION,
  type RouteFinding,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useSession } from '@/state/session';

interface MapViewProps {
  route?: WalkingRoute | null;
  findings?: RouteFinding[];
  center?: { lat: number; lon: number };
  zoom?: number;
}

export function MapView({ route, findings = [], center, zoom = 15 }: MapViewProps) {
  const { colors, isHighContrast } = useSession();

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

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e5e3df; }
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
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    }
    .leaflet-control-attribution {
      font-size: 10px !important;
      background: rgba(255, 255, 255, 0.85) !important;
      padding: 3px 6px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([${defaultLat}, ${defaultLon}], ${zoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '${OSM_ATTRIBUTION.attribution} | ${MAPY_ATTRIBUTION.name}'
    }).addTo(map);

    var routeCoords = ${JSON.stringify(routeGeoJsonCoords)};
    if (routeCoords.length > 0) {
      var routeLineBg = L.polyline(routeCoords, { color: '#FFFFFF', weight: 8, opacity: 0.95 }).addTo(map);
      var routeLine = L.polyline(routeCoords, { color: '${colors.accent}', weight: 5, opacity: 0.95 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
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
  </script>
</body>
</html>
  `;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
      ]}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 290,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  webview: {
    flex: 1,
  },
});

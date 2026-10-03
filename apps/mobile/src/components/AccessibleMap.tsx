import { useState, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus, Minus, X, Prohibit, Warning } from 'phosphor-react-native';
import type { AccessibleRouteResult, RouteBarrier } from '@krakow-bez-barier/sources';
import { useSession } from '@/state/session';
import type { Locale } from '@/i18n/strings';

interface AccessibleMapProps {
  route: AccessibleRouteResult;
  locale: Locale;
  onSelectBarrier?: (barrier: RouteBarrier) => void;
}

export function AccessibleMap({ route, locale, onSelectBarrier }: AccessibleMapProps) {
  const { colors } = useSession();
  const [zoomOffset, setZoomOffset] = useState<number>(0);
  const [selectedBarrierId, setSelectedBarrierId] = useState<string | null>(null);

  const coords = route.geometry.coordinates;

  // Calculate bounding box and center
  const { minLon, maxLon, minLat, maxLat, centerLon, centerLat } = useMemo(() => {
    if (coords.length === 0) {
      return { minLon: 19.937, maxLon: 19.937, minLat: 50.061, maxLat: 50.061, centerLon: 19.937, centerLat: 50.061 };
    }
    let minX = coords[0][0];
    let maxX = coords[0][0];
    let minY = coords[0][1];
    let maxY = coords[0][1];
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return {
      minLon: minX,
      maxLon: maxX,
      minLat: minY,
      maxLat: maxY,
      centerLon: (minX + maxX) / 2,
      centerLat: (minY + maxY) / 2,
    };
  }, [coords]);

  // Determine base zoom level
  const baseZoom = useMemo(() => {
    const dLon = Math.max(0.001, maxLon - minLon);
    const dLat = Math.max(0.001, maxLat - minLat);
    const maxDelta = Math.max(dLon, dLat);
    if (maxDelta > 0.05) return 13;
    if (maxDelta > 0.02) return 14;
    if (maxDelta > 0.008) return 15;
    if (maxDelta > 0.003) return 16;
    return 17;
  }, [minLon, maxLon, minLat, maxLat]);

  const zoom = Math.max(12, Math.min(18, baseZoom + zoomOffset));

  // Tile dimensions and coordinates
  const mapWidth = 340;
  const mapHeight = 260;

  const { centerTileX, centerTileY, centerPixelX, centerPixelY } = useMemo(() => {
    const n = Math.pow(2, zoom);
    const x = ((centerLon + 180) / 360) * n;
    const latRad = (centerLat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    return {
      centerTileX: Math.floor(x),
      centerTileY: Math.floor(y),
      centerPixelX: (x - Math.floor(x)) * 256,
      centerPixelY: (y - Math.floor(y)) * 256,
    };
  }, [centerLon, centerLat, zoom]);

  // Generate 3x3 tile grid around center
  const tiles = useMemo(() => {
    const result: { url: string; left: number; top: number; key: string }[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const left = mapWidth / 2 - centerPixelX + dx * 256;
        const top = mapHeight / 2 - centerPixelY + dy * 256;
        result.push({
          url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
          left,
          top,
          key: `${zoom}-${tx}-${ty}`,
        });
      }
    }
    return result;
  }, [centerTileX, centerTileY, centerPixelX, centerPixelY, zoom]);

  // Convert LonLat to map view pixel coordinates
  const projectPoint = (lon: number, lat: number) => {
    const n = Math.pow(2, zoom);
    const x = ((lon + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    const px = mapWidth / 2 + (x - (centerTileX + centerPixelX / 256)) * 256;
    const py = mapHeight / 2 + (y - (centerTileY + centerPixelY / 256)) * 256;
    return { px, py };
  };

  // Screen reader description of the map
  const accessibilityDescription = useMemo(() => {
    const dist = (route.distanceMeters / 1000).toFixed(1);
    const blockers = route.summary.blockerCount;
    const warnings = route.summary.warningCount;
    return locale === 'pl'
      ? `Interaktywna mapa trasy o długości ${dist} kilometra. Znaleziono ${blockers} barier blokujących oraz ${warnings} ostrzeżeń.`
      : `Interactive route map of length ${dist} kilometers. Found ${blockers} blocking barriers and ${warnings} warnings.`;
  }, [route, locale]);

  const startPt = coords.length > 0 ? projectPoint(coords[0][0], coords[0][1]) : null;
  const endPt = coords.length > 0 ? projectPoint(coords[coords.length - 1][0], coords[coords.length - 1][1]) : null;

  return (
    <View style={styles.container}>
      {/* Map display container */}
      <View
        accessibilityRole="image"
        accessibilityLabel={accessibilityDescription}
        style={[styles.mapViewport, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Render OSM tiles */}
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={[styles.tile, { left: tile.left, top: tile.top }]}
            resizeMode="cover"
          />
        ))}

        {/* Route Points / Segments */}
        {coords.map((coord, idx) => {
          if (idx === 0) return null;
          const prev = coords[idx - 1];
          const p1 = projectPoint(prev[0], prev[1]);
          const p2 = projectPoint(coord[0], coord[1]);
          const midX = (p1.px + p2.px) / 2;
          const midY = (p1.py + p2.py) / 2;
          const length = Math.max(2, Math.hypot(p2.px - p1.px, p2.py - p1.py));
          const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px) * (180 / Math.PI);

          return (
            <View
              key={`segment-${idx}`}
              style={[
                styles.routeLine,
                {
                  width: length,
                  left: midX - length / 2,
                  top: midY - 2,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: colors.focus,
                },
              ]}
            />
          );
        })}

        {/* Start Marker */}
        {startPt && (
          <View style={[styles.marker, styles.startMarker, { left: startPt.px - 10, top: startPt.py - 10 }]}>
            <Text style={styles.markerText}>A</Text>
          </View>
        )}

        {/* End Marker */}
        {endPt && (
          <View style={[styles.marker, styles.endMarker, { left: endPt.px - 10, top: endPt.py - 10 }]}>
            <Text style={styles.markerText}>B</Text>
          </View>
        )}

        {/* Barrier Markers */}
        {route.barriers.map((barrier) => {
          const pt = projectPoint(barrier.lon, barrier.lat);
          const isSelected = selectedBarrierId === barrier.id;
          const isBlocker = barrier.severity === 'blocker';
          const isWarning = barrier.severity === 'warning';

          return (
            <Pressable
              key={barrier.id}
              accessibilityRole="button"
              accessibilityLabel={`${barrier.criterion}: ${barrier.value}. ${barrier.message}`}
              onPress={() => {
                setSelectedBarrierId(barrier.id);
                if (onSelectBarrier) onSelectBarrier(barrier);
              }}
              style={[
                styles.barrierMarker,
                {
                  left: pt.px - 12,
                  top: pt.py - 12,
                  backgroundColor: isBlocker ? '#D32F2F' : isWarning ? '#F57C00' : '#546E7A',
                  borderColor: isSelected ? '#FFFFFF' : '#000000',
                },
              ]}
            >
              <View style={styles.barrierInner}>
                {isBlocker ? (
                  <Prohibit size={14} color="#FFFFFF" weight="bold" />
                ) : (
                  <Warning size={14} color="#FFFFFF" weight="bold" />
                )}
              </View>
            </Pressable>
          );
        })}

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locale === 'pl' ? 'Przybliż mapę' : 'Zoom in'}
            onPress={() => setZoomOffset((prev) => Math.min(prev + 1, 3))}
            style={[styles.zoomButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Plus size={16} color={colors.text} weight="bold" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locale === 'pl' ? 'Oddal mapę' : 'Zoom out'}
            onPress={() => setZoomOffset((prev) => Math.max(prev - 1, -3))}
            style={[styles.zoomButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Minus size={16} color={colors.text} weight="bold" />
          </Pressable>
        </View>

        {/* OSM Attribution Watermark */}
        <View style={styles.attributionBadge}>
          <Text style={styles.attributionText}>© OpenStreetMap</Text>
        </View>
      </View>

      {/* Selected Barrier Details Popup */}
      {selectedBarrierId && (() => {
        const item = route.barriers.find((b) => b.id === selectedBarrierId);
        if (!item) return null;
        return (
          <View style={[styles.barrierPopup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.popupHeader}>
              <Text style={[styles.popupTitle, { color: colors.text }]}>
                {item.criterion}: {item.value}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locale === 'pl' ? 'Zamknij szczegóły' : 'Close'}
                onPress={() => setSelectedBarrierId(null)}
              >
                <X size={18} color={colors.muted} weight="bold" />
              </Pressable>
            </View>
            <Text style={[styles.popupMessage, { color: colors.text }]}>{item.message}</Text>
            <Text style={[styles.popupMeta, { color: colors.muted }]}>
              {locale === 'pl' ? 'Odległość od startu' : 'Distance from start'}: {item.distanceFromStartMeters} m | {item.status}
            </Text>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  mapViewport: {
    width: '100%',
    height: 260,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  routeLine: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 20,
  },
  startMarker: {
    backgroundColor: '#2E7D32',
  },
  endMarker: {
    backgroundColor: '#C62828',
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  barrierMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 25,
  },
  barrierInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 6,
    zIndex: 30,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 30,
  },
  attributionText: {
    fontSize: 10,
    color: '#333333',
  },
  barrierPopup: {
    width: '100%',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    gap: 4,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  popupMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  popupMeta: {
    fontSize: 12,
  },
});

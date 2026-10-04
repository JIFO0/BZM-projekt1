import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Polygon, Rect } from 'react-native-svg';

import { useSession } from '@/state/session';

interface KrakowCoatOfArmsProps {
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

/**
 * KrakowCoatOfArms - Oficjalny herb Stołecznego Królewskiego Miasta Krakowa
 * Czysty wektor SVG (react-native-svg). Zero emotikon, profesjonalna heraldyka miejska.
 */
export function KrakowCoatOfArms({ size = 'medium', showTitle = true }: KrakowCoatOfArmsProps) {
  const { colors, isHighContrast, fontSize } = useSession();

  const isSmall = size === 'small';
  const isLarge = size === 'large';
  const width = isSmall ? 32 : isLarge ? 52 : 40;
  const height = isSmall ? 38 : isLarge ? 62 : 48;

  // Heraldic palette (adapts to high contrast)
  const shieldColor = isHighContrast ? colors.surface : '#C62828';
  const borderColor = isHighContrast ? colors.border : '#8E0000';
  const wallColor = isHighContrast ? colors.text : '#FFFFFF';
  const roofColor = colors.accent;
  const goldColor = isHighContrast ? colors.text : '#F59E0B';
  const eagleColor = isHighContrast ? colors.text : '#FFFFFF';
  const gateInterior = isHighContrast ? colors.background : '#1E293B';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Herb Stołecznego Królewskiego Miasta Krakowa: mury ceglane z trzema basztami, korona i orzeł w otwartej bramie"
      style={styles.container}
    >
      <Svg width={width} height={height} viewBox="0 0 100 120">
        {/* Shield outline */}
        <Path
          d="M 10 10 L 90 10 L 90 75 C 90 100, 50 115, 50 115 C 50 115, 10 100, 10 75 Z"
          fill={shieldColor}
          stroke={borderColor}
          strokeWidth="4"
        />

        {/* City Wall & Towers */}
        <G fill={wallColor} stroke={borderColor} strokeWidth="1.5">
          {/* Main wall base */}
          <Rect x="20" y="55" width="60" height="30" />

          {/* Left tower */}
          <Rect x="22" y="32" width="16" height="24" />
          {/* Center tower (taller) */}
          <Rect x="42" y="24" width="16" height="32" />
          {/* Right tower */}
          <Rect x="62" y="32" width="16" height="24" />

          {/* Windows / arrow loops */}
          <Rect x="28" y="38" width="4" height="8" fill={gateInterior} />
          <Rect x="48" y="30" width="4" height="10" fill={gateInterior} />
          <Rect x="68" y="38" width="4" height="8" fill={gateInterior} />
        </G>

        {/* Tower Roofs */}
        <G fill={roofColor} stroke={borderColor} strokeWidth="1">
          {/* Left triangular roof */}
          <Polygon points="20,32 30,16 40,32" />
          {/* Center triangular roof */}
          <Polygon points="40,24 50,8 60,24" />
          {/* Right triangular roof */}
          <Polygon points="60,32 70,16 80,32" />
        </G>

        {/* Crown above center tower */}
        <Polygon
          points="44,8 46,2 48,6 50,0 52,6 54,2 56,8"
          fill={goldColor}
          stroke={borderColor}
          strokeWidth="1"
        />

        {/* Arched Gate Portal */}
        <Path
          d="M 38 85 L 38 65 C 38 56, 62 56, 62 65 L 62 85 Z"
          fill={gateInterior}
          stroke={borderColor}
          strokeWidth="2"
        />

        {/* Heraldic White Eagle Silhouette in Gate */}
        <G fill={eagleColor}>
          {/* Eagle head with crown */}
          <Path d="M 49 61 C 49 59, 52 59, 52 61 L 51 63 Z" />
          <Polygon points="49,59 50,57 51,59 52,57 53,59" fill={goldColor} />
          {/* Eagle wings */}
          <Path d="M 50 63 C 44 62, 41 68, 42 74 C 45 72, 48 71, 50 71 C 52 71, 55 72, 58 74 C 59 68, 56 62, 50 63 Z" />
          {/* Eagle body & tail */}
          <Polygon points="48,70 52,70 53,78 50,81 47,78" />
          {/* Golden beak & talons */}
          <Polygon points="46,76 44,79 48,79" fill={goldColor} />
          <Polygon points="54,76 56,79 52,79" fill={goldColor} />
        </G>
      </Svg>

      {showTitle ? (
        <View style={styles.titles}>
          <Text
            style={[
              styles.cityTitle,
              {
                color: colors.text,
                fontSize: fontSize(isSmall ? 13 : isLarge ? 17 : 14.5),
              },
            ]}
          >
            KRAKÓW
          </Text>
          <Text
            style={[
              styles.citySubtitle,
              {
                color: colors.muted,
                fontSize: fontSize(isSmall ? 9.5 : isLarge ? 11.5 : 10),
              },
            ]}
          >
            MIEJSKI SYSTEM DOSTĘPNOŚCI
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titles: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cityTitle: {
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  citySubtitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

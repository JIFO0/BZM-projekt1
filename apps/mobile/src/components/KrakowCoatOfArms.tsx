import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/state/session';

interface KrakowCoatOfArmsProps {
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

/**
 * 🏛️ KrakowCoatOfArms - Oficjalny herb i emblemat Stołecznego Królewskiego Miasta Krakowa
 * Czysty komponent React Native (brak zewnętrznych bibliotek native),
 * w pełni adaptujący się do trybów wysokiego kontrastu (WCAG 2.2 AAA).
 */
export function KrakowCoatOfArms({ size = 'medium', showTitle = true }: KrakowCoatOfArmsProps) {
  const { colors, isHighContrast, fontSize } = useSession();

  const isSmall = size === 'small';
  const isLarge = size === 'large';
  const emblemWidth = isSmall ? 36 : isLarge ? 56 : 44;
  const emblemHeight = isSmall ? 40 : isLarge ? 64 : 50;

  // Herb colors
  const shieldBg = isHighContrast ? colors.surface : '#C62828'; // Crimson city shield
  const wallColor = isHighContrast ? colors.text : '#E0E0E0'; // White/silver brick wall
  const towerCapColor = isHighContrast ? colors.accent : '#005CA9'; // Kraków Blue roofs
  const eagleColor = isHighContrast ? colors.text : '#FFFFFF';
  const gateBorder = isHighContrast ? colors.border : '#8E0000';
  const borderColor = isHighContrast ? colors.border : '#8E0000';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Herb Stołecznego Królewskiego Miasta Krakowa: mury z trzema basztami i orzeł w bramie"
      style={styles.container}
    >
      {/* Heraldic Shield */}
      <View
        style={[
          styles.shield,
          {
            width: emblemWidth,
            height: emblemHeight,
            backgroundColor: shieldBg,
            borderColor,
          },
        ]}
      >
        {/* Towers row */}
        <View style={styles.towersRow}>
          {/* Left Tower */}
          <View style={styles.towerSide}>
            <View style={[styles.roofSide, { borderBottomColor: towerCapColor }]} />
            <View style={[styles.towerBodySide, { backgroundColor: wallColor }]} />
          </View>

          {/* Center Main Tower (taller) */}
          <View style={styles.towerCenter}>
            <View style={[styles.crownSymbol, { borderColor: isHighContrast ? colors.text : '#FFD700' }]}>
              <Text style={[styles.crownText, { color: isHighContrast ? colors.text : '#FFD700' }]}>👑</Text>
            </View>
            <View style={[styles.roofCenter, { borderBottomColor: towerCapColor }]} />
            <View style={[styles.towerBodyCenter, { backgroundColor: wallColor }]} />
          </View>

          {/* Right Tower */}
          <View style={styles.towerSide}>
            <View style={[styles.roofSide, { borderBottomColor: towerCapColor }]} />
            <View style={[styles.towerBodySide, { backgroundColor: wallColor }]} />
          </View>
        </View>

        {/* City Gate with Eagle */}
        <View style={[styles.gateArch, { borderColor: gateBorder, backgroundColor: isHighContrast ? colors.background : '#1A2332' }]}>
          <Text style={[styles.eagleGlyph, { color: eagleColor, fontSize: isSmall ? 10 : isLarge ? 17 : 13 }]}>
            🦅
          </Text>
        </View>
      </View>

      {showTitle ? (
        <View style={styles.titles}>
          <Text
            style={[
              styles.cityTitle,
              {
                color: colors.text,
                fontSize: fontSize(isSmall ? 13 : isLarge ? 18 : 15),
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
                fontSize: fontSize(isSmall ? 10 : isLarge ? 12 : 11),
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
  shield: {
    borderWidth: 2,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingTop: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  towersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    paddingHorizontal: 2,
  },
  towerSide: {
    alignItems: 'center',
    width: '26%',
  },
  towerCenter: {
    alignItems: 'center',
    width: '34%',
  },
  roofSide: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  roofCenter: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  crownSymbol: {
    marginBottom: -1,
  },
  crownText: {
    fontSize: 7,
    lineHeight: 8,
  },
  towerBodySide: {
    width: '100%',
    height: 10,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  towerBodyCenter: {
    width: '100%',
    height: 14,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  gateArch: {
    width: '58%',
    height: '46%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eagleGlyph: {
    textAlign: 'center',
    lineHeight: 16,
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

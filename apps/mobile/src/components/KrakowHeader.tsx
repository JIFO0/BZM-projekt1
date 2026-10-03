import { StyleSheet, Text, View } from 'react-native';

import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';

interface KrakowHeaderProps {
  onOpenDemo?: () => void;
  onReadScreen?: () => void;
  isSpeaking?: boolean;
}

/**
 * 🏛️ KrakowHeader - Oficjalny nagłówek miejski Krakowa
 * Łączy oficjalną belkę instytucjonalną Gov.pl/Kraków, herb miasta,
 * certyfikację WCAG 2.2 AAA oraz pasek ułatwień dostępu.
 */
export function KrakowHeader({ onOpenDemo, onReadScreen, isSpeaking }: KrakowHeaderProps) {
  const { locale, colors, isHighContrast, fontSize } = useSession();

  return (
    <View style={styles.container}>
      {/* 1. Official Municipal Gov Strip */}
      <View
        style={[
          styles.govStrip,
          {
            backgroundColor: isHighContrast ? colors.background : colors.govBarBg,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.flagSymbol}>
          <View style={styles.flagWhite} />
          <View style={styles.flagBlue} />
        </View>
        <Text
          style={[
            styles.govStripText,
            {
              color: colors.govBarText,
              fontSize: fontSize(10.5),
            },
          ]}
        >
          OFICJALNY PROTOTYP MIEJSKI • MIASTO KRAKÓW
        </Text>
        <View
          style={[
            styles.wcagTag,
            {
              backgroundColor: isHighContrast ? colors.surface : 'rgba(255,255,255,0.18)',
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.wcagTagText,
              {
                color: colors.govBarText,
                fontSize: fontSize(9.5),
              },
            ]}
          >
            WCAG 2.2 AAA
          </Text>
        </View>
      </View>

      {/* 2. Main Title Row with Coat of Arms */}
      <View
        style={[
          styles.mainBar,
          {
            backgroundColor: isHighContrast ? colors.surface : colors.headerBg,
            borderColor: colors.border,
          },
        ]}
      >
        <KrakowCoatOfArms size="small" showTitle={false} />
        <View style={styles.titleColumn}>
          <Text
            accessibilityRole="header"
            style={[
              styles.mainTitle,
              {
                color: colors.headerText,
                fontSize: fontSize(17),
              },
            ]}
          >
            {t(locale, 'appName')}
          </Text>
          <Text
            style={[
              styles.subTitle,
              {
                color: isHighContrast ? colors.text : 'rgba(255,255,255,0.85)',
                fontSize: fontSize(11),
              },
            ]}
          >
            {t(locale, 'krakowGovSub')}
          </Text>
        </View>
      </View>

      {/* 3. Quick Access WCAG Toolbar */}
      <AccessibilityToolbar
        onOpenDemo={onOpenDemo}
        onReadScreen={onReadScreen}
        isSpeaking={isSpeaking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  govStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  flagSymbol: {
    width: 14,
    height: 10,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flagBlue: {
    flex: 1,
    backgroundColor: '#005CA9',
  },
  govStripText: {
    fontWeight: '800',
    letterSpacing: 0.8,
    flex: 1,
  },
  wcagTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  wcagTagText: {
    fontWeight: '900',
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontWeight: '600',
    marginTop: 1,
  },
});

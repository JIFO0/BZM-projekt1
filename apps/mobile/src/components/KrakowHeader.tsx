import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Globe, SpeakerHigh, Stop, Wheelchair, Wrench } from 'phosphor-react-native';

import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export interface KrakowHeaderProps {
  onOpenDemo?: () => void;
  onReadScreen?: () => void;
  isSpeaking?: boolean;
  compact?: boolean;
}

/**
 * KrakowHeader - Oficjalny nagłówek miejski Krakowa
 * W wersji przeglądarkowej zachowuje pełny wygląd (pasek miejski, herb, tytuły, przyciski),
 * a w wersji mobilnej (Platform.OS !== 'web') składa się wyłącznie z paska przycisków funkcyjnych.
 */
export function KrakowHeader({
  onOpenDemo,
  onReadScreen,
  isSpeaking,
  compact,
}: KrakowHeaderProps) {
  const {
    locale,
    setLocale,
    colors,
    isHighContrast,
    fontSize,
    setAccessibilityModalVisible,
    highlightLinks,
    increasedSpacing,
  } = useSession();

  const minTouch = increasedSpacing ? spacing.touchExpanded : spacing.touch - 4;

  const renderButtons = () => (
    <>
      {/* 1. Dedicated Accessibility Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(locale, 'accessibilityHeaderButton')}
        accessibilityHint="Otwiera dedykowane Centrum Ułatwień Dostępności cyfrowej"
        onPress={() => setAccessibilityModalVisible(true)}
        style={[
          styles.a11yBtn,
          {
            backgroundColor: isHighContrast ? colors.accent : '#003865',
            borderColor: isHighContrast ? colors.focus : '#38BDF8',
            borderWidth: isHighContrast ? 2.5 : 1.5,
            borderBottomWidth: highlightLinks ? 4 : isHighContrast ? 2.5 : 1.5,
            minHeight: minTouch,
          },
        ]}
      >
        <Wheelchair
          size={17}
          weight="bold"
          color={isHighContrast ? colors.accentText : '#FFFFFF'}
        />
        <Text
          style={[
            styles.a11yBtnText,
            {
              color: isHighContrast ? colors.accentText : '#FFFFFF',
              fontSize: fontSize(12),
              textDecorationLine: highlightLinks ? 'underline' : 'none',
            },
          ]}
        >
          {t(locale, 'accessibilityMenuBtn')}
        </Text>
      </Pressable>

      {/* 2. Language Toggle */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          locale === 'pl' ? 'Switch language to English' : 'Przełącz język na polski'
        }
        onPress={() => setLocale(locale === 'pl' ? 'en' : 'pl')}
        style={[
          styles.secondaryBtn,
          {
            borderColor: colors.border,
            backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
            minHeight: minTouch,
          },
        ]}
      >
        <Globe
          size={15}
          weight="bold"
          color={isHighContrast ? colors.text : colors.headerText}
        />
        <Text
          style={[
            styles.secondaryBtnText,
            {
              color: isHighContrast ? colors.text : colors.headerText,
              fontSize: fontSize(12),
            },
          ]}
        >
          {locale.toUpperCase()}
        </Text>
      </Pressable>

      {/* 3. Voice Assistance (TTS Lektor) */}
      {onReadScreen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSpeaking ? 'Zatrzymaj lektora' : 'Włącz lektora ekranu'}
          onPress={onReadScreen}
          style={[
            styles.secondaryBtn,
            {
              borderColor: isSpeaking ? '#EF4444' : colors.border,
              backgroundColor: isSpeaking
                ? '#DC2626'
                : isHighContrast
                ? colors.background
                : 'rgba(255,255,255,0.12)',
              minHeight: minTouch,
            },
          ]}
        >
          {isSpeaking ? (
            <Stop size={15} weight="bold" color="#FFFFFF" />
          ) : (
            <SpeakerHigh
              size={15}
              weight="bold"
              color={isHighContrast ? colors.text : colors.headerText}
            />
          )}
          <Text
            style={[
              styles.secondaryBtnText,
              {
                color: isSpeaking
                  ? '#FFFFFF'
                  : isHighContrast
                  ? colors.text
                  : colors.headerText,
                fontSize: fontSize(12),
              },
            ]}
          >
            {isSpeaking ? 'Stop' : 'Lektor'}
          </Text>
        </Pressable>
      ) : null}

      {/* 4. Demo Simulations Trigger */}
      {onOpenDemo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Panel symulacji demonstracyjnych"
          onPress={onOpenDemo}
          style={[
            styles.secondaryBtn,
            {
              borderColor: colors.border,
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
              minHeight: minTouch,
            },
          ]}
        >
          <Wrench
            size={15}
            weight="bold"
            color={isHighContrast ? colors.text : colors.headerText}
          />
          <Text
            style={[
              styles.secondaryBtnText,
              {
                color: isHighContrast ? colors.text : colors.headerText,
                fontSize: fontSize(12),
              },
            ]}
          >
            Demo
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  // Wersja przeglądarkowa zachowuje pełny wygląd instytucjonalny (herb, tytuł, pasek miejski),
  // a wersja mobilna składa się wyłącznie z paska przycisków funkcyjnych.
  const isCompact = compact !== undefined ? compact : Platform.OS !== 'web';

  if (isCompact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: isHighContrast ? colors.surface : colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactScroll}
        >
          {renderButtons()}
        </ScrollView>
      </View>
    );
  }

  // Pełna wersja instytucjonalna (np. na tablety lub desktopy)
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
        <View style={styles.govStripLeft}>
          <View style={styles.flagSymbol}>
            <View style={styles.flagWhite} />
            <View style={styles.flagBlue} />
          </View>
          <Text
            style={[
              styles.govStripText,
              {
                color: colors.govBarText,
                fontSize: fontSize(11),
              },
            ]}
          >
            OFICJALNY PROTOTYP MIEJSKI • MIASTO KRAKÓW
          </Text>
        </View>

        <View
          style={[
            styles.wcagTag,
            {
              backgroundColor: isHighContrast ? colors.surface : 'rgba(255,255,255,0.15)',
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.wcagTagText,
              {
                color: colors.govBarText,
                fontSize: fontSize(10),
              },
            ]}
          >
            WCAG 2.2 AAA
          </Text>
        </View>
      </View>

      {/* 2. Main Institutional Bar */}
      <View
        style={[
          styles.mainBar,
          {
            backgroundColor: isHighContrast ? colors.surface : colors.headerBg,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.titleArea}>
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

        {/* Header Action Buttons */}
        <View style={styles.headerActions}>{renderButtons()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  compactScroll: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  container: {
    width: '100%',
  },
  govStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  govStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
    letterSpacing: 0.6,
  },
  wcagTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  wcagTagText: {
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  a11yBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  a11yBtnText: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 4,
  },
  secondaryBtnText: {
    fontWeight: '700',
  },
});

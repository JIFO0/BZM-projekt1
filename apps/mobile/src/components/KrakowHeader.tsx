import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Gear, PersonArmsSpread } from 'phosphor-react-native';

import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export interface KrakowHeaderProps {
  onOpenDemo?: () => void;
  onReadScreen?: () => void;
  isSpeaking?: boolean;
  compact?: boolean;
  showBack?: boolean;
  backTitle?: string;
  onBack?: () => void;
}

/**
 * KrakowHeader - Nagłówek aplikacji Krakowa
 * W wersji mobilnej (ekrany < 768px):
 *   - Rząd górny: Herb Krakowa + poziomy tytuł "Kraków bez barier" + plakietka WCAG AAA
 *   - Rząd dolny: Przyciski Centrum Dostępności oraz wyboru języka
 * W wersji desktopowej: Pełny pasek miejski z herbem, tytułem i przyciskami w jednym rzędzie.
 */
export function KrakowHeader({
  compact,
  showBack,
  backTitle,
  onBack,
}: KrakowHeaderProps) {
  const { width } = useWindowDimensions();
  const {
    locale,
    colors,
    isHighContrast,
    fontSize,
    setAccessibilityModalVisible,
    highlightLinks,
    increasedSpacing,
    setSettingsModalVisible,
  } = useSession();

  const handleDefaultBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  };

  const resolvedBack = onBack ?? handleDefaultBack;
  const backLabel = backTitle ?? (locale === 'pl' ? 'Wróć do mapy' : 'Back to map');

  const minTouch = increasedSpacing ? spacing.touchExpanded : spacing.touch - 4;
  const isMobile = compact !== undefined ? compact : (width > 0 ? width < 768 : Platform.OS !== 'web');

  const renderButtons = (mobileMode: boolean = isMobile) => (
    <>
      {/* 0. Optional Back to Map Button (desktop only) */}
      {showBack && !mobileMode ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={resolvedBack}
          style={[
            styles.secondaryBtn,
            {
              borderColor: isHighContrast ? colors.accent : '#38BDF8',
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.22)',
              minHeight: minTouch,
            },
          ]}
        >
          <ArrowLeft
            size={16}
            weight="bold"
            color={isHighContrast ? colors.text : colors.headerText}
          />
          <Text
            style={[
              styles.secondaryBtnText,
              {
                color: isHighContrast ? colors.text : colors.headerText,
                fontSize: fontSize(12),
                fontWeight: '800',
              },
            ]}
          >
            {backLabel}
          </Text>
        </Pressable>
      ) : null}

      {/* 1. Dedicated Accessibility Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(locale, 'accessibilityHeaderButton')}
        accessibilityHint="Otwiera dedykowane Centrum Ułatwień Dostępności cyfrowej"
        onPress={() => setAccessibilityModalVisible(true)}
        style={[
          styles.a11yBtn,
          mobileMode && styles.mobileBtn,
          {
            backgroundColor: isHighContrast ? colors.accent : '#003865',
            borderColor: isHighContrast ? colors.focus : '#38BDF8',
            borderWidth: isHighContrast ? 2.5 : 1.5,
            borderBottomWidth: highlightLinks ? 4 : isHighContrast ? 2.5 : 1.5,
            minHeight: minTouch,
          },
        ]}
      >
        <PersonArmsSpread
          size={18}
          weight="bold"
          color={isHighContrast ? colors.accentText : '#FFFFFF'}
        />
        <Text
          numberOfLines={1}
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

      {/* 2. Settings Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(locale, 'settingsTitle')}
        accessibilityHint="Otwiera panel ustawień aplikacji, wyboru języka i konta"
        onPress={() => setSettingsModalVisible(true)}
        style={[
          styles.secondaryBtn,
          mobileMode && styles.mobileBtn,
          {
            borderColor: colors.border,
            backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
            minHeight: minTouch,
          },
        ]}
      >
        <Gear
          size={16}
          weight="bold"
          color={isHighContrast ? colors.text : colors.headerText}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.secondaryBtnText,
            {
              color: isHighContrast ? colors.text : colors.headerText,
              fontSize: fontSize(12),
              fontWeight: '600',
            },
          ]}
        >
          {t(locale, 'settings')}
        </Text>
      </Pressable>
    </>
  );

  // Wersja mobilna: Herb + poziomy tytuł "Kraków bez barier" w rzędzie górnym,
  // a pod nim przewijany pasek przycisków funkcyjnych.
  if (isMobile) {
    return (
      <View
        style={[
          styles.mobileContainer,
          {
            backgroundColor: isHighContrast ? colors.surface : colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Rząd 1: Herb Krakowa + Poziomy Tytuł + Tag WCAG AAA */}
        <View style={styles.mobileTopRow}>
          <View style={styles.mobileBrand}>
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={backLabel}
                onPress={resolvedBack}
                style={[
                  styles.mobileBackIconBtn,
                  {
                    backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.18)',
                    borderColor: isHighContrast ? colors.border : 'rgba(255,255,255,0.3)',
                  },
                ]}
              >
                <ArrowLeft size={17} weight="bold" color={colors.headerText} />
              </Pressable>
            ) : null}
            <KrakowCoatOfArms size="small" showTitle={false} />
            <View style={styles.mobileTitleCol}>
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.mobileTitle,
                  {
                    color: colors.headerText,
                    fontSize: fontSize(15),
                  },
                ]}
              >
                {t(locale, 'appName')}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.mobileSubtitle,
                  {
                    color: isHighContrast ? colors.text : 'rgba(255,255,255,0.85)',
                    fontSize: fontSize(10),
                  },
                ]}
              >
                {t(locale, 'krakowGovSub')}
              </Text>
            </View>
          </View>
        </View>

        {/* Rząd 2: Pasek przycisków funkcyjnych */}
        <View style={styles.mobileButtonsRow}>
          {renderButtons(true)}
        </View>
      </View>
    );
  }

  // Pełna wersja instytucjonalna (na ekrany desktopowe i szerokie tablety)
  return (
    <View style={styles.container}>
      {/* Main Institutional Bar */}
      <View
        style={[
          styles.mainBar,
          {
            backgroundColor: isHighContrast ? colors.surface : colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.titleArea}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              onPress={resolvedBack}
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isHighContrast ? colors.accent : '#38BDF8',
                  backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.22)',
                  minHeight: 36,
                  marginRight: 6,
                },
              ]}
            >
              <ArrowLeft size={16} weight="bold" color={isHighContrast ? colors.text : colors.headerText} />
              <Text
                style={[
                  styles.secondaryBtnText,
                  {
                    color: isHighContrast ? colors.text : colors.headerText,
                    fontSize: fontSize(12.5),
                    fontWeight: '800',
                  },
                ]}
              >
                {backLabel}
              </Text>
            </Pressable>
          ) : null}
          <KrakowCoatOfArms size="small" showTitle={false} />
          <View style={styles.titleColumn}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
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
              numberOfLines={1}
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
  mobileContainer: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    zIndex: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mobileBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  mobileTitleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  mobileTitle: {
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mobileSubtitle: {
    fontWeight: '600',
    marginTop: 1,
  },
  mobileButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  mobileBtn: {
    flex: 1,
    justifyContent: 'center',
  },
  compactContainer: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    zIndex: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  titleColumn: {
    justifyContent: 'center',
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
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  a11yBtnText: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  secondaryBtnText: {
    fontWeight: '700',
  },
  mobileBackIconBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

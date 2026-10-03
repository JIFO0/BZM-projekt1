import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

interface AccessibilityToolbarProps {
  onOpenDemo?: () => void;
  onReadScreen?: () => void;
  isSpeaking?: boolean;
}

/**
 * ♿ AccessibilityToolbar - Pasek szybkiego dostępu WCAG 2.2 AAA
 * Standard obecny w oficjalnych portalach rządowych i miejskich (Kraków, Gov.pl, GDS).
 */
export function AccessibilityToolbar({
  onOpenDemo,
  onReadScreen,
  isSpeaking = false,
}: AccessibilityToolbarProps) {
  const {
    locale,
    setLocale,
    contrastMode,
    cycleContrastMode,
    decreaseTextSize,
    increaseTextSize,
    textSize,
    colors,
    isHighContrast,
    highlightLinks,
    setAccessibilityModalVisible,
    fontSize,
  } = useSession();

  const getContrastLabel = () => {
    switch (contrastMode) {
      case 'hc-yellow-black':
        return '🟡⚫ Kontrast';
      case 'hc-black-yellow':
        return '⚫🟡 Kontrast';
      case 'hc-white-black':
        return '⚪⚫ Kontrast';
      case 'standard-dark':
        return '🌙 Ciemny';
      case 'standard-light':
      default:
        return '🏛️ Błękit';
    }
  };

  const getTextSizeLabel = () => {
    switch (textSize) {
      case 'medium':
        return '120%';
      case 'large':
        return '140%';
      case 'xlarge':
        return '165%';
      case 'normal':
      default:
        return '100%';
    }
  };

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={t(locale, 'quickA11yToolbar')}
      style={[
        styles.toolbar,
        {
          backgroundColor: isHighContrast ? colors.surface : colors.govBarBg,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.scrollRow}>
        {/* Font scale down */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'textSizeBtnDecrease')}
          accessibilityHint="Zmniejsza czcionkę w aplikacji"
          onPress={decreaseTextSize}
          style={[
            styles.toolBtn,
            {
              borderColor: colors.border,
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
              borderBottomWidth: highlightLinks ? 3 : 1.5,
            },
          ]}
        >
          <Text style={[styles.toolBtnText, { color: colors.govBarText, fontSize: fontSize(13) }]}>
            A-
          </Text>
        </Pressable>

        {/* Current font indicator */}
        <View style={styles.sizeIndicator}>
          <Text style={[styles.sizeIndicatorText, { color: colors.govBarText, fontSize: fontSize(11) }]}>
            {getTextSizeLabel()}
          </Text>
        </View>

        {/* Font scale up */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'textSizeBtnIncrease')}
          accessibilityHint="Powiększa czcionkę w aplikacji"
          onPress={increaseTextSize}
          style={[
            styles.toolBtn,
            {
              borderColor: colors.border,
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
              borderBottomWidth: highlightLinks ? 3 : 1.5,
            },
          ]}
        >
          <Text style={[styles.toolBtnText, { color: colors.govBarText, fontSize: fontSize(13) }]}>
            A+
          </Text>
        </Pressable>

        {/* Contrast Cycle */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'contrastSectionTitle')}. Aktualny: ${getContrastLabel()}`}
          accessibilityHint="Przełącza między trybami kontrastu WCAG"
          onPress={cycleContrastMode}
          style={[
            styles.toolBtn,
            {
              borderColor: colors.border,
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
              borderBottomWidth: highlightLinks ? 3 : 1.5,
            },
          ]}
        >
          <Text style={[styles.toolBtnText, { color: colors.govBarText, fontSize: fontSize(12) }]}>
            {getContrastLabel()}
          </Text>
        </Pressable>

        {/* Speech Screen Reader */}
        {onReadScreen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSpeaking ? t(locale, 'stopCurrentSpeech') : t(locale, 'readCurrentScreen')}
            onPress={onReadScreen}
            style={[
              styles.toolBtn,
              {
                borderColor: isSpeaking ? colors.warningBorder : colors.border,
                backgroundColor: isSpeaking
                  ? colors.warningBg
                  : isHighContrast
                    ? colors.background
                    : 'rgba(255,255,255,0.12)',
                borderBottomWidth: highlightLinks ? 3 : 1.5,
              },
            ]}
          >
            <Text
              style={[
                styles.toolBtnText,
                {
                  color: isSpeaking ? colors.warningText : colors.govBarText,
                  fontSize: fontSize(12),
                },
              ]}
            >
              {isSpeaking ? '⏹ Lektor' : '🔊 Lektor'}
            </Text>
          </Pressable>
        ) : null}

        {/* Full Accessibility Modal Trigger */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'accessibilityMenuBtn')}
          accessibilityHint="Otwiera pełne centrum ustawień dostępności WCAG"
          onPress={() => setAccessibilityModalVisible(true)}
          style={[
            styles.toolBtnHighlight,
            {
              borderColor: colors.accent,
              backgroundColor: isHighContrast ? colors.accent : colors.accent,
              borderBottomWidth: highlightLinks ? 3 : 1.5,
            },
          ]}
        >
          <Text style={[styles.toolBtnHighlightText, { color: colors.accentText, fontSize: fontSize(12) }]}>
            ♿ {t(locale, 'accessibilityMenuBtn').split(' ')[0]}
          </Text>
        </Pressable>

        {/* Language switcher */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={locale === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
          onPress={() => setLocale(locale === 'pl' ? 'en' : 'pl')}
          style={[
            styles.toolBtn,
            {
              borderColor: colors.border,
              backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
              borderBottomWidth: highlightLinks ? 3 : 1.5,
            },
          ]}
        >
          <Text style={[styles.toolBtnText, { color: colors.govBarText, fontSize: fontSize(12) }]}>
            🌐 {locale.toUpperCase()}
          </Text>
        </Pressable>

        {/* Demo Button */}
        {onOpenDemo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Panel testowy i symulacji Demo"
            onPress={onOpenDemo}
            style={[
              styles.toolBtn,
              {
                borderColor: colors.border,
                backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.12)',
                borderBottomWidth: highlightLinks ? 3 : 1.5,
              },
            ]}
          >
            <Text style={[styles.toolBtnText, { color: colors.govBarText, fontSize: fontSize(12) }]}>
              🛠️ Demo
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    borderBottomWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  scrollRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: spacing.touch - 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnText: {
    fontWeight: '700',
  },
  sizeIndicator: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeIndicatorText: {
    fontWeight: '700',
  },
  toolBtnHighlight: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: spacing.touch - 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnHighlightText: {
    fontWeight: '800',
  },
});

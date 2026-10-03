import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import type { ContrastMode, TextSize } from '@/theme/tokens';
import { spacing } from '@/theme/tokens';

export function AccessibilityModal() {
  const {
    locale,
    accessibilityModalVisible,
    setAccessibilityModalVisible,
    contrastMode,
    setContrastMode,
    textSize,
    setTextSize,
    dyslexicFont,
    setDyslexicFont,
    increasedSpacing,
    setIncreasedSpacing,
    highlightLinks,
    setHighlightLinks,
    readingRuler,
    setReadingRuler,
    resetAccessibility,
    colors,
    isHighContrast,
    fontSize,
  } = useSession();

  const contrastOptions: {
    id: ContrastMode;
    label: string;
    bgSample: string;
    textSample: string;
    borderSample: string;
  }[] = [
    {
      id: 'standard-light',
      label: t(locale, 'contrastModeStandardLight'),
      bgSample: '#FFFFFF',
      textSample: '#005CA9',
      borderSample: '#005CA9',
    },
    {
      id: 'standard-dark',
      label: t(locale, 'contrastModeStandardDark'),
      bgSample: '#152232',
      textSample: '#38BDF8',
      borderSample: '#38BDF8',
    },
    {
      id: 'hc-yellow-black',
      label: t(locale, 'contrastModeYellowBlack'),
      bgSample: '#000000',
      textSample: '#FFFF00',
      borderSample: '#FFFF00',
    },
    {
      id: 'hc-black-yellow',
      label: t(locale, 'contrastModeBlackYellow'),
      bgSample: '#FFFF00',
      textSample: '#000000',
      borderSample: '#000000',
    },
    {
      id: 'hc-white-black',
      label: t(locale, 'contrastModeWhiteBlack'),
      bgSample: '#000000',
      textSample: '#FFFFFF',
      borderSample: '#FFFFFF',
    },
  ];

  const textSizeOptions: { id: TextSize; label: string }[] = [
    { id: 'normal', label: t(locale, 'textSizeNormal') },
    { id: 'medium', label: t(locale, 'textSizeMedium') },
    { id: 'large', label: t(locale, 'textSizeLarge') },
    { id: 'xlarge', label: t(locale, 'textSizeXLarge') },
  ];

  return (
    <Modal
      visible={accessibilityModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAccessibilityModalVisible(false)}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: isHighContrast ? colors.background : colors.govBarBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.headerTitleWrap}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.headerTitle,
                  {
                    color: colors.govBarText,
                    fontSize: fontSize(18),
                  },
                ]}
              >
                ♿ {t(locale, 'accessibilityPanelTitle')}
              </Text>
              <Text
                style={[
                  styles.headerSub,
                  {
                    color: isHighContrast ? colors.text : 'rgba(255,255,255,0.85)',
                    fontSize: fontSize(12),
                  },
                ]}
              >
                {t(locale, 'wcagBadge')} • Urząd Miasta Krakowa
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'close')}
              onPress={() => setAccessibilityModalVisible(false)}
              style={[
                styles.closeBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.2)',
                },
              ]}
            >
              <Text style={[styles.closeBtnText, { color: colors.govBarText }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.bodyContent}>
            <Text
              style={[
                styles.leadText,
                {
                  color: colors.text,
                  fontSize: fontSize(14),
                },
              ]}
            >
              {t(locale, 'accessibilityPanelDesc')}
            </Text>

            {/* SECTION 1: Tryb kontrastu */}
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(16),
                  },
                ]}
              >
                🎨 {t(locale, 'contrastSectionTitle')}
              </Text>
              <View accessibilityRole="radiogroup" style={styles.optionsCol}>
                {contrastOptions.map((opt) => {
                  const isSelected = contrastMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      aria-checked={isSelected}
                      accessibilityLabel={`${opt.label}. ${isSelected ? 'Wybrany' : ''}`}
                      onPress={() => setContrastMode(opt.id)}
                      style={[
                        styles.contrastCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isSelected ? colors.focus : colors.border,
                          borderWidth: isSelected ? 3 : 1.5,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: opt.bgSample,
                            borderColor: opt.borderSample,
                          },
                        ]}
                      >
                        <Text style={[styles.swatchText, { color: opt.textSample }]}>Aa</Text>
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: colors.text,
                            fontSize: fontSize(14),
                            fontWeight: isSelected ? '800' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected ? (
                        <Text style={[styles.selectedCheck, { color: colors.accent }]}>✓</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SECTION 2: Rozmiar czcionki */}
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(16),
                  },
                ]}
              >
                🔍 {t(locale, 'textSizeSectionTitle')}
              </Text>
              <View accessibilityRole="radiogroup" style={styles.textSizeGrid}>
                {textSizeOptions.map((opt) => {
                  const isSelected = textSize === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      aria-checked={isSelected}
                      accessibilityLabel={`${opt.label}. ${isSelected ? 'Wybrany' : ''}`}
                      onPress={() => setTextSize(opt.id)}
                      style={[
                        styles.textSizeBtn,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surface,
                          borderColor: isSelected ? colors.focus : colors.border,
                          borderWidth: isSelected ? 2.5 : 1.5,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.textSizeBtnText,
                          {
                            color: isSelected ? colors.accentText : colors.text,
                            fontSize: fontSize(13),
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {/* Preview Box */}
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.muted, fontSize: fontSize(11), fontWeight: '700' }}>
                  PODGLĄD TEKSTU:
                </Text>
                <Text style={{ color: colors.text, fontSize: fontSize(16), fontWeight: '600' }}>
                  Kraków bez Barier — Dostępność Przestrzenna
                </Text>
                <Text style={{ color: colors.muted, fontSize: fontSize(14) }}>
                  Przykład czytelności tekstu z aktualnymi ustawieniami czcionki.
                </Text>
              </View>
            </View>

            {/* SECTION 3: Czytelność i dysleksja */}
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(16),
                  },
                ]}
              >
                📖 {t(locale, 'readabilitySectionTitle')}
              </Text>
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchLabel, { color: colors.text, fontSize: fontSize(14) }]}>
                    {t(locale, 'dyslexicMode')}
                  </Text>
                  <Text style={[styles.switchHint, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'dyslexicModeHint')}
                  </Text>
                </View>
                <Switch
                  value={dyslexicFont}
                  onValueChange={setDyslexicFont}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel={t(locale, 'dyslexicMode')}
                />
              </View>
            </View>

            {/* SECTION 4: Sprawność motoryczna */}
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(16),
                  },
                ]}
              >
                🖐️ {t(locale, 'motorSectionTitle')}
              </Text>
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchLabel, { color: colors.text, fontSize: fontSize(14) }]}>
                    {t(locale, 'increasedSpacing')}
                  </Text>
                  <Text style={[styles.switchHint, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'increasedSpacingHint')}
                  </Text>
                </View>
                <Switch
                  value={increasedSpacing}
                  onValueChange={setIncreasedSpacing}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel={t(locale, 'increasedSpacing')}
                />
              </View>
            </View>

            {/* SECTION 5: Wsparcie wzroku i uwagi */}
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(16),
                  },
                ]}
              >
                👁️ {t(locale, 'visualFocusSectionTitle')}
              </Text>
              {/* Highlight interactive links */}
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchLabel, { color: colors.text, fontSize: fontSize(14) }]}>
                    {t(locale, 'highlightInteractive')}
                  </Text>
                  <Text style={[styles.switchHint, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'highlightInteractiveHint')}
                  </Text>
                </View>
                <Switch
                  value={highlightLinks}
                  onValueChange={setHighlightLinks}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel={t(locale, 'highlightInteractive')}
                />
              </View>

              {/* Reading Ruler */}
              <View
                style={[
                  styles.switchRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    marginTop: 8,
                  },
                ]}
              >
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchLabel, { color: colors.text, fontSize: fontSize(14) }]}>
                    {t(locale, 'readingRuler')}
                  </Text>
                  <Text style={[styles.switchHint, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'readingRulerHint')}
                  </Text>
                </View>
                <Switch
                  value={readingRuler}
                  onValueChange={setReadingRuler}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel={t(locale, 'readingRuler')}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'resetAccessibilityBtn')}
              onPress={resetAccessibility}
              style={[
                styles.resetBtn,
                {
                  borderColor: colors.border,
                  minHeight: spacing.touch,
                },
              ]}
            >
              <Text style={[styles.resetBtnText, { color: colors.text, fontSize: fontSize(13) }]}>
                {t(locale, 'resetAccessibilityBtn')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'applyAndClose')}
              onPress={() => setAccessibilityModalVisible(false)}
              style={[
                styles.applyBtn,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.focus,
                  minHeight: spacing.touch,
                },
              ]}
            >
              <Text
                style={[
                  styles.applyBtnText,
                  {
                    color: colors.accentText,
                    fontSize: fontSize(14),
                  },
                ]}
              >
                ✓ {t(locale, 'applyAndClose')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    maxHeight: '92%',
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1.5,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '800',
  },
  headerSub: {
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeBtnText: {
    fontWeight: '800',
    fontSize: 16,
  },
  bodyContent: {
    padding: 16,
    gap: 18,
  },
  leadText: {
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  optionsCol: {
    gap: 8,
  },
  contrastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 12,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    fontWeight: '900',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
  },
  selectedCheck: {
    fontWeight: '900',
    fontSize: 18,
    paddingRight: 4,
  },
  textSizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textSizeBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSizeBtnText: {
    textAlign: 'center',
  },
  previewBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontWeight: '700',
  },
  switchHint: {
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1.5,
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1.5,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  applyBtnText: {
    fontWeight: '800',
  },
});

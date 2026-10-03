import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  ArrowCounterClockwise,
  ArrowsHorizontal,
  BookOpen,
  Check,
  Eye,
  Globe,
  HandPointing,
  Palette,
  ShieldCheck,
  SpeakerHigh,
  TextAa,
  TextAlignLeft,
  X,
} from 'phosphor-react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';
import type {
  ContrastMode,
  FontFamilyMode,
  LetterSpacingMode,
  LineHeightMode,
  TextSize,
} from '@/theme/tokens';
import { spacing } from '@/theme/tokens';

export function AccessibilityModal() {
  const {
    locale,
    setLocale,
    accessibilityModalVisible,
    setAccessibilityModalVisible,
    contrastMode,
    setContrastMode,
    textSize,
    setTextSize,
    lineHeightMode,
    setLineHeightMode,
    letterSpacingMode,
    setLetterSpacingMode,
    fontFamilyMode,
    setFontFamilyMode,
    speechRate,
    setSpeechRate,
    setDyslexicFont,
    increasedSpacing,
    setIncreasedSpacing,
    highlightLinks,
    setHighlightLinks,
    readingRuler,
    setReadingRuler,
    readingMask,
    setReadingMask,
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
    {
      id: 'monochrome',
      label: t(locale, 'contrastModeMonochrome'),
      bgSample: '#E5E5E5',
      textSample: '#111111',
      borderSample: '#555555',
    },
  ];

  const textSizeOptions: { id: TextSize; label: string }[] = [
    { id: 'normal', label: t(locale, 'textSizeNormal') },
    { id: 'medium', label: t(locale, 'textSizeMedium') },
    { id: 'large', label: t(locale, 'textSizeLarge') },
    { id: 'xlarge', label: t(locale, 'textSizeXLarge') },
    { id: 'xxlarge', label: t(locale, 'textSizeXXLarge') },
  ];

  const lineHeightOptions: { id: LineHeightMode; label: string }[] = [
    { id: 'normal', label: t(locale, 'lineSpacingNormal') },
    { id: 'increased', label: t(locale, 'lineSpacingIncreased') },
    { id: 'loose', label: t(locale, 'lineSpacingLoose') },
  ];

  const letterSpacingOptions: { id: LetterSpacingMode; label: string }[] = [
    { id: 'normal', label: t(locale, 'letterSpacingNormal') },
    { id: 'increased', label: t(locale, 'letterSpacingIncreased') },
    { id: 'wide', label: t(locale, 'letterSpacingWide') },
  ];

  const fontOptions: { id: FontFamilyMode; label: string }[] = [
    { id: 'system', label: t(locale, 'fontFamilySystem') },
    { id: 'dyslexic', label: t(locale, 'fontFamilyDyslexic') },
    { id: 'mono', label: t(locale, 'fontFamilyMono') },
  ];

  const speechRateOptions: { rate: number; label: string }[] = [
    { rate: 0.8, label: t(locale, 'speechRateSlow') },
    { rate: 1.0, label: t(locale, 'speechRateNormal') },
    { rate: 1.2, label: t(locale, 'speechRateFast') },
  ];

  const languageOptions: { id: Locale; label: string; code: string }[] = [
    { id: 'pl', label: t(locale, 'langPl'), code: 'PL' },
    { id: 'en', label: t(locale, 'langEn'), code: 'EN' },
    { id: 'uk', label: t(locale, 'langUk'), code: 'UK' },
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
                    fontSize: fontSize(17.5),
                  },
                ]}
              >
                {t(locale, 'accessibilityPanelTitle')}
              </Text>
              <Text
                style={[
                  styles.headerSub,
                  {
                    color: isHighContrast ? colors.text : 'rgba(255,255,255,0.85)',
                    fontSize: fontSize(11.5),
                  },
                ]}
              >
                {t(locale, 'wcagBadge')} • {t(locale, 'cityHallKrakow')}
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
                  backgroundColor: isHighContrast ? colors.background : 'rgba(255,255,255,0.18)',
                },
              ]}
            >
              <X size={18} weight="bold" color={colors.govBarText} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.bodyContent}>
            <Text
              style={[
                styles.leadText,
                {
                  color: colors.text,
                  fontSize: fontSize(13.5),
                },
              ]}
            >
              {t(locale, 'accessibilityPanelDesc')}
            </Text>

            {/* SEKCJA JĘZYK: Wybór języka / Language Selection */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Globe size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'languageSectionTitle')}
                </Text>
              </View>

              <View accessibilityRole="radiogroup" style={styles.optionsCol}>
                {languageOptions.map((opt) => {
                  const isSelected = locale === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      aria-checked={isSelected}
                      accessibilityLabel={`${opt.label}. ${isSelected ? t(locale, 'selected') : ''}`}
                      onPress={() => setLocale(opt.id)}
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
                            backgroundColor: isSelected ? colors.accent : colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.swatchText, { color: isSelected ? colors.accentText : colors.text }]}>
                          {opt.code}
                        </Text>
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
                        <Check size={18} weight="bold" color={colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SEKCJA 1: Kontrast i barwy */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Palette size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'contrastSectionTitle')}
                </Text>
              </View>

              <View accessibilityRole="radiogroup" style={styles.optionsCol}>
                {contrastOptions.map((opt) => {
                  const isSelected = contrastMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      aria-checked={isSelected}
                      accessibilityLabel={`${opt.label}. ${isSelected ? t(locale, 'selected') : ''}`}
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
                        <Check size={18} weight="bold" color={colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* SEKCJA 2: Skalowanie tekstu */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <TextAa size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'textSizeSectionTitle')}
                </Text>
              </View>

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

              {/* Podgląd tekstu na żywo */}
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
                  PODGLĄD CZYTELNOŚCI TEKSTU:
                </Text>
                <Text style={{ color: colors.text, fontSize: fontSize(16), fontWeight: '700' }}>
                  Kraków bez Barier — Dostępność Przestrzenna
                </Text>
                <Text style={{ color: colors.muted, fontSize: fontSize(13.5), lineHeight: fontSize(19) }}>
                  Przykład tekstu w wybranym stopniu powiększenia i konfiguracji typograficznej.
                </Text>
              </View>
            </View>

            {/* SEKCJA 3: Krój pisma i czytelność */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <BookOpen size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'fontFamilySectionTitle')}
                </Text>
              </View>

              <View accessibilityRole="radiogroup" style={styles.textSizeGrid}>
                {fontOptions.map((opt) => {
                  const isSelected = fontFamilyMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      aria-checked={isSelected}
                      onPress={() => {
                        setFontFamilyMode(opt.id);
                        if (opt.id === 'dyslexic') setDyslexicFont(true);
                        else setDyslexicFont(false);
                      }}
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
                            fontSize: fontSize(12.5),
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

              {/* Interlinia */}
              <View style={[styles.sectionTitleRow, { marginTop: 6 }]}>
                <TextAlignLeft size={18} weight="bold" color={colors.accent} />
                <Text style={[styles.subSectionTitle, { color: colors.text, fontSize: fontSize(14) }]}>
                  {t(locale, 'lineSpacingTitle')}
                </Text>
              </View>
              <View accessibilityRole="radiogroup" style={styles.textSizeGrid}>
                {lineHeightOptions.map((opt) => {
                  const isSelected = lineHeightMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => setLineHeightMode(opt.id)}
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
                            fontSize: fontSize(12.5),
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

              {/* Kerning */}
              <View style={[styles.sectionTitleRow, { marginTop: 6 }]}>
                <ArrowsHorizontal size={18} weight="bold" color={colors.accent} />
                <Text style={[styles.subSectionTitle, { color: colors.text, fontSize: fontSize(14) }]}>
                  {t(locale, 'letterSpacingTitle')}
                </Text>
              </View>
              <View accessibilityRole="radiogroup" style={styles.textSizeGrid}>
                {letterSpacingOptions.map((opt) => {
                  const isSelected = letterSpacingMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => setLetterSpacingMode(opt.id)}
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
                            fontSize: fontSize(12.5),
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
            </View>

            {/* SEKCJA 4: Sprawność motoryczna */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <HandPointing size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'motorSectionTitle')}
                </Text>
              </View>

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

            {/* SEKCJA 5: Skupienie wzroku i uwaga */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Eye size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'visualFocusSectionTitle')}
                </Text>
              </View>

              {/* Wyróżnienie linków */}
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

              {/* Linijka czytania */}
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

              {/* Maska czytania */}
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
                    {t(locale, 'readingMask')}
                  </Text>
                  <Text style={[styles.switchHint, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'readingMaskHint')}
                  </Text>
                </View>
                <Switch
                  value={readingMask}
                  onValueChange={setReadingMask}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                  accessibilityLabel={t(locale, 'readingMask')}
                />
              </View>
            </View>

            {/* SEKCJA 6: Synteza mowy (Lektor) */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <SpeakerHigh size={19} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    {
                      color: colors.text,
                      fontSize: fontSize(15.5),
                    },
                  ]}
                >
                  {t(locale, 'speechSectionTitle')}
                </Text>
              </View>

              <Text style={[styles.subSectionTitle, { color: colors.text, fontSize: fontSize(13.5) }]}>
                {t(locale, 'speechRateTitle')}
              </Text>
              <View accessibilityRole="radiogroup" style={styles.textSizeGrid}>
                {speechRateOptions.map((opt) => {
                  const isSelected = speechRate === opt.rate;
                  return (
                    <Pressable
                      key={opt.rate}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => setSpeechRate(opt.rate)}
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
                            fontSize: fontSize(12.5),
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
            </View>

            {/* SEKCJA 7: Zgodność prawna */}
            <View
              style={[
                styles.legalBox,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <ShieldCheck size={18} weight="bold" color={colors.accent} />
                <Text style={{ color: colors.text, fontSize: fontSize(13), fontWeight: '800' }}>
                  {t(locale, 'accessibilityDeclaration')}
                </Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: fontSize(12), lineHeight: fontSize(17) }}>
                Aplikacja spełnia wymagania Ustawy z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych, normy europejskiej PN-EN 301 549 V3.2.1 oraz wytycznych WCAG 2.2 na poziomie AAA.
              </Text>
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
              <ArrowCounterClockwise size={16} weight="bold" color={colors.text} />
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
              <Check size={18} weight="bold" color={colors.accentText} />
              <Text
                style={[
                  styles.applyBtnText,
                  {
                    color: colors.accentText,
                    fontSize: fontSize(14),
                  },
                ]}
              >
                {t(locale, 'applyAndClose')}
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    maxHeight: '94%',
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
    fontWeight: '900',
    letterSpacing: 0.3,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subSectionTitle: {
    fontWeight: '700',
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
    gap: 6,
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
  legalBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  resetBtnText: {
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1.5,
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  applyBtnText: {
    fontWeight: '800',
  },
});

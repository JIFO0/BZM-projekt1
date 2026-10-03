import type { ProfileId } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Baby,
  Check,
  Info,
  LockKey,
  SlidersHorizontal,
  Wheelchair,
} from 'phosphor-react-native';

import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const {
    locale,
    profileId,
    setProfileId,
    customThresholds,
    setCustomThresholds,
    colors,
    fontSize,
    lineHeight,
    letterSpacing,
    isHighContrast,
    increasedSpacing,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);

  const getProfileIcon = (id: ProfileId) => {
    switch (id) {
      case 'wheelchair':
        return <Wheelchair size={22} weight="bold" color={colors.accent} />;
      case 'stroller':
        return <Baby size={22} weight="bold" color={colors.accent} />;
      case 'custom':
      default:
        return <SlidersHorizontal size={22} weight="bold" color={colors.accent} />;
    }
  };

  const OPTIONS: {
    id: ProfileId;
    title: 'wheelchair' | 'stroller' | 'custom';
    hint: 'wheelchairHint' | 'strollerHint' | 'customHint';
  }[] = [
    { id: 'wheelchair', title: 'wheelchair', hint: 'wheelchairHint' },
    { id: 'stroller', title: 'stroller', hint: 'strollerHint' },
    { id: 'custom', title: 'custom', hint: 'customHint' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'appName') }} />

      {/* Official Krakow Gov Header with Dedicated Accessibility Trigger */}
      <KrakowHeader onOpenDemo={() => setDebugVisible(true)} />

      <DemoBanner />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* Welcome & Municipal Program Card */}
        <GovCard variant="accent">
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.krakowBadge, { color: colors.accent, fontSize: fontSize(12) }]}>
              PROTOTYP PUBLICZNY • MIASTO KRAKÓW
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[
              styles.leadTitle,
              {
                color: colors.text,
                fontSize: fontSize(21),
                lineHeight: lineHeight(21),
                letterSpacing,
              },
            ]}
          >
            {t(locale, 'profileTitle')}
          </Text>
          <Text
            style={[
              styles.bodyText,
              {
                color: colors.muted,
                fontSize: fontSize(14.5),
                lineHeight: lineHeight(14.5),
                letterSpacing,
              },
            ]}
          >
            {t(locale, 'profileLead')}
          </Text>
        </GovCard>

        {/* Mobility Profile Radio Group */}
        <View accessibilityRole="radiogroup" style={styles.optionsList}>
          {OPTIONS.map((option) => {
            const selected = profileId === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                accessibilityLabel={`${t(locale, option.title)}. ${t(locale, option.hint)}. ${
                  selected ? t(locale, 'selected') : ''
                }`}
                onPress={() => setProfileId(option.id)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selected ? colors.focus : colors.border,
                    borderWidth: selected ? 3 : isHighContrast ? 2 : 1.5,
                    minHeight: increasedSpacing ? 70 : 58,
                    padding: increasedSpacing ? 18 : 14,
                  },
                ]}
              >
                <View style={styles.optionTopRow}>
                  <View style={styles.optionTitleRow}>
                    {getProfileIcon(option.id)}
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: colors.text,
                          fontSize: fontSize(17),
                          fontWeight: selected ? '800' : '600',
                          letterSpacing,
                        },
                      ]}
                    >
                      {t(locale, option.title)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: selected ? colors.focus : colors.border,
                        backgroundColor: selected ? colors.accent : colors.surface,
                      },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[
                          styles.radioInnerDot,
                          { backgroundColor: colors.accentText },
                        ]}
                      />
                    ) : null}
                  </View>
                </View>

                <Text
                  style={[
                    styles.optionHint,
                    {
                      color: colors.muted,
                      fontSize: fontSize(13.5),
                      lineHeight: lineHeight(13.5),
                      letterSpacing,
                    },
                  ]}
                >
                  {t(locale, option.hint)}
                </Text>

                {selected ? (
                  <View
                    style={[
                      styles.selectedTag,
                      {
                        backgroundColor: isHighContrast ? colors.background : colors.badgeBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Check size={14} weight="bold" color={colors.accent} />
                    <Text style={[styles.selectedText, { color: colors.accent, fontSize: fontSize(12) }]}>
                      {t(locale, 'selected')}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Custom Profile Fine-tuning */}
        {profileId === 'custom' ? (
          <GovCard variant="accent">
            <Text
              accessibilityRole="header"
              style={[styles.customTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              Dostosuj progi barier dla profilu własnego:
            </Text>

            <View style={styles.thresholdRow}>
              <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(14.5) }]}>
                Maksymalny krawężnik: <Text style={{ fontWeight: '800' }}>{customThresholds.maxKerbMillimetres} mm</Text>
              </Text>
              <View style={styles.stepBtnRow}>
                <GovButton
                  variant="outline"
                  title="-10 mm"
                  onPress={() =>
                    setCustomThresholds({
                      ...customThresholds,
                      maxKerbMillimetres: Math.max(10, customThresholds.maxKerbMillimetres - 10),
                    })
                  }
                  style={styles.smallStepBtn}
                />
                <GovButton
                  variant="outline"
                  title="+10 mm"
                  onPress={() =>
                    setCustomThresholds({
                      ...customThresholds,
                      maxKerbMillimetres: customThresholds.maxKerbMillimetres + 10,
                    })
                  }
                  style={styles.smallStepBtn}
                />
              </View>
            </View>

            <View style={styles.thresholdRow}>
              <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(14.5) }]}>
                Traktowanie stopni:{' '}
                <Text style={{ fontWeight: '800', color: customThresholds.stepsAreBlocker ? colors.blockerText : colors.warningText }}>
                  {customThresholds.stepsAreBlocker ? 'BLOKADA (Blocker)' : 'OSTRZEŻENIE (Warning)'}
                </Text>
              </Text>
              <GovButton
                variant="secondary"
                title="Przełącz status schodów"
                onPress={() =>
                  setCustomThresholds({
                    ...customThresholds,
                    stepsAreBlocker: !customThresholds.stepsAreBlocker,
                  })
                }
              />
            </View>
          </GovCard>
        ) : null}

        {/* Privacy Note */}
        <GovCard variant="default">
          <View style={styles.privacyRow}>
            <LockKey size={18} weight="bold" color={colors.accent} />
            <Text
              style={[
                styles.privacyNotice,
                {
                  color: colors.muted,
                  fontSize: fontSize(12.5),
                  lineHeight: lineHeight(12.5),
                  letterSpacing,
                  flex: 1,
                },
              ]}
            >
              <Text style={{ fontWeight: '700', color: colors.text }}>Prywatność i bezpieczeństwo:</Text>{' '}
              {t(locale, 'privacy')}
            </Text>
          </View>
        </GovCard>

        {/* Main Action Buttons */}
        <View style={styles.actionRow}>
          <GovButton
            title={t(locale, 'continue')}
            icon={<ArrowRight size={18} weight="bold" color={colors.accentText} />}
            variant="primary"
            disabled={profileId === null}
            onPress={() => router.push('/search')}
          />

          <GovButton
            title={t(locale, 'about')}
            icon={<Info size={18} weight="bold" color={colors.text} />}
            variant="outline"
            onPress={() => router.push('/about')}
          />
        </View>

        {/* Official Municipal Footer */}
        <GovFooter />
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.screen,
    gap: spacing.stack,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  krakowBadge: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  leadTitle: {
    fontWeight: '900',
  },
  bodyText: {
    fontWeight: '500',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    gap: 6,
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionTitle: {
    letterSpacing: 0.2,
  },
  optionHint: {
    fontWeight: '500',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectedTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedText: {
    fontWeight: '800',
  },
  customTitle: {
    fontWeight: '800',
  },
  thresholdRow: {
    gap: 8,
    marginTop: 4,
  },
  paramLabel: {
    fontWeight: '600',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallStepBtn: {
    flex: 1,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  privacyNotice: {
    fontWeight: '500',
  },
  actionRow: {
    gap: 10,
    marginTop: 4,
  },
});

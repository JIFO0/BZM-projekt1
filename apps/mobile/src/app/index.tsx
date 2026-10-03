import type { ProfileId } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

const OPTIONS: {
  id: ProfileId;
  title: 'wheelchair' | 'stroller' | 'custom';
  hint: 'wheelchairHint' | 'strollerHint' | 'customHint';
  icon: string;
}[] = [
  { id: 'wheelchair', title: 'wheelchair', hint: 'wheelchairHint', icon: '♿' },
  { id: 'stroller', title: 'stroller', hint: 'strollerHint', icon: '👶' },
  { id: 'custom', title: 'custom', hint: 'customHint', icon: '⚙️' },
];

const ROAD_TYPE_OPTIONS: {
  id: string;
  nameKey:
    | 'surfaceCobblestone'
    | 'surfaceGravel'
    | 'surfaceSand'
    | 'surfaceDirt'
    | 'surfaceUnpaved'
    | 'surfaceCompacted';
  icon: string;
  descPl: string;
  descEn: string;
}[] = [
  {
    id: 'cobblestone',
    nameKey: 'surfaceCobblestone',
    icon: '🪨',
    descPl: 'Bruk i kocie łby powodujące silne drgania i blokowanie kół',
    descEn: 'Cobblestone causing severe vibrations and stuck wheels',
  },
  {
    id: 'gravel',
    nameKey: 'surfaceGravel',
    icon: '⚪',
    descPl: 'Gruby żwir i szuter, utrudniający toczenie się kół',
    descEn: 'Coarse gravel hindering wheel rolling',
  },
  {
    id: 'sand',
    nameKey: 'surfaceSand',
    icon: '🏖️',
    descPl: 'Sypki piasek grzęznący dla wózków',
    descEn: 'Loose sand causing wheels to sink',
  },
  {
    id: 'dirt',
    nameKey: 'surfaceDirt',
    icon: '🌱',
    descPl: 'Drogi gruntowe i ziemne, błotniste po deszczu',
    descEn: 'Dirt and soil tracks, muddy in rain',
  },
  {
    id: 'unpaved',
    nameKey: 'surfaceUnpaved',
    icon: '🚧',
    descPl: 'Wszelkie nawierzchnie nieutwardzone',
    descEn: 'Any general unpaved terrain',
  },
  {
    id: 'compacted',
    nameKey: 'surfaceCompacted',
    icon: '🛤️',
    descPl: 'Nawierzchnia szutrowa utwardzona / ubita',
    descEn: 'Compacted gravel or stabilized surface',
  },
];

export default function ProfileScreen() {
  const {
    locale,
    profileId,
    setProfileId,
    customThresholds,
    setCustomThresholds,
    activeThresholds,
    toggleBlockedRoadType,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const blockedList =
    activeThresholds.blockedRoadTypes ?? activeThresholds.blockedSurfaces ?? [];

  const handleReadScreen = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const blockedNarrative =
      blockedList.length > 0
        ? `Zablokowane nawierzchnie dla profilu: ${blockedList.join(', ')}.`
        : 'Brak zablokowanych nawierzchni.';

    const narrative = `${t(locale, 'appName')}. ${t(locale, 'profileTitle')}. ${t(
      locale,
      'profileLead',
    )}. Dostępne profile to: Wózek, Wózek dziecięcy oraz Profil własny. Aktualnie wybrany profil: ${
      profileId === 'wheelchair'
        ? 'Wózek'
        : profileId === 'stroller'
          ? 'Wózek dziecięcy'
          : 'Profil własny'
    }. ${blockedNarrative} Kliknij przycisk dalej, aby przejść do wyszukiwania tras w Krakowie.`;

    setIsSpeaking(true);
    Speech.speak(narrative, {
      language: locale === 'pl' ? 'pl-PL' : 'en-US',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'appName') }} />

      {/* Official Kraków Gov Header with WCAG toolbar */}
      <KrakowHeader
        onOpenDemo={() => setDebugVisible(true)}
        onReadScreen={handleReadScreen}
        isSpeaking={isSpeaking}
      />

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
                lineHeight: fontSize(28),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
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
                lineHeight: fontSize(22),
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
                    <Text style={[styles.optionIcon, { fontSize: fontSize(22) }]}>
                      {option.icon}
                    </Text>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: colors.text,
                          fontSize: fontSize(17),
                          fontWeight: selected ? '800' : '600',
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
                      lineHeight: fontSize(20),
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
                    <Text style={[styles.selectedText, { color: colors.accent, fontSize: fontSize(12) }]}>
                      ✓ {t(locale, 'selected')}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Blocked Road Types / Surfaces Selection (eg. cobblestone) */}
        <GovCard variant="default">
          <View style={styles.sectionHeaderWrap}>
            <Text
              accessibilityRole="header"
              style={[
                styles.customTitle,
                { color: colors.text, fontSize: fontSize(16) },
              ]}
            >
              🚫 {t(locale, 'blockedRoadTypesTitle')}
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.muted,
                  fontSize: fontSize(13),
                  lineHeight: fontSize(18),
                  marginTop: 2,
                },
              ]}
            >
              {t(locale, 'blockedRoadTypesSubtitle')}
            </Text>
          </View>

          <View style={styles.roadTypesGrid}>
            {ROAD_TYPE_OPTIONS.map((rt) => {
              const isBlocked = blockedList.includes(rt.id);
              const label = t(locale, rt.nameKey);

              return (
                <Pressable
                  key={rt.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isBlocked }}
                  aria-checked={isBlocked}
                  accessibilityLabel={`${label}. ${
                    isBlocked
                      ? t(locale, 'blockedStatusBlocked')
                      : t(locale, 'blockedStatusAllowed')
                  }`}
                  onPress={() => toggleBlockedRoadType(rt.id)}
                  style={[
                    styles.roadTypeCard,
                    {
                      backgroundColor: isBlocked
                        ? isHighContrast
                          ? colors.background
                          : colors.surface
                        : colors.surface,
                      borderColor: isBlocked ? colors.blockerBorder : colors.border,
                      borderWidth: isBlocked ? 2.5 : 1.5,
                      padding: increasedSpacing ? 12 : 9,
                    },
                  ]}
                >
                  <View style={styles.roadTypeLeft}>
                    <Text style={{ fontSize: fontSize(19) }}>{rt.icon}</Text>
                    <View style={styles.roadTypeInfo}>
                      <Text
                        style={[
                          styles.roadTypeLabel,
                          {
                            color: isBlocked ? colors.blockerText : colors.text,
                            fontSize: fontSize(13.5),
                            fontWeight: isBlocked ? '800' : '600',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[
                          styles.roadTypeDesc,
                          {
                            color: colors.muted,
                            fontSize: fontSize(11.5),
                          },
                        ]}
                      >
                        {locale === 'pl' ? rt.descPl : rt.descEn}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.roadTypeStatusBadge,
                      {
                        backgroundColor: isBlocked
                          ? colors.blockerBorder
                          : isHighContrast
                            ? colors.background
                            : colors.badgeBg,
                        borderColor: isBlocked ? colors.blockerBorder : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roadTypeStatusText,
                        {
                          color: isBlocked ? '#FFFFFF' : colors.text,
                          fontSize: fontSize(11),
                        },
                      ]}
                    >
                      {isBlocked
                        ? `🚫 ${t(locale, 'blockedStatusBlocked')}`
                        : `✓ ${t(locale, 'blockedStatusAllowed')}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </GovCard>

        {/* Custom Profile Fine-tuning */}
        {profileId === 'custom' ? (
          <GovCard variant="accent">
            <Text
              accessibilityRole="header"
              style={[styles.customTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              ⚙️ Dostosuj progi barier dla profilu własnego:
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
          <Text style={[styles.privacyNotice, { color: colors.muted, fontSize: fontSize(12.5), lineHeight: fontSize(18) }]}>
            🔒 <Text style={{ fontWeight: '700' }}>Prywatność i bezpieczeństwo:</Text> {t(locale, 'privacy')}
          </Text>
        </GovCard>

        {/* Main Action Buttons */}
        <View style={styles.actionRow}>
          <GovButton
            title={t(locale, 'continue')}
            icon="➜"
            variant="primary"
            disabled={profileId === null}
            onPress={() => router.push('/search')}
          />

          <GovButton
            title={t(locale, 'about')}
            icon="ℹ️"
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
    fontWeight: '800',
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
  optionIcon: {},
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
  privacyNotice: {
    fontWeight: '500',
  },
  actionRow: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeaderWrap: {
    gap: 2,
    marginBottom: 4,
  },
  roadTypesGrid: {
    gap: 8,
    marginTop: 6,
  },
  roadTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    gap: 8,
  },
  roadTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roadTypeInfo: {
    flex: 1,
    gap: 2,
  },
  roadTypeLabel: {
    letterSpacing: 0.2,
  },
  roadTypeDesc: {
    fontWeight: '500',
  },
  roadTypeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  roadTypeStatusText: {
    fontWeight: '800',
  },
});

import type { ProfileId } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

const OPTIONS: {
  id: ProfileId;
  title: 'wheelchair' | 'stroller' | 'custom';
  hint: 'wheelchairHint' | 'strollerHint' | 'customHint';
}[] = [
  { id: 'wheelchair', title: 'wheelchair', hint: 'wheelchairHint' },
  { id: 'stroller', title: 'stroller', hint: 'strollerHint' },
  { id: 'custom', title: 'custom', hint: 'customHint' },
];

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale, setLocale, profileId, setProfileId, customThresholds, setCustomThresholds } =
    useSession();
  const [debugVisible, setDebugVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'appName') }} />
      <DemoBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {t(locale, 'appName')}
          </Text>
          <View style={styles.actionButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Panel testowy i symulacje"
              onPress={() => setDebugVisible(true)}
              style={[styles.smallBtn, { borderColor: colors.border, minHeight: spacing.touch }]}
            >
              <Text style={{ color: colors.text }}>🛠️ Demo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'language')}
              onPress={() => setLocale(locale === 'pl' ? 'en' : 'pl')}
              style={[styles.lang, { borderColor: colors.border, minHeight: spacing.touch }]}
            >
              <Text style={{ color: colors.text }}>{t(locale, 'language')}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.lead, { color: colors.text }]}>{t(locale, 'profileTitle')}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'profileLead')}</Text>

        <View accessibilityRole="radiogroup" style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = profileId === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                accessibilityLabel={`${t(locale, option.title)}. ${t(locale, option.hint)}`}
                onPress={() => setProfileId(option.id)}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selected ? colors.focus : colors.border,
                    minHeight: spacing.touch,
                  },
                ]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  {t(locale, option.title)}
                </Text>
                <Text style={[styles.body, { color: colors.muted }]}>{t(locale, option.hint)}</Text>
                {selected ? (
                  <Text style={[styles.selected, { color: colors.accent }]}>
                    ✓ {t(locale, 'selected')}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {profileId === 'custom' ? (
          <View
            style={[styles.customBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.customTitle, { color: colors.text }]}>
              Dostosuj parametry profilu własnego:
            </Text>
            <Text style={[styles.body, { color: colors.text }]}>
              • Maksymalny krawężnik: {customThresholds.maxKerbMillimetres} mm
            </Text>
            <View style={styles.thresholdButtonsRow}>
              <Pressable
                onPress={() =>
                  setCustomThresholds({
                    ...customThresholds,
                    maxKerbMillimetres: Math.max(10, customThresholds.maxKerbMillimetres - 10),
                  })
                }
                style={[styles.stepBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>-10 mm</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setCustomThresholds({
                    ...customThresholds,
                    maxKerbMillimetres: customThresholds.maxKerbMillimetres + 10,
                  })
                }
                style={[styles.stepBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text }}>+10 mm</Text>
              </Pressable>
            </View>

            <Text style={[styles.body, { color: colors.text }]}>
              • Schody jako blokada: {customThresholds.stepsAreBlocker ? 'TAK (blocker)' : 'NIE (warning)'}
            </Text>
            <Pressable
              onPress={() =>
                setCustomThresholds({
                  ...customThresholds,
                  stepsAreBlocker: !customThresholds.stepsAreBlocker,
                })
              }
              style={[styles.toggleBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text }}>Przełącz traktowanie stopni</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'privacy')}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: profileId === null }}
          disabled={profileId === null}
          onPress={() => router.push('/search')}
          style={[
            styles.primary,
            {
              backgroundColor: profileId ? colors.accent : colors.border,
              minHeight: spacing.touch,
            },
          ]}
        >
          <Text style={[styles.primaryText, { color: profileId ? colors.accentText : colors.muted }]}>
            {t(locale, 'continue')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/about')}
          style={[styles.secondary, { borderColor: colors.border, minHeight: spacing.touch }]}
        >
          <Text style={{ color: colors.text }}>{t(locale, 'about')}</Text>
        </Pressable>
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  options: { gap: spacing.stack },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  actionButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', flexShrink: 1 },
  lead: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22 },
  option: { borderWidth: 2, borderRadius: 12, padding: 12, gap: 4 },
  optionTitle: { fontSize: 18, fontWeight: '600' },
  selected: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  lang: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  smallBtn: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 10, justifyContent: 'center' },
  primary: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondary: { borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customBox: { borderWidth: 2, borderRadius: 12, padding: 12, gap: 8 },
  customTitle: { fontSize: 16, fontWeight: '700' },
  thresholdButtonsRow: { flexDirection: 'row', gap: 10 },
  stepBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  toggleBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
});

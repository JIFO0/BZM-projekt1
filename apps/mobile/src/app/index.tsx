import type { ProfileId } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { locale, setLocale, profileId, setProfileId } = useSession();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'appName') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {t(locale, 'appName')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'language')}
            onPress={() => setLocale(locale === 'pl' ? 'en' : 'pl')}
            style={[styles.lang, { borderColor: colors.border, minHeight: spacing.touch }]}
          >
            <Text style={{ color: colors.text }}>{t(locale, 'language')}</Text>
          </Pressable>
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
              <Text style={[styles.optionTitle, { color: colors.text }]}>{t(locale, option.title)}</Text>
              <Text style={[styles.body, { color: colors.muted }]}>{t(locale, option.hint)}</Text>
              {selected ? (
                <Text style={[styles.selected, { color: colors.text }]}>{t(locale, 'selected')}</Text>
              ) : null}
            </Pressable>
          );
        })}
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  options: { gap: spacing.stack },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', flexShrink: 1 },
  lead: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  option: { borderWidth: 2, borderRadius: 12, padding: 12, gap: 4 },
  optionTitle: { fontSize: 18, fontWeight: '600' },
  selected: { fontSize: 16, fontWeight: '700' },
  lang: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  primary: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondary: { borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

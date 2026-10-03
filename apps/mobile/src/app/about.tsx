import { MAPY_ATTRIBUTION, MAPY_LOGO, OSM_ATTRIBUTION, OSM_ODBL_URL } from '@krakow-bez-barier/core';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { city } from '@/config/city';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function AboutScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale } = useSession();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: t(locale, 'about') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {t(locale, 'aboutTitle')}
        </Text>
        <Text style={[styles.body, { color: colors.text }]}>{t(locale, 'aboutLead')}</Text>
        <SourceBlock
          name={MAPY_ATTRIBUTION.name}
          uses={t(locale, 'mapyUses')}
          licence={MAPY_ATTRIBUTION.licence}
          credit={MAPY_ATTRIBUTION.attribution}
          url={MAPY_LOGO.copyrightHref}
          colors={colors}
          creditLabel={t(locale, 'copyrightLabel')}
        />
        <Text accessibilityLabel={t(locale, 'logoLabel')} style={[styles.meta, { color: colors.muted }]}>
          {t(locale, 'logoLabel')}: {MAPY_LOGO.svg}
        </Text>
        <SourceBlock
          name={OSM_ATTRIBUTION.name}
          uses={t(locale, 'osmUses')}
          licence={`${OSM_ATTRIBUTION.licence} ${OSM_ODBL_URL}`}
          credit={OSM_ATTRIBUTION.attribution}
          url={OSM_ATTRIBUTION.url}
          colors={colors}
          creditLabel={t(locale, 'copyrightLabel')}
        />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(locale, 'demoArea')}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{city.demoArea.label}</Text>
          {city.demoArea.provisional ? (
            <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'provisional')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SourceBlock({
  name,
  uses,
  licence,
  credit,
  url,
  creditLabel,
  colors,
}: {
  name: string;
  uses: string;
  licence: string;
  credit: string;
  url: string;
  creditLabel: string;
  colors: typeof lightColors;
}) {
  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.body, { color: colors.text }]}>{uses}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{licence}</Text>
      <Text style={[styles.body, { color: colors.text }]}>
        {creditLabel}: {credit}
      </Text>
      <Text style={[styles.meta, { color: colors.muted }]}>{url}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 2, borderRadius: 12, padding: 12, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
});

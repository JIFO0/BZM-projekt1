import {
  DEMO_SNAPSHOT,
  MAPY_ATTRIBUTION,
  MAPY_LOGO,
  OSM_ATTRIBUTION,
  OSM_ODBL_URL,
} from '@krakow-bez-barier/core';
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
        <Text style={[styles.lead, { color: colors.text }]}>{t(locale, 'aboutTitle')}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'aboutLead')}</Text>

        {/* Mapy.com source */}
        <SourceBlock
          name={MAPY_ATTRIBUTION.name}
          uses={t(locale, 'mapyUses')}
          licence={MAPY_ATTRIBUTION.licence}
          credit={MAPY_ATTRIBUTION.attribution}
          url={MAPY_LOGO.copyrightHref}
          colors={colors}
          creditLabel={t(locale, 'copyrightLabel')}
        />

        {/* Mapy Logo text attribution required by M4 */}
        <View style={[styles.logoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {t(locale, 'logoLabel')}:
          </Text>
          <Text style={[styles.logoText, { color: '#C62828' }]}>
            mapy.cz / api.mapy.com
          </Text>
        </View>

        {/* OSM source */}
        <SourceBlock
          name={OSM_ATTRIBUTION.name}
          uses={t(locale, 'osmUses')}
          licence={`${OSM_ATTRIBUTION.licence} (${OSM_ODBL_URL})`}
          credit={OSM_ATTRIBUTION.attribution}
          url={OSM_ATTRIBUTION.url}
          colors={colors}
          creditLabel={t(locale, 'copyrightLabel')}
        />

        {/* Demo snapshot info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>📦 Wbudowany snapshot offline</Text>
          <Text style={[styles.body, { color: colors.text }]}>
            Wersja: {DEMO_SNAPSHOT.snapshotVersion} ({DEMO_SNAPSHOT.label})
          </Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            Data wygenerowania: {DEMO_SNAPSHOT.generatedAt.slice(0, 10)}
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            Obszar: {DEMO_SNAPSHOT.demoArea}
          </Text>
        </View>

        {/* Demo Area */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(locale, 'demoArea')}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{city.demoArea.label}</Text>
          {city.demoArea.provisional ? (
            <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'provisional')}</Text>
          ) : null}
        </View>

        {/* Privacy Summary (P1-P5) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>🔒 Prywatność i ochrona danych (P1–P5)</Text>
          <Text style={[styles.body, { color: colors.text }]}>
            • Brak kont użytkowników, brak logowania, brak baz danych w chmurze.
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            • Brak systemów analitycznych, śledzących i reklamowych SDK.
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            • Wybór profilu oraz zgłoszenia korekt zapisywane są wyłącznie lokalnie na Twoim urządzeniu.
          </Text>
          <Text style={[styles.body, { color: colors.text }]}>
            • Zapytania sieciowe zawierają wyłącznie współrzędne trasy (przesyłane do Mapy.com i Overpass API) bez jakichkolwiek danych osobowych.
          </Text>
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
      <Text style={[styles.meta, { color: colors.muted }]}>Licencja: {licence}</Text>
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
  lead: { fontSize: 20, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22 },
  meta: { fontSize: 13, lineHeight: 18 },
  card: { borderWidth: 2, borderRadius: 12, padding: 14, gap: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  logoCard: { borderWidth: 1.5, borderRadius: 10, padding: 10, gap: 4 },
  logoText: { fontSize: 18, fontWeight: '900' },
});

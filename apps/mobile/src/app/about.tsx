import {
  DEMO_SNAPSHOT,
  MAPY_ATTRIBUTION,
  MAPY_LOGO,
  OSM_ATTRIBUTION,
  OSM_ODBL_URL,
} from '@krakow-bez-barier/core';
import { Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebugModal } from '@/components/DebugModal';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { city } from '@/config/city';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function AboutScreen() {
  const {
    locale,
    colors,
    fontSize,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleReadScreen = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const text = `${t(locale, 'aboutTitle')}. ${t(
      locale,
      'aboutLead',
    )}. Źródła danych: Mapy.com dla tras pieszych i geokodowania, OpenStreetMap ODbL dla geometrii barier. Wbudowany snapshot offline wersji ${
      DEMO_SNAPSHOT.snapshotVersion
    }. Prywatność: brak kont, brak logowania, 100% lokalne przetwarzanie na urządzeniu.`;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: locale === 'pl' ? 'pl-PL' : 'en-US',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'about') }} />

      <KrakowHeader
        onOpenDemo={() => setDebugVisible(true)}
        onReadScreen={handleReadScreen}
        isSpeaking={isSpeaking}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        <GovCard variant="accent">
          <Text
            accessibilityRole="header"
            style={[
              styles.lead,
              {
                color: colors.text,
                fontSize: fontSize(21),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
              },
            ]}
          >
            {t(locale, 'aboutTitle')}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: colors.muted,
                fontSize: fontSize(14.5),
                lineHeight: fontSize(22),
              },
            ]}
          >
            {t(locale, 'aboutLead')}
          </Text>
        </GovCard>

        {/* Mapy.com source */}
        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            🗺️ {MAPY_ATTRIBUTION.name}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'mapyUses')}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            Licencja: {MAPY_ATTRIBUTION.licence}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'copyrightLabel')}: {MAPY_ATTRIBUTION.attribution}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12) }]}>
            {MAPY_LOGO.copyrightHref}
          </Text>
        </GovCard>

        {/* Mapy Logo text attribution required by M4 */}
        <GovCard variant="default">
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12) }]}>
            {t(locale, 'logoLabel')}:
          </Text>
          <Text style={[styles.logoText, { color: '#C62828', fontSize: fontSize(18) }]}>
            mapy.cz / api.mapy.com
          </Text>
        </GovCard>

        {/* OSM source */}
        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            🌐 {OSM_ATTRIBUTION.name}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'osmUses')}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            Licencja: {`${OSM_ATTRIBUTION.licence} (${OSM_ODBL_URL})`}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'copyrightLabel')}: {OSM_ATTRIBUTION.attribution}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12) }]}>
            {OSM_ATTRIBUTION.url}
          </Text>
        </GovCard>

        {/* Deklaracja Dostępności Gov */}
        <GovCard variant="accent">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            🏛️ Deklaracja Dostępności Cyfrowej (WCAG 2.2 AAA & EAA)
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14), lineHeight: fontSize(21) }]}>
            System został zaprojektowany z myślą o pełnej dostępności cyfrowej i architektonicznej zgodnie z:
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Standardem WCAG 2.2 (poziomy AA oraz wybrane kryteria AAA: kontrast &gt; 7:1, rozmiar celów dotykowych min. 48–56 px).
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Europejskim Aktem o Dostępności (Directive 2019/882 / EAA).
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych.
          </Text>
        </GovCard>

        {/* Demo snapshot info */}
        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            📦 Wbudowany snapshot offline
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            Wersja: {DEMO_SNAPSHOT.snapshotVersion} ({DEMO_SNAPSHOT.label})
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            Data wygenerowania: {DEMO_SNAPSHOT.generatedAt.slice(0, 10)}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            Obszar: {DEMO_SNAPSHOT.demoArea}
          </Text>
        </GovCard>

        {/* Demo Area */}
        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            📍 {t(locale, 'demoArea')}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {city.demoArea.label}
          </Text>
          {city.demoArea.provisional ? (
            <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(13) }]}>
              {t(locale, 'provisional')}
            </Text>
          ) : null}
        </GovCard>

        {/* Privacy Summary (P1-P5) */}
        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            🔒 Prywatność i ochrona danych (P1–P5)
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Brak kont użytkowników, brak logowania, brak baz danych w chmurze.
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Brak systemów analitycznych, śledzących i reklamowych SDK.
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Wybór profilu oraz zgłoszenia korekt zapisywane są wyłącznie lokalnie na Twoim urządzeniu.
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • Zapytania sieciowe zawierają wyłącznie współrzędne trasy (przesyłane do Mapy.com i Overpass API) bez jakichkolwiek danych osobowych.
          </Text>
        </GovCard>

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
  lead: {
    fontWeight: '800',
  },
  body: {
    fontWeight: '500',
  },
  meta: {
    fontWeight: '500',
  },
  cardTitle: {
    fontWeight: '800',
  },
  logoText: {
    fontWeight: '900',
  },
});

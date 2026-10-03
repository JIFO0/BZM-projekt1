import {
  CREDIBILITY_LADDER,
  DEMO_SNAPSHOT,
  GEOPORTAL_BDOT10K_ATTRIBUTION,
  MAPY_ATTRIBUTION,
  MAPY_LOGO,
  OSM_ATTRIBUTION,
  OSM_ODBL_URL,
} from '@krakow-bez-barier/core';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MapTrifold,
  Globe,
  ShieldCheck,
  Archive,
  MapPin,
  LockKey,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { credibilityLabel } from '@/components/CredibilityNote';
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


  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'about') }} />
      <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />

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
          <View style={styles.cardHeaderRow}>
            <MapTrifold size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {MAPY_ATTRIBUTION.name}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'mapyUses')}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            {t(locale, 'licenseLabel')}: {MAPY_ATTRIBUTION.licence}
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

        {/* Geoportal.gov.pl BDOT10k Topographic Map Source */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <MapTrifold size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {GEOPORTAL_BDOT10K_ATTRIBUTION.name}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {locale === 'pl'
              ? 'Oficjalna państwowa mapa topograficzna BDOT10k (Baza Danych Obiektów Topograficznych w skali 1:10 000) Głównego Urzędu Geodezji i Kartografii (GUGiK). Zapewnia przejrzysty, czytelny i stabilny podkład kartograficzny zgodny ze standardami państwowymi RP.'
              : 'Official Polish national topographic database BDOT10k (1:10 000 scale) provided by the Head Office of Geodesy and Cartography (GUGiK). Provides clear and reliable governmental basemaps.'}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            {t(locale, 'licenseLabel')}: {GEOPORTAL_BDOT10K_ATTRIBUTION.licence}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'copyrightLabel')}: {GEOPORTAL_BDOT10K_ATTRIBUTION.attribution}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12) }]}>
            {GEOPORTAL_BDOT10K_ATTRIBUTION.url}
          </Text>
        </GovCard>

        {/* OSM source */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <Globe size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {OSM_ATTRIBUTION.name}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'osmUses')}
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            {t(locale, 'licenseLabel')}: {`${OSM_ATTRIBUTION.licence} (${OSM_ODBL_URL})`}
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
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {locale === 'pl'
                ? 'Deklaracja Dostępności Cyfrowej (WCAG 2.2 AAA & EAA)'
                : locale === 'uk'
                  ? 'Декларація цифрової доступності (WCAG 2.2 AAA & EAA)'
                  : 'Digital Accessibility Declaration (WCAG 2.2 AAA & EAA)'}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14), lineHeight: fontSize(21) }]}>
            {locale === 'pl'
              ? 'System został zaprojektowany z myślą o pełnej dostępności cyfrowej i architektonicznej zgodnie z:'
              : locale === 'uk'
                ? 'Система розроблена з урахуванням повної цифрової та архітектурної доступності відповідно до:'
                : 'The system has been designed for full digital and architectural accessibility in accordance with:'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Standardem WCAG 2.2 (poziomy AA oraz wybrane kryteria AAA: kontrast > 7:1, rozmiar celów dotykowych min. 48–56 px).'
                : locale === 'uk'
                  ? 'Стандартом WCAG 2.2 (рівні AA та вибрані критерії AAA: контраст > 7:1, розмір цілей дотику мін. 48–56 px).'
                  : 'WCAG 2.2 standard (AA level and selected AAA criteria: contrast > 7:1, touch target size min. 48–56 px).'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Europejskim Aktem o Dostępności (Directive 2019/882 / EAA).'
                : locale === 'uk'
                  ? 'Європейським актом про доступність (Директива 2019/882 / EAA).'
                  : 'European Accessibility Act (Directive 2019/882 / EAA).'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Ustawą z dnia 4 kwietnia 2019 r. o dostępności cyfrowej stron internetowych i aplikacji mobilnych podmiotów publicznych.'
                : locale === 'uk'
                  ? 'Законом про цифрову доступність вебсайтів і мобільних додатків публічних суб’єктів.'
                  : 'Polish Act of 4 April 2019 on digital accessibility of public entities websites and mobile applications.'}
          </Text>
        </GovCard>

        <GovCard variant="default">
          <Text
            accessibilityRole="header"
            style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
          >
            {t(locale, 'credibilityLegendTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14), lineHeight: fontSize(21) }]}>
            {t(locale, 'credibilityLegendLead')}
          </Text>
          {CREDIBILITY_LADDER.map((row) => (
            <Text
              key={row.rank}
              style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}
            >
              {row.score} · {credibilityLabel(locale, row.rank)}
            </Text>
          ))}
        </GovCard>

        {/* Demo snapshot info */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <Archive size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {locale === 'pl'
                ? 'Wbudowany snapshot offline'
                : locale === 'uk'
                  ? 'Вбудований офлайн-знімок'
                  : 'Built-in offline snapshot'}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {locale === 'pl' ? 'Wersja' : locale === 'uk' ? 'Версія' : 'Version'}: {DEMO_SNAPSHOT.snapshotVersion} ({DEMO_SNAPSHOT.label})
          </Text>
          <Text style={[styles.meta, { color: colors.muted, fontSize: fontSize(12.5) }]}>
            {locale === 'pl' ? 'Data wygenerowania' : locale === 'uk' ? 'Дата створення' : 'Generation date'}: {DEMO_SNAPSHOT.generatedAt.slice(0, 10)}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {locale === 'pl' ? 'Obszar' : locale === 'uk' ? 'Зона' : 'Area'}: {DEMO_SNAPSHOT.demoArea}
          </Text>
        </GovCard>

        {/* Demo Area */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <MapPin size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {t(locale, 'demoArea')}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
            {city.demoArea.label}
          </Text>
          {city.demoArea.provisional ? (
            <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(13.5) }]}>
              {t(locale, 'provisional')}
            </Text>
          ) : null}
        </GovCard>

        {/* Privacy Summary (P1-P5) */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <LockKey size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(17) }]}
            >
              {locale === 'pl'
                ? 'Prywatność i ochrona danych (P1–P5)'
                : locale === 'uk'
                  ? 'Конфіденційність та захист даних (P1–P5)'
                  : 'Privacy & Data Protection (P1–P5)'}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Prywatność by default: Konto e-mail działa wyłącznie lokalnie (mockup konta) — żadne dane użytkownika nie są zapisywane na serwerze.'
                : locale === 'uk'
                  ? 'Конфіденційність за замовчуванням: Email-акаунт працює виключно локально (mockup) — жодні дані користувача не зберігаються на сервері.'
                  : 'Privacy by default: Email account operates strictly locally (mockup account) — zero user data is stored on any server.'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Brak systemów analitycznych, śledzących i reklamowych SDK.'
                : locale === 'uk'
                  ? 'Без систем аналітики, трекерів та рекламних SDK.'
                  : 'No analytics, tracking, or advertising SDKs.'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Wybór profilu oraz zgłoszenia korekt zapisywane są wyłącznie lokalnie na Twoim urządzeniu.'
                : locale === 'uk'
                  ? 'Вибір профілю та повідомлення про корективи зберігаються виключно локально на вашому пристрої.'
                  : 'Profile choices and reports are stored strictly locally on your device.'}
          </Text>
          <Text style={[styles.body, { color: colors.text, fontSize: fontSize(13.5) }]}>
            • {locale === 'pl'
                ? 'Zapytania sieciowe zawierają wyłącznie współrzędne trasy (przesyłane do Mapy.com i Overpass API) bez jakichkolwiek danych osobowych.'
                : locale === 'uk'
                  ? 'Мережеві запити містять лише координати маршруту (передаються до Mapy.com та Overpass API) без будь-яких персональних даних.'
                  : 'Network requests only contain route coordinates (sent to Mapy.com and Overpass API) without any personal information.'}
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
});

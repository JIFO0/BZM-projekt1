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
    const detailsNarrative =
      locale === 'pl'
        ? `Źródła danych: Mapy.com dla tras pieszych i geokodowania, OpenStreetMap ODbL dla geometrii barier. Wbudowany snapshot offline wersji ${DEMO_SNAPSHOT.snapshotVersion}. Prywatność: brak kont, brak logowania, 100% lokalne przetwarzanie na urządzeniu.`
        : locale === 'uk'
          ? `Джерела даних: Mapy.com для пішохідних маршрутів і геокодування, OpenStreetMap ODbL для геометрії перешкод. Вбудований офлайн-знімок версії ${DEMO_SNAPSHOT.snapshotVersion}. Конфіденційність: без акаунтів, без авторизації, 100% локальна обробка на пристрої.`
          : `Data sources: Mapy.com for walking routes and geocoding, OpenStreetMap ODbL for barrier geometry. Built-in offline snapshot version ${DEMO_SNAPSHOT.snapshotVersion}. Privacy: no accounts, no login, 100% local processing on device.`;

    const text = `${t(locale, 'aboutTitle')}. ${t(locale, 'aboutLead')}. ${detailsNarrative}`;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: locale === 'pl' ? 'pl-PL' : locale === 'uk' ? 'uk-UA' : 'en-US',
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
                ? 'Brak kont użytkowników, brak logowania, brak baz danych w chmurze.'
                : locale === 'uk'
                  ? 'Без облікових записів, без авторизації, без хмарних баз даних.'
                  : 'No user accounts, no login required, no cloud databases.'}
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

import {
  noBarrierSentenceAllowed,
  type RouteFinding,
} from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverageBar } from '@/components/CoverageBar';
import { DemoBanner } from '@/components/DemoBanner';
import { MapView } from '@/components/MapView';
import { RouteFindingRow } from '@/components/RouteFindingRow';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function RouteScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale, activeRouteReport, activeWalkingRoute } = useSession();

  const [showMap, setShowMap] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!activeRouteReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t(locale, 'routeReportTitle') }} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Brak aktywnego raportu trasy.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: colors.accentText, fontWeight: '700' }}>Wróć do wyszukiwania</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const report = activeRouteReport;
  const blockers = report.findings.filter((f) => f.severity === 'blocker');
  const warnings = report.findings.filter((f) => f.severity === 'warning');
  const okItems = report.findings.filter((f) => f.severity === 'ok');
  const infoItems = report.findings.filter((f) => f.severity === 'info');
  const unknownItems = report.findings.filter((f) => f.severity === 'unknown');

  const overallCoverageRatio =
    report.coverage.length > 0
      ? report.coverage.reduce((acc, c) => acc + (c.ratio ?? 0), 0) / report.coverage.length
      : null;

  const showNoBarriersSentence = noBarrierSentenceAllowed({
    barrierCount: blockers.length + warnings.length,
    coverageRatio: overallCoverageRatio,
    minCoverage: 0.8,
  });

  // Plain-text narrative for Voice / Share (WCAG D5 / WOW)
  const generateNarrative = () => {
    let narrative = `Raport barier dla trasy o długości ${report.lengthMetres} metrów. `;
    narrative += `Wykryto ${blockers.length} blokad, ${warnings.length} ostrzeżeń oraz ${unknownItems.length} elementów o nieznanym stanie. `;
    narrative += `Najdłuższy odcinek bez danych wynosi ${report.longestUnknownStretchMetres} metrów. `;
    if (showNoBarriersSentence) {
      narrative += 'Nie znaleziono przeszkód w dostępnych danych. ';
    }
    narrative += 'Główne punkty na trasie: ';
    report.findings.forEach((f, idx) => {
      narrative += `Punkt ${idx + 1}, po ${f.distanceFromStartMetres} metrach: ${f.type}, ${f.fact.value}. `;
    });
    return narrative;
  };

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(generateNarrative(), {
        language: locale === 'pl' ? 'pl-PL' : 'en-US',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Kraków bez barier - Raport trasy',
        message: generateNarrative(),
      });
    } catch {
      Alert.alert('Błąd', 'Nie udało się udostępnić raportu.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: t(locale, 'routeReportTitle') }} />
      <DemoBanner isSample={report.isSample} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* SUMMARY CARD (R10) */}
        <View
          accessibilityRole="summary"
          style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            📊 {t(locale, 'summaryCardTitle')}
          </Text>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.muted }]}>{t(locale, 'routeLength')}:</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{report.lengthMetres} m</Text>
          </View>

          {activeWalkingRoute?.durationSeconds ? (
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>{t(locale, 'routeDuration')}:</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {Math.round(activeWalkingRoute.durationSeconds / 60)} min
              </Text>
            </View>
          ) : null}

          {/* Counts of barriers by severity */}
          <View style={styles.countsGrid}>
            <View
              style={[styles.countBadge, { backgroundColor: colors.blockerBg, borderColor: colors.blockerBorder }]}
            >
              <Text style={[styles.countNumber, { color: colors.blockerText }]}>{blockers.length}</Text>
              <Text style={[styles.countText, { color: colors.blockerText }]}>
                ⛔ {t(locale, 'blockersCount')}
              </Text>
            </View>

            <View
              style={[styles.countBadge, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}
            >
              <Text style={[styles.countNumber, { color: colors.warningText }]}>{warnings.length}</Text>
              <Text style={[styles.countText, { color: colors.warningText }]}>
                ⚠️ {t(locale, 'warningsCount')}
              </Text>
            </View>

            <View
              style={[styles.countBadge, { backgroundColor: colors.unknownBg, borderColor: colors.unknownBorder }]}
            >
              <Text style={[styles.countNumber, { color: colors.unknownText }]}>{unknownItems.length}</Text>
              <Text style={[styles.countText, { color: colors.unknownText }]}>
                ❓ {t(locale, 'unknownCount')}
              </Text>
            </View>

            <View
              style={[styles.countBadge, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}
            >
              <Text style={[styles.countNumber, { color: colors.okText }]}>
                {okItems.length + infoItems.length}
              </Text>
              <Text style={[styles.countText, { color: colors.okText }]}>
                ✅ Udogodnienia
              </Text>
            </View>
          </View>

          {/* Longest stretch with no data (R9) */}
          <View style={[styles.highlightBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.highlightTitle, { color: colors.text }]}>
              📏 {t(locale, 'longestUnknownStretch')}:
            </Text>
            <Text style={[styles.highlightValue, { color: colors.accent }]}>
              {report.longestUnknownStretchMetres} metrów ciągłego braku danych
            </Text>
          </View>

          {/* Coverage stats (R9) */}
          <Text style={[styles.subTitle, { color: colors.text, marginTop: 6 }]}>
            📈 {t(locale, 'dataCoverage')}:
          </Text>
          {report.coverage.map((stat, i) => (
            <CoverageBar key={i} stat={stat} />
          ))}

          {/* Standing caveat notice */}
          {showNoBarriersSentence ? (
            <View
              accessibilityRole="alert"
              style={[styles.bannerAlert, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}
            >
              <Text style={[styles.bannerAlertText, { color: colors.okText }]}>
                ✓ {t(locale, 'noBarriersFound')}
              </Text>
            </View>
          ) : (
            <View
              accessibilityRole="text"
              style={[styles.bannerAlert, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}
            >
              <Text style={[styles.bannerAlertText, { color: colors.infoText }]}>
                ℹ️ {t(locale, 'caveatNotice')}
              </Text>
            </View>
          )}

          {/* WOW Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? t(locale, 'stopSpeech') : t(locale, 'readAloud')}
              onPress={handleSpeechToggle}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isSpeaking ? colors.warningBg : colors.accent,
                  borderColor: isSpeaking ? colors.warningBorder : colors.accent,
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: isSpeaking ? colors.warningText : colors.accentText }]}>
                {isSpeaking ? '⏹️ ' + t(locale, 'stopSpeech') : '🔊 ' + t(locale, 'readAloud')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'shareSummary')}
              onPress={handleShare}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>
                📤 {t(locale, 'shareSummary')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/report-correction' as any)}
            style={[styles.reportBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.accent, fontWeight: '700' }}>
              ✍️ {t(locale, 'reportCorrection')}
            </Text>
          </Pressable>
        </View>

        {/* MAP TOGGLE AND COMPONENT */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showMap ? t(locale, 'hideMap') : t(locale, 'showMap')}
          onPress={() => setShowMap(!showMap)}
          style={[styles.toggleMapBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.toggleMapText, { color: colors.text }]}>
            🗺️ {showMap ? t(locale, 'hideMap') : t(locale, 'showMap')}
          </Text>
        </Pressable>

        {showMap ? (
          <MapView route={activeWalkingRoute} findings={report.findings} />
        ) : null}

        {/* ORDERED FINDINGS LIST (R3, R5, R6) */}
        <View style={styles.findingsSection}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
            📋 {t(locale, 'findingsListTitle')} ({report.findings.length})
          </Text>
          <Text style={[styles.metaText, { color: colors.muted }]}>
            Uporządkowane rosnąco według odległości od startu:
          </Text>

          {report.findings.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.metaText, { color: colors.text }]}>
                Brak zarejestrowanych elementów w OpenStreetMap w korytarzu tej trasy.
              </Text>
            </View>
          ) : (
            report.findings.map((finding: RouteFinding, index: number) => (
              <RouteFindingRow
                key={finding.id}
                finding={finding}
                index={index}
                locale={locale}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  summaryCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 19, fontWeight: '800' },
  subTitle: { fontSize: 16, fontWeight: '700' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 15, fontWeight: '600' },
  metricValue: { fontSize: 15, fontWeight: '700' },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  countBadge: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  countNumber: { fontSize: 22, fontWeight: '900' },
  countText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  highlightBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  highlightTitle: { fontSize: 14, fontWeight: '700' },
  highlightValue: { fontSize: 15, fontWeight: '700' },
  bannerAlert: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  bannerAlertText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.touch,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  reportBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  toggleMapBtn: {
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: spacing.touch,
  },
  toggleMapText: { fontSize: 15, fontWeight: '700' },
  findingsSection: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  metaText: { fontSize: 14, lineHeight: 20 },
  emptyBox: { borderWidth: 1.5, borderRadius: 10, padding: 14 },
  primaryBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
});

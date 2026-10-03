import {
  noBarrierSentenceAllowed,
  type RouteFinding,
} from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChartBar,
  Prohibit,
  Warning,
  CheckCircle,
  Question,
  Ruler,
  ChartLineUp,
  Info,
  SpeakerHigh,
  Stop,
  ShareNetwork,
  NotePencil,
  MapTrifold,
  ListChecks,
  ArrowLeft,
} from 'phosphor-react-native';
import { CoverageBar } from '@/components/CoverageBar';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { MapView } from '@/components/MapView';
import { RouteFindingRow } from '@/components/RouteFindingRow';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function RouteScreen() {
  const {
    locale,
    activeRouteReport,
    activeWalkingRoute,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
    userLocation,
  } = useSession();

  const [showMap, setShowMap] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  if (!activeRouteReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'routeReportTitle') }} />
        <KrakowHeader onOpenDemo={() => setDebugVisible(true)} />
        <View style={styles.emptyContainer}>
          <GovCard variant="warning">
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
              Brak aktywnego raportu trasy.
            </Text>
            <GovButton
              title="Wróć do wyszukiwania"
              icon={<ArrowLeft size={18} color="#fff" weight="bold" />}
              variant="primary"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            />
          </GovCard>
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'routeReportTitle') }} />

      <KrakowHeader
        onOpenDemo={() => setDebugVisible(true)}
        onReadScreen={handleSpeechToggle}
        isSpeaking={isSpeaking}
      />

      <DemoBanner isSample={report.isSample} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* SUMMARY CARD (R10) */}
        <GovCard variant="accent">
          <View style={styles.cardHeaderRow}>
            <View style={styles.inlineHeaderRow}>
              <ChartBar size={22} color={colors.accent} weight="bold" />
              <Text
                accessibilityRole="header"
                style={[
                  styles.cardTitle,
                  {
                    color: colors.text,
                    fontSize: fontSize(19),
                    letterSpacing: dyslexicFont ? 1.2 : 0.3,
                  },
                ]}
              >
                {t(locale, 'summaryCardTitle')}
              </Text>
            </View>
            <View
              style={[
                styles.cityTag,
                {
                  backgroundColor: isHighContrast ? colors.background : colors.badgeBg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.cityTagText, { color: colors.accent, fontSize: fontSize(11) }]}>
                KRAKÓW TRASA
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.muted, fontSize: fontSize(14.5) }]}>
              {t(locale, 'routeLength')}:
            </Text>
            <Text style={[styles.metricValue, { color: colors.text, fontSize: fontSize(15) }]}>
              {report.lengthMetres} m
            </Text>
          </View>

          {activeWalkingRoute?.durationSeconds ? (
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.muted, fontSize: fontSize(14.5) }]}>
                {t(locale, 'routeDuration')}:
              </Text>
              <Text style={[styles.metricValue, { color: colors.text, fontSize: fontSize(15) }]}>
                {Math.round(activeWalkingRoute.durationSeconds / 60)} min
              </Text>
            </View>
          ) : null}

          {/* Counts of barriers by severity */}
          <View style={styles.countsGrid}>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: colors.blockerBg,
                  borderColor: colors.blockerBorder,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              <Text style={[styles.countNumber, { color: colors.blockerText, fontSize: fontSize(22) }]}>
                {blockers.length}
              </Text>
              <View style={styles.inlineBadgeLabel}>
                <Prohibit size={15} color={colors.blockerText} weight="bold" />
                <Text style={[styles.countText, { color: colors.blockerText, fontSize: fontSize(12) }]}>
                  {t(locale, 'blockersCount')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: colors.warningBg,
                  borderColor: colors.warningBorder,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              <Text style={[styles.countNumber, { color: colors.warningText, fontSize: fontSize(22) }]}>
                {warnings.length}
              </Text>
              <View style={styles.inlineBadgeLabel}>
                <Warning size={15} color={colors.warningText} weight="bold" />
                <Text style={[styles.countText, { color: colors.warningText, fontSize: fontSize(12) }]}>
                  {t(locale, 'warningsCount')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: colors.unknownBg,
                  borderColor: colors.unknownBorder,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              <Text style={[styles.countNumber, { color: colors.unknownText, fontSize: fontSize(22) }]}>
                {unknownItems.length}
              </Text>
              <View style={styles.inlineBadgeLabel}>
                <Question size={15} color={colors.unknownText} weight="bold" />
                <Text style={[styles.countText, { color: colors.unknownText, fontSize: fontSize(12) }]}>
                  {t(locale, 'unknownCount')}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: colors.okBg,
                  borderColor: colors.okBorder,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              <Text style={[styles.countNumber, { color: colors.okText, fontSize: fontSize(22) }]}>
                {okItems.length + infoItems.length}
              </Text>
              <View style={styles.inlineBadgeLabel}>
                <CheckCircle size={15} color={colors.okText} weight="bold" />
                <Text style={[styles.countText, { color: colors.okText, fontSize: fontSize(12) }]}>
                  Udogodnienia
                </Text>
              </View>
            </View>
          </View>

          {/* Longest stretch with no data (R9) */}
          <View
            style={[
              styles.highlightBox,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: isHighContrast ? 2 : 1.5,
              },
            ]}
          >
            <View style={styles.inlineHeaderRow}>
              <Ruler size={17} color={colors.accent} weight="bold" />
              <Text style={[styles.highlightTitle, { color: colors.text, fontSize: fontSize(14) }]}>
                {t(locale, 'longestUnknownStretch')}:
              </Text>
            </View>
            <Text style={[styles.highlightValue, { color: colors.accent, fontSize: fontSize(14.5) }]}>
              {report.longestUnknownStretchMetres} metrów ciągłego braku danych
            </Text>
          </View>

          {/* Coverage stats (R9) */}
          <View style={[styles.inlineHeaderRow, { marginTop: 6 }]}>
            <ChartLineUp size={18} color={colors.accent} weight="bold" />
            <Text style={[styles.subTitle, { color: colors.text, fontSize: fontSize(15.5) }]}>
              {t(locale, 'dataCoverage')}:
            </Text>
          </View>
          {report.coverage.map((stat, i) => (
            <CoverageBar key={i} stat={stat} />
          ))}

          {/* Standing caveat notice */}
          {showNoBarriersSentence ? (
            <View
              accessibilityRole="alert"
              style={[styles.bannerAlert, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}
            >
              <View style={styles.inlineNoticeRow}>
                <CheckCircle size={18} color={colors.okText} weight="bold" />
                <Text style={[styles.bannerAlertText, { color: colors.okText, fontSize: fontSize(13.5), flex: 1 }]}>
                  {t(locale, 'noBarriersFound')}
                </Text>
              </View>
            </View>
          ) : (
            <View
              accessibilityRole="text"
              style={[styles.bannerAlert, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}
            >
              <View style={styles.inlineNoticeRow}>
                <Info size={18} color={colors.infoText} weight="bold" />
                <Text style={[styles.bannerAlertText, { color: colors.infoText, fontSize: fontSize(13.5), flex: 1 }]}>
                  {t(locale, 'caveatNotice')}
                </Text>
              </View>
            </View>
          )}

          {/* Audio & Share buttons */}
          <View style={styles.actionRow}>
            <GovButton
              title={isSpeaking ? t(locale, 'stopSpeech') : t(locale, 'readAloud')}
              icon={
                isSpeaking ? (
                  <Stop size={18} color="#fff" weight="bold" />
                ) : (
                  <SpeakerHigh size={18} color="#fff" weight="bold" />
                )
              }
              variant={isSpeaking ? 'danger' : 'primary'}
              onPress={handleSpeechToggle}
              style={{ flex: 1 }}
            />
            <GovButton
              title={t(locale, 'shareSummary')}
              icon={<ShareNetwork size={18} color={colors.text} weight="bold" />}
              variant="outline"
              onPress={handleShare}
              style={{ flex: 1 }}
            />
          </View>

          <GovButton
            title={t(locale, 'reportCorrection')}
            icon={<NotePencil size={18} color={colors.text} weight="bold" />}
            variant="secondary"
            onPress={() => router.push('/report-correction' as any)}
          />
        </GovCard>

        {/* MAP TOGGLE AND COMPONENT */}
        <GovButton
          title={showMap ? t(locale, 'hideMap') : t(locale, 'showMap')}
          icon={<MapTrifold size={18} color={colors.text} weight="bold" />}
          variant="outline"
          onPress={() => setShowMap(!showMap)}
        />

        {showMap ? (
          <MapView
            route={activeWalkingRoute}
            findings={report.findings}
            userLocation={userLocation}
          />
        ) : null}

        {/* ORDERED FINDINGS LIST (R3, R5, R6) */}
        <View style={styles.findingsSection}>
          <View style={styles.inlineHeaderRow}>
            <ListChecks size={22} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize(18) }]}
            >
              {t(locale, 'findingsListTitle')} ({report.findings.length})
            </Text>
          </View>
          <Text style={[styles.metaText, { color: colors.muted, fontSize: fontSize(13.5) }]}>
            Uporządkowane rosnąco według odległości od startu:
          </Text>

          {report.findings.length === 0 ? (
            <GovCard variant="default">
              <Text style={[styles.metaText, { color: colors.text, fontSize: fontSize(14) }]}>
                Brak zarejestrowanych elementów w OpenStreetMap w korytarzu tej trasy.
              </Text>
            </GovCard>
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

        <GovFooter />
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  emptyContainer: {
    padding: 20,
  },
  content: {
    padding: spacing.screen,
    gap: spacing.stack,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '800',
  },
  cityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  cityTagText: {
    fontWeight: '800',
  },
  subTitle: {
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontWeight: '600',
  },
  metricValue: {
    fontWeight: '800',
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  countBadge: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  countNumber: {
    fontWeight: '900',
  },
  countText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  highlightBox: {
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  highlightTitle: {
    fontWeight: '700',
  },
  highlightValue: {
    fontWeight: '800',
  },
  bannerAlert: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  bannerAlertText: {
    lineHeight: 18,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  findingsSection: {
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  metaText: {
    lineHeight: 20,
    fontWeight: '500',
  },
  title: {
    fontWeight: '700',
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineBadgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  inlineNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
});

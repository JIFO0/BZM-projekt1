import {
  DEMO_SNAPSHOT,
  noBarrierSentenceAllowed,
  type RouteFinding,
} from '@krakow-bez-barier/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
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
  Lightning,
  ShieldCheck,
  ShareNetwork,
  NotePencil,
  MapTrifold,
  ListChecks,
  ArrowLeft,
} from 'phosphor-react-native';
import { BarrierViewControl } from '@/components/BarrierViewControl';
import { CoverageBar } from '@/components/CoverageBar';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { MapView } from '@/components/MapView';
import { RouteFindingRow } from '@/components/RouteFindingRow';
import {
  getLocalizedFactValue,
  getLocalizedFindingType,
  t,
} from '@/i18n/strings';
import { fetchServerHazards, planAndAnalyzeRoute, type RouteVariantId, type ServerRouteHazard } from '@/services/api';
import { city } from '@/config/city';
import { citizenReportsAsFindings, selectMapFindings } from '@/services/barriers';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

function extractRouteParams(params: Record<string, any>) {
  let fromName = params.fromName;
  let fromLat = params.fromLat ? parseFloat(params.fromLat) : undefined;
  let fromLon = params.fromLon ? parseFloat(params.fromLon) : undefined;
  let toName = params.toName;
  let toLat = params.toLat ? parseFloat(params.toLat) : undefined;
  let toLon = params.toLon ? parseFloat(params.toLon) : undefined;
  let demoRoute = params.demoRoute !== undefined ? parseInt(params.demoRoute, 10) : undefined;
  let variant = params.variant as string | undefined;

  // Support #u or ?u= encoded payload if provided
  if (params.u) {
    try {
      const decoded = JSON.parse(decodeURIComponent(params.u));
      if (decoded.fromName) fromName = decoded.fromName;
      if (decoded.fromLat !== undefined) fromLat = parseFloat(decoded.fromLat);
      if (decoded.fromLon !== undefined) fromLon = parseFloat(decoded.fromLon);
      if (decoded.toName) toName = decoded.toName;
      if (decoded.toLat !== undefined) toLat = parseFloat(decoded.toLat);
      if (decoded.toLon !== undefined) toLon = parseFloat(decoded.toLon);
      if (decoded.demoRoute !== undefined) demoRoute = parseInt(decoded.demoRoute, 10);
      if (decoded.variant) variant = decoded.variant;
    } catch {}
  }

  // Web fallback: check window.location.search and window.location.hash
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

      const getVal = (k: string) => urlParams.get(k) || hashParams.get(k);

      if (fromLat === undefined && getVal('fromLat')) fromLat = parseFloat(getVal('fromLat')!);
      if (fromLon === undefined && getVal('fromLon')) fromLon = parseFloat(getVal('fromLon')!);
      if (toLat === undefined && getVal('toLat')) toLat = parseFloat(getVal('toLat')!);
      if (toLon === undefined && getVal('toLon')) toLon = parseFloat(getVal('toLon')!);
      if (!fromName && getVal('fromName')) fromName = getVal('fromName')!;
      if (!toName && getVal('toName')) toName = getVal('toName')!;
      if (demoRoute === undefined && getVal('demoRoute')) demoRoute = parseInt(getVal('demoRoute')!, 10);
      if (!variant && getVal('variant')) variant = getVal('variant') ?? undefined;

      const uVal = getVal('u');
      if (uVal) {
        try {
          const decoded = JSON.parse(decodeURIComponent(uVal));
          if (decoded.fromName && !fromName) fromName = decoded.fromName;
          if (decoded.fromLat !== undefined && fromLat === undefined) fromLat = parseFloat(decoded.fromLat);
          if (decoded.fromLon !== undefined && fromLon === undefined) fromLon = parseFloat(decoded.fromLon);
          if (decoded.toName && !toName) toName = decoded.toName;
          if (decoded.toLat !== undefined && toLat === undefined) toLat = parseFloat(decoded.toLat);
          if (decoded.toLon !== undefined && toLon === undefined) toLon = parseFloat(decoded.toLon);
          if (decoded.demoRoute !== undefined && demoRoute === undefined) demoRoute = parseInt(decoded.demoRoute, 10);
          if (decoded.variant && !variant) variant = decoded.variant;
        } catch {}
      }
    } catch {}
  }

  return { fromName, fromLat, fromLon, toName, toLat, toLon, demoRoute, variant };
}

export default function RouteScreen() {
  const {
    locale,
    profileId,
    activeRouteReport,
    setActiveRouteReport,
    activeWalkingRoute,
    setActiveWalkingRoute,
    setActiveRouteFacts,
    setActiveRouteIsSample,
    routeVariants,
    setRouteVariants,
    selectedRouteVariant,
    selectRouteVariant,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
    userLocation,
    barrierViewMode,
    setBarrierViewMode,
    activeThresholds,
    debugState,
    localReports,
  } = useSession();

  const [showMap, setShowMap] = useState(true);
  const [serverHazards, setServerHazards] = useState<ServerRouteHazard[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rawParams = useLocalSearchParams();
  const routeParams = useMemo(() => extractRouteParams(rawParams), [rawParams]);

  // Restore route on page refresh or direct navigation if query parameters exist
  useEffect(() => {
    if (activeRouteReport) return;

    if (routeParams.demoRoute !== undefined && DEMO_SNAPSHOT.routes[routeParams.demoRoute]) {
      const demo = DEMO_SNAPSHOT.routes[routeParams.demoRoute]!;
      setLoading(true);
      setLoadError(null);
      planAndAnalyzeRoute({
        start: { name: demo.start.name, position: demo.start.position },
        end: { name: demo.end.name, position: demo.end.position },
        profileId,
        thresholds: activeThresholds,
        debugState,
      })
        .then((result) => {
          setActiveWalkingRoute(result.walkingRoute);
          setActiveRouteReport(result.report);
          setActiveRouteFacts(result.facts);
          setActiveRouteIsSample(result.isSample);
          setRouteVariants(result.variants ?? null);
          const raw = routeParams.variant || result.selectedVariant || 'accessible';
          const v: RouteVariantId = raw === 'shortest' ? 'fastest' : (raw === 'fastest' ? 'fastest' : 'accessible');
          selectRouteVariant(v);
        })
        .catch((err) => {
          setLoadError(err.message || 'Error loading route');
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    if (
      routeParams.fromLat !== undefined &&
      !isNaN(routeParams.fromLat) &&
      routeParams.fromLon !== undefined &&
      !isNaN(routeParams.fromLon) &&
      routeParams.toLat !== undefined &&
      !isNaN(routeParams.toLat) &&
      routeParams.toLon !== undefined &&
      !isNaN(routeParams.toLon)
    ) {
      setLoading(true);
      setLoadError(null);
      planAndAnalyzeRoute({
        start: {
          name: routeParams.fromName || 'Start',
          position: { lat: routeParams.fromLat, lon: routeParams.fromLon },
        },
        end: {
          name: routeParams.toName || 'Cel',
          position: { lat: routeParams.toLat, lon: routeParams.toLon },
        },
        profileId,
        thresholds: activeThresholds,
        debugState,
      })
        .then((result) => {
          setActiveWalkingRoute(result.walkingRoute);
          setActiveRouteReport(result.report);
          setActiveRouteFacts(result.facts);
          setActiveRouteIsSample(result.isSample);
          setRouteVariants(result.variants ?? null);
          const raw = routeParams.variant || result.selectedVariant || 'accessible';
          const v: RouteVariantId = raw === 'shortest' ? 'fastest' : (raw === 'fastest' ? 'fastest' : 'accessible');
          selectRouteVariant(v);
        })
        .catch((err) => {
          setLoadError(err.message || 'Error loading route');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [
    activeRouteReport,
    routeParams,
    profileId,
    activeThresholds,
    debugState,
    setActiveWalkingRoute,
    setActiveRouteReport,
    setActiveRouteFacts,
    setActiveRouteIsSample,
    setRouteVariants,
    selectRouteVariant,
  ]);

  useEffect(() => {
    fetchServerHazards().then(setServerHazards).catch(() => {});
  }, []);

  const reportFindings = useMemo(
    () =>
      citizenReportsAsFindings([
        ...serverHazards.map((hazard) => ({
          id: hazard.id,
          description: hazard.description,
          position: hazard.position,
          createdAt: hazard.createdAt,
          status: hazard.status,
        })),
        ...localReports.map((report) => ({
          id: report.id,
          description: report.description,
          position: report.position,
          createdAt: report.createdAt,
          status: report.status,
        })),
      ]),
    [serverHazards, localReports],
  );

  const displayedFindings = useMemo(() => {
    return selectMapFindings({
      mode: barrierViewMode,
      routeFindings: activeRouteReport?.findings || [],
      reports: reportFindings,
      routeCoordinates: activeWalkingRoute?.coordinates,
      corridorMetres: city.corridorMeters,
    });
  }, [barrierViewMode, activeRouteReport?.findings, activeWalkingRoute?.coordinates, reportFindings]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'routeReportTitle') }} />
        <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.text, fontSize: fontSize(15) }]}>
            {locale === 'pl' ? 'Pobieranie i analizowanie trasy...' : locale === 'uk' ? 'Завантаження та аналіз маршруту...' : 'Loading and analyzing route...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRouteReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'routeReportTitle') }} />
        <KrakowHeader
          showBack
          backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'}
          onBack={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            } catch {
              router.replace('/');
            }
          }}
        />
        <View style={styles.emptyContainer}>
          <GovCard variant="warning">
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
              {t(locale, 'noActiveRouteReport')}
            </Text>
            {loadError ? (
              <Text style={{ color: colors.blockerText, fontSize: fontSize(13), marginVertical: 6 }}>
                {loadError}
              </Text>
            ) : null}
            <GovButton
              title={t(locale, 'backToSearch')}
              icon={<ArrowLeft size={18} color="#fff" weight="bold" />}
              variant="primary"
              onPress={() => {
                try {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/');
                  }
                } catch {
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
    let narrative = '';
    if (locale === 'pl') {
      narrative = `Raport barier dla trasy o długości ${(report.lengthMetres / 1000).toFixed(1)} km. `;
      narrative += `Wykryto ${blockers.length} blokad, ${warnings.length} ostrzeżeń oraz ${unknownItems.length} elementów o nieznanym stanie. `;
      narrative += `Najdłuższy odcinek bez danych wynosi ${report.longestUnknownStretchMetres} metrów. `;
      if (showNoBarriersSentence) {
        narrative += 'Nie znaleziono przeszkód w dostępnych danych. ';
      }
      narrative += 'Główne punkty na trasie: ';
      report.findings.forEach((f, idx) => {
        const localizedCrit = getLocalizedFindingType(f.type, 'pl');
        const localizedVal = getLocalizedFactValue(f.fact.value, 'pl');
        narrative += `Punkt ${idx + 1}, po ${f.distanceFromStartMetres} metrach: ${localizedCrit}, ${localizedVal}. `;
      });
    } else if (locale === 'uk') {
      narrative = `Звіт про бар’єри для маршруту довжиною ${(report.lengthMetres / 1000).toFixed(1)} км. `;
      narrative += `Виявлено ${blockers.length} блокад, ${warnings.length} попереджень та ${unknownItems.length} елементів із невідомим станом. `;
      narrative += `Найдовша ділянка без даних становить ${report.longestUnknownStretchMetres} метрів. `;
      if (showNoBarriersSentence) {
        narrative += 'У наявних даних перешкод не знайдено. ';
      }
      narrative += 'Основні точки на маршруті: ';
      report.findings.forEach((f, idx) => {
        const localizedCrit = getLocalizedFindingType(f.type, 'uk');
        const localizedVal = getLocalizedFactValue(f.fact.value, 'uk');
        narrative += `Точка ${idx + 1}, через ${f.distanceFromStartMetres} метрів: ${localizedCrit}, ${localizedVal}. `;
      });
    } else {
      narrative = `Barrier report for route of distance ${(report.lengthMetres / 1000).toFixed(1)} km. `;
      narrative += `Detected ${blockers.length} blockers, ${warnings.length} warnings and ${unknownItems.length} items with unknown status. `;
      narrative += `Longest stretch without data is ${report.longestUnknownStretchMetres} metres. `;
      if (showNoBarriersSentence) {
        narrative += 'No barriers found in available data. ';
      }
      narrative += 'Key waypoints along route: ';
      report.findings.forEach((f, idx) => {
        const localizedCrit = getLocalizedFindingType(f.type, 'en');
        const localizedVal = getLocalizedFactValue(f.fact.value, 'en');
        narrative += `Point ${idx + 1}, after ${f.distanceFromStartMetres} metres: ${localizedCrit}, ${localizedVal}. `;
      });
    }
    return narrative;
  };



  const handleShare = async () => {
    try {
      await Share.share({
        title: `${t(locale, 'appName')} - ${t(locale, 'routeReportTitle')}`,
        message: generateNarrative(),
      });
    } catch {
      Alert.alert(t(locale, 'errorTitle'), t(locale, 'routeErrorMsg'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'routeReportTitle') }} />

      <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />

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
        {/* VARIANT SELECTOR CARD */}
        {routeVariants ? (
          <GovCard variant="default">
            <Text style={[styles.variantCardTitle, { color: colors.text, fontSize: fontSize(14.5), fontWeight: '700', marginBottom: 8 }]}>
              {t(locale, 'routeVariantHeading')}
            </Text>
            <View style={styles.variantButtonsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedRouteVariant === 'accessible' }}
                onPress={() => {
                  selectRouteVariant('accessible');
                  router.setParams({ variant: 'accessible' });
                }}
                style={[
                  styles.variantButton,
                  {
                    backgroundColor:
                      selectedRouteVariant === 'accessible' ? colors.accent : colors.background,
                    borderColor:
                      selectedRouteVariant === 'accessible' ? colors.accent : colors.border,
                    borderWidth: selectedRouteVariant === 'accessible' ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.variantHeader}>
                  <ShieldCheck
                    size={18}
                    weight="bold"
                    color={selectedRouteVariant === 'accessible' ? colors.accentText : colors.accent}
                  />
                  <Text
                    style={[
                      styles.variantTitle,
                      {
                        color: selectedRouteVariant === 'accessible' ? colors.accentText : colors.text,
                        fontSize: fontSize(14),
                        fontWeight: selectedRouteVariant === 'accessible' ? '800' : '600',
                      },
                    ]}
                  >
                    {t(locale, 'routeVariantAccessible')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.variantSub,
                    {
                      color: selectedRouteVariant === 'accessible' ? colors.accentText : colors.muted,
                      fontSize: fontSize(12),
                    },
                  ]}
                >
                  {(routeVariants.accessible.report.lengthMetres / 1000).toFixed(1)} km • {routeVariants.accessible.report.findings.filter((f) => f.severity === 'blocker').length} blokad
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedRouteVariant === 'fastest' }}
                onPress={() => {
                  selectRouteVariant('fastest');
                  router.setParams({ variant: 'fastest' });
                }}
                style={[
                  styles.variantButton,
                  {
                    backgroundColor:
                      selectedRouteVariant === 'fastest' ? colors.accent : colors.background,
                    borderColor:
                      selectedRouteVariant === 'fastest' ? colors.accent : colors.border,
                    borderWidth: selectedRouteVariant === 'fastest' ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.variantHeader}>
                  <Lightning
                    size={18}
                    weight="bold"
                    color={selectedRouteVariant === 'fastest' ? colors.accentText : colors.warningText}
                  />
                  <Text
                    style={[
                      styles.variantTitle,
                      {
                        color: selectedRouteVariant === 'fastest' ? colors.accentText : colors.text,
                        fontSize: fontSize(14),
                        fontWeight: selectedRouteVariant === 'fastest' ? '800' : '600',
                      },
                    ]}
                  >
                    {t(locale, 'routeVariantFastest')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.variantSub,
                    {
                      color: selectedRouteVariant === 'fastest' ? colors.accentText : colors.muted,
                      fontSize: fontSize(12),
                    },
                  ]}
                >
                  {Math.max(1, Math.round((routeVariants.fastest.walkingRoute.durationSeconds || 60) / 60))} min • {(routeVariants.fastest.report.lengthMetres / 1000).toFixed(1)} km
                </Text>
              </Pressable>
            </View>

            {selectedRouteVariant === 'accessible' &&
            routeVariants.accessible.walkingRoute.surfaceSpans?.some((span) => span.tone === 'other') ? (
              <View
                style={[
                  styles.variantWarningCallout,
                  {
                    backgroundColor: colors.warningBg,
                    borderColor: colors.warningBorder,
                    borderWidth: 1.5,
                    marginTop: 10,
                  },
                ]}
              >
                <Warning size={18} weight="bold" color={colors.warningText} />
                <Text style={[styles.variantWarningText, { color: colors.warningText, fontSize: fontSize(12.5) }]}>
                  {t(locale, 'routeVariantAccessibleGap')}
                </Text>
              </View>
            ) : null}

            {selectedRouteVariant === 'fastest' &&
            routeVariants.fastest.walkingRoute.surfaceSpans?.some((span) => span.tone === 'other') ? (
              <View
                style={[
                  styles.variantWarningCallout,
                  {
                    backgroundColor: colors.warningBg,
                    borderColor: colors.warningBorder,
                    borderWidth: 1.5,
                    marginTop: 10,
                  },
                ]}
              >
                <Warning size={18} weight="bold" color={colors.warningText} />
                <Text style={[styles.variantWarningText, { color: colors.warningText, fontSize: fontSize(12.5) }]}>
                  {t(locale, 'routeVariantFastestWarning')}
                </Text>
              </View>
            ) : null}
          </GovCard>
        ) : null}

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
                {t(locale, 'krakowRouteTag')}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.muted, fontSize: fontSize(14.5) }]}>
              {t(locale, 'routeLength')}:
            </Text>
            <Text style={[styles.metricValue, { color: colors.text, fontSize: fontSize(15) }]}>
              {(report.lengthMetres / 1000).toFixed(1)} km
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
                  {t(locale, 'facilitiesCount')}
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
              {report.longestUnknownStretchMetres} {t(locale, 'metresContinuousNoData')}
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

          {/* Share button */}
          <GovButton
            title={t(locale, 'shareSummary')}
            icon={<ShareNetwork size={18} color={colors.text} weight="bold" />}
            variant="outline"
            onPress={handleShare}
          />

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
          <View style={{ gap: 8, marginVertical: 8 }}>
            <BarrierViewControl
              compact
              mode={barrierViewMode}
              onChangeMode={setBarrierViewMode}
              routeBarriersCount={(report.findings || []).filter((finding) => finding.severity === 'blocker' || finding.severity === 'warning').length}
              allBarriersCount={(report.findings || []).length}
              hasActiveRoute={true}
            />
            <MapView
              route={activeWalkingRoute}
              findings={displayedFindings}
              userLocation={userLocation}
            />
          </View>
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
            {t(locale, 'orderedByDistance')}
          </Text>

          {report.findings.length === 0 ? (
            <GovCard variant="default">
              <Text style={[styles.metaText, { color: colors.text, fontSize: fontSize(14) }]}>
                {t(locale, 'noElementsInCorridor')}
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
  variantCardTitle: {
    letterSpacing: 0.2,
  },
  variantButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  variantButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  variantTitle: {
    letterSpacing: 0.2,
  },
  variantSub: {
    marginTop: 2,
  },
  variantWarningCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  variantWarningText: {
    flex: 1,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

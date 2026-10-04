import { DEMO_SNAPSHOT, type LonLat } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Footprints,
  Buildings,
  MagnifyingGlass,
  Warning,
  Lightning,
  Clock,
  Target,
  ArrowsDownUp,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { LocationPicker } from '@/components/LocationPicker';
import { t } from '@/i18n/strings';
import { inspectPlace, planAndAnalyzeRoute, suggestPlaces } from '@/services/api';
import { triggerGentleHaptic } from '@/services/haptics';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const {
    locale,
    profileId,
    debugState,
    setActiveRouteReport,
    setActiveWalkingRoute,
    setActiveRouteFacts,
    setActiveRouteIsSample,
    setRouteVariants,
    selectRouteVariant,
    setActivePlaceReport,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    highlightLinks,
    dyslexicFont,
    activeThresholds,
    userLocation,
    fetchUserLocation,
  } = useSession();

  const [activeTab, setActiveTab] = useState<'route' | 'place'>('route');
  const [fromQuery, setFromQuery] = useState('');
  const [fromPos, setFromPos] = useState<LonLat | null>(null);

  const [toQuery, setToQuery] = useState('');
  const [toPos, setToPos] = useState<LonLat | null>(null);

  const fromPosRef = useRef<LonLat | null>(null);
  const fromQueryRef = useRef<string>('');
  const toPosRef = useRef<LonLat | null>(null);
  const toQueryRef = useRef<string>('');

  useEffect(() => {
    fromPosRef.current = fromPos;
  }, [fromPos]);
  useEffect(() => {
    fromQueryRef.current = fromQuery;
  }, [fromQuery]);
  useEffect(() => {
    toPosRef.current = toPos;
  }, [toPos]);
  useEffect(() => {
    toQueryRef.current = toQuery;
  }, [toQuery]);

  const [placeQuery, setPlaceQuery] = useState('Sukiennice');
  const [placePos, setPlacePos] = useState<LonLat>({ lon: 19.9373, lat: 50.0619 });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleAnalyzeRoute = async (
    overrideStart?: { name: string; position?: LonLat | null },
    overrideEnd?: { name: string; position?: LonLat | null },
  ) => {
    const startName = overrideStart ? overrideStart.name : (fromQueryRef.current || fromQuery);
    const endName = overrideEnd ? overrideEnd.name : (toQueryRef.current || toQuery);
    let resolvedStart = overrideStart?.position !== undefined ? overrideStart.position : fromPosRef.current;
    let resolvedEnd = overrideEnd?.position !== undefined ? overrideEnd.position : toPosRef.current;

    if (!startName?.trim() || !endName?.trim()) {
      if (!overrideStart && !overrideEnd) {
        setErrorMsg(t(locale, 'routeEndpointsRequired'));
      }
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!resolvedStart && startName.trim()) {
        const hits = await suggestPlaces(startName, locale);
        if (hits.length > 0 && hits[0]?.position) {
          resolvedStart = hits[0].position;
        }
      }

      if (!resolvedEnd && endName.trim()) {
        const hits = await suggestPlaces(endName, locale);
        if (hits.length > 0 && hits[0]?.position) {
          resolvedEnd = hits[0].position;
        }
      }

      if (!resolvedStart || !resolvedEnd) {
        setErrorMsg(t(locale, 'routeEndpointsRequired'));
        return;
      }

      setFromQuery(startName);
      setFromPos(resolvedStart);
      fromQueryRef.current = startName;
      fromPosRef.current = resolvedStart;
      setToQuery(endName);
      setToPos(resolvedEnd);
      toQueryRef.current = endName;
      toPosRef.current = resolvedEnd;

      const result = await planAndAnalyzeRoute({
        start: { name: startName, position: resolvedStart },
        end: { name: endName, position: resolvedEnd },
        profileId,
        thresholds: activeThresholds,
        debugState,
      });

      triggerGentleHaptic('route');

      setActiveWalkingRoute(result.walkingRoute);
      setActiveRouteReport(result.report);
      setActiveRouteFacts(result.facts);
      setActiveRouteIsSample(result.isSample);
      if (result.variants) {
        setRouteVariants(result.variants);
      }
      if (result.selectedVariant) {
        selectRouteVariant(result.selectedVariant);
      }
      router.push({
        pathname: '/route',
        params: {
          fromName: startName,
          fromLat: String(resolvedStart.lat),
          fromLon: String(resolvedStart.lon),
          toName: endName,
          toLat: String(resolvedEnd.lat),
          toLon: String(resolvedEnd.lon),
          profile: profileId,
          variant: result.selectedVariant || 'accessible',
          ...(result.isSample ? { isSample: '1' } : {}),
        },
      } as any);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (locale === 'pl'
            ? 'Wystąpił błąd podczas analizowania trasy.'
            : locale === 'uk'
              ? 'Сталася помилка під час аналізу маршруту.'
              : 'An error occurred while analyzing the route.')
      );
    } finally {
      setLoading(false);
    }
  };

  const checkAndAutoPlanRoute = (
    newStart?: { name: string; position?: LonLat | null },
    newEnd?: { name: string; position?: LonLat | null },
  ) => {
    const curFromPos = newStart?.position !== undefined ? newStart.position : fromPosRef.current;
    const curFromQuery = newStart ? newStart.name : fromQueryRef.current;
    const curToPos = newEnd?.position !== undefined ? newEnd.position : toPosRef.current;
    const curToQuery = newEnd ? newEnd.name : toQueryRef.current;

    const effectiveStart = curFromPos
      ? { name: curFromQuery?.trim() || t(locale, 'pointA'), position: curFromPos }
      : (curFromQuery?.trim() ? { name: curFromQuery.trim() } : null);

    const effectiveEnd = curToPos
      ? { name: curToQuery?.trim() || t(locale, 'pointB'), position: curToPos }
      : (curToQuery?.trim() ? { name: curToQuery.trim() } : null);

    if (effectiveStart?.name?.trim() && effectiveEnd?.name?.trim()) {
      handleAnalyzeRoute(effectiveStart, effectiveEnd);
    }
  };

  const handleSwapPoints = () => {
    const prevFromQuery = fromQueryRef.current || fromQuery;
    const prevFromPos = fromPosRef.current || fromPos;
    const newFromQuery = toQueryRef.current || toQuery;
    const newFromPos = toPosRef.current || toPos;
    const newToQuery = prevFromQuery;
    const newToPos = prevFromPos;
    setFromQuery(newFromQuery);
    setFromPos(newFromPos);
    fromQueryRef.current = newFromQuery;
    fromPosRef.current = newFromPos;
    setToQuery(newToQuery);
    setToPos(newToPos);
    toQueryRef.current = newToQuery;
    toPosRef.current = newToPos;
    if (newFromQuery.trim() && newToQuery.trim()) {
      checkAndAutoPlanRoute(
        { name: newFromQuery, position: newFromPos },
        { name: newToQuery, position: newToPos },
      );
    }
  };

  const handleUseMyLocation = async () => {
    const result = await fetchUserLocation();
    const loc = result || userLocation;
    if (loc) {
      triggerGentleHaptic('location');
      const startName = result?.address || t(locale, 'myLocationShort');
      const startPoint = { lon: loc.lon, lat: loc.lat };
      setFromQuery(startName);
      setFromPos(startPoint);
      fromQueryRef.current = startName;
      fromPosRef.current = startPoint;
      checkAndAutoPlanRoute({ name: startName, position: startPoint }, undefined);
    } else {
      Alert.alert(
        t(locale, 'gpsUnavailableTitle'),
        t(locale, 'gpsUnavailableDesc'),
      );
    }
  };

  const handleInspectPlace = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await inspectPlace(placeQuery, placePos, debugState);
      setActivePlaceReport(result.report);
      router.push({
        pathname: '/place',
        params: {
          placeName: placeQuery,
          placeLat: String(placePos.lat),
          placeLon: String(placePos.lon),
        },
      } as any);
    } catch {
      // Fallback report ensures the place always opens and displays the "Brak informacji" card
      const fallbackReport = {
        placeName: placeQuery,
        position: placePos,
        matchConfidence: 0,
        isConfidentMatch: false,
        factsByCategory: { entrance: [], inside: [], toilet: [], surroundings: [] },
        allFacts: [],
        summaryMessage: locale === 'pl' ? 'Brak informacji w bazie danych' : 'No information in database',
        isSample: false,
      };
      setActivePlaceReport(fallbackReport as any);
      router.push({
        pathname: '/place',
        params: {
          placeName: placeQuery,
          placeLat: String(placePos.lat),
          placeLon: String(placePos.lon),
        },
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoRoute = (index: number) => {
    const routeData = DEMO_SNAPSHOT.routes[index];
    if (!routeData) return;
    setFromQuery(routeData.start.name);
    setFromPos(routeData.start.position);
    setToQuery(routeData.end.name);
    setToPos(routeData.end.position);
    setActiveTab('route');
  };

  const loadDemoPlace = (index: number) => {
    const placeData = DEMO_SNAPSHOT.places[index];
    if (!placeData) return;
    setPlaceQuery(placeData.name);
    setPlacePos(placeData.position);
    setActiveTab('place');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'searchTitle') }} />

      <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />

      <DemoBanner />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* Intro banner */}
        <GovCard variant="accent">
          <Text
            accessibilityRole="header"
            style={[
              styles.screenTitle,
              {
                color: colors.text,
                fontSize: fontSize(20),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
              },
            ]}
          >
            {t(locale, 'searchTitle')}
          </Text>
          <Text style={[styles.leadText, { color: colors.muted, fontSize: fontSize(14) }]}>
            {t(locale, 'searchLead')}
          </Text>
        </GovCard>

        {/* Tab switcher */}
        <View
          accessibilityRole="tablist"
          style={[
            styles.tabs,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2.5 : 1.5,
            },
          ]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'route' }}
            onPress={() => setActiveTab('route')}
            style={[
              styles.tab,
              activeTab === 'route' && { backgroundColor: colors.accent },
              { minHeight: increasedSpacing ? 54 : 46 },
            ]}
          >
            <View style={styles.tabInner}>
              <Footprints
                size={18}
                color={activeTab === 'route' ? colors.accentText : colors.text}
                weight={activeTab === 'route' ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'route' ? colors.accentText : colors.text,
                    fontSize: fontSize(14.5),
                    textDecorationLine: highlightLinks && activeTab === 'route' ? 'underline' : 'none',
                  },
                ]}
              >
                {t(locale, 'routeTab')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'place' }}
            onPress={() => setActiveTab('place')}
            style={[
              styles.tab,
              activeTab === 'place' && { backgroundColor: colors.accent },
              { minHeight: increasedSpacing ? 54 : 46 },
            ]}
          >
            <View style={styles.tabInner}>
              <Buildings
                size={18}
                color={activeTab === 'place' ? colors.accentText : colors.text}
                weight={activeTab === 'place' ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'place' ? colors.accentText : colors.text,
                    fontSize: fontSize(14.5),
                    textDecorationLine: highlightLinks && activeTab === 'place' ? 'underline' : 'none',
                  },
                ]}
              >
                {t(locale, 'placeTab')}
              </Text>
            </View>
          </Pressable>
        </View>

        {activeTab === 'route' ? (
          <GovCard variant="default">
            <View style={styles.formSection}>
              {/* Point A */}
              <LocationPicker
                label={t(locale, 'from')}
                badge="A"
                badgeColor={colors.okBorder}
                point={{ name: fromQuery, position: fromPos }}
                onChangePoint={(p) => {
                  setFromQuery(p.name);
                  setFromPos(p.position ?? null);
                  fromQueryRef.current = p.name;
                  fromPosRef.current = p.position ?? null;
                  checkAndAutoPlanRoute(
                    p.position ? { name: p.name, position: p.position } : (p.name.trim() ? { name: p.name } : undefined),
                    undefined,
                  );
                }}
                onClear={() => {
                  setFromQuery('');
                  setFromPos(null);
                  fromQueryRef.current = '';
                  fromPosRef.current = null;
                }}
                placeholder={t(locale, 'fromPlaceholder')}
                showMyLocation
                onUseMyLocation={handleUseMyLocation}
              />

              {/* Swap Button */}
              <View style={styles.swapBtnRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(locale, 'swapPoints')}
                  onPress={handleSwapPoints}
                  style={[
                    styles.swapBtn,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: isHighContrast ? 2 : 1,
                    },
                  ]}
                >
                  <ArrowsDownUp size={15} weight="bold" color={colors.accent} />
                  <Text style={[styles.swapBtnText, { color: colors.accent, fontSize: fontSize(12) }]}>
                    {t(locale, 'swapPoints')}
                  </Text>
                </Pressable>
              </View>

              {/* Point B */}
              <LocationPicker
                label={t(locale, 'to')}
                badge="B"
                badgeColor={colors.blockerBorder}
                point={{ name: toQuery, position: toPos }}
                onChangePoint={(p) => {
                  setToQuery(p.name);
                  setToPos(p.position ?? null);
                  toQueryRef.current = p.name;
                  toPosRef.current = p.position ?? null;
                  checkAndAutoPlanRoute(
                    undefined,
                    p.position ? { name: p.name, position: p.position } : (p.name.trim() ? { name: p.name } : undefined),
                  );
                }}
                onClear={() => {
                  setToQuery('');
                  setToPos(null);
                  toQueryRef.current = '';
                  toPosRef.current = null;
                }}
                placeholder={t(locale, 'toPlaceholder')}
              />

              <GovButton
                title={t(locale, 'searchButton')}
                icon={<MagnifyingGlass size={18} color={colors.accentText} weight="bold" />}
                variant="primary"
                loading={loading}
                onPress={handleAnalyzeRoute}
              />
            </View>
          </GovCard>
        ) : (
          <GovCard variant="default">
            <View style={styles.formSection}>
              <LocationPicker
                label={t(locale, 'placeLabel')}
                point={{ name: placeQuery, position: placePos }}
                onChangePoint={(p) => {
                  setPlaceQuery(p.name);
                  setPlacePos(p.position);
                }}
                placeholder={t(locale, 'placePlaceholder')}
              />

              <GovButton
                title={t(locale, 'searchPlaceButton')}
                icon={<Buildings size={18} color={colors.accentText} weight="bold" />}
                variant="primary"
                loading={loading}
                onPress={handleInspectPlace}
              />
            </View>
          </GovCard>
        )}

        {errorMsg ? (
          <GovCard variant="blocker">
            <View style={styles.inlineRow}>
              <Warning size={18} color={colors.blockerText} weight="bold" />
              <Text style={{ color: colors.blockerText, fontWeight: '800', fontSize: fontSize(14), flex: 1 }}>
                {errorMsg}
              </Text>
            </View>
          </GovCard>
        ) : null}

        {/* Demo Fast Triggers */}
        <GovCard variant="accent">
          <View style={styles.inlineRow}>
            <Target size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.demoTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              {t(locale, 'demoScenarios')}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(13.5) }]}>
            {locale === 'pl'
              ? 'Kliknij gotowy scenariusz, aby przetestować bez wpisywania:'
              : locale === 'uk'
                ? 'Натисніть готовий сценарій, щоб протестувати без введення:'
                : 'Click a preset scenario to test without typing:'}
          </Text>

          <View style={styles.scenariosList}>
            <GovButton
              variant="outline"
              title={`${t(locale, 'tabRoute')}: ${t(locale, 'demoRoute2')}`}
              icon={<Footprints size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoRoute(1)}
            />
            <GovButton
              variant="outline"
              title={`${t(locale, 'tabPlace')}: ${t(locale, 'demoPlace1')}`}
              icon={<Buildings size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(0)}
            />
            <GovButton
              variant="outline"
              title={`${t(locale, 'tabPlace')}: ${t(locale, 'demoPlace2')}`}
              icon={<Lightning size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(1)}
            />
            <GovButton
              variant="outline"
              title={`${t(locale, 'tabPlace')}: ${t(locale, 'demoPlace3')}`}
              icon={<Clock size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(2)}
            />
          </View>
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
  screenTitle: {
    fontWeight: '800',
  },
  leadText: {
    fontWeight: '500',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '800',
  },
  formSection: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
  },
  locationBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  linkText: {
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  demoTitle: {
    fontWeight: '800',
  },
  body: {
    lineHeight: 18,
    fontWeight: '500',
  },
  scenariosList: {
    gap: 8,
    marginTop: 4,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapBtnRow: {
    alignItems: 'center',
    marginVertical: 2,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  swapBtnText: {
    fontWeight: '700',
  },
});

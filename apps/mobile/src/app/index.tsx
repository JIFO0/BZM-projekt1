import {
  DEMO_SNAPSHOT,
  type LonLat,
  type ProfileId,
} from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import {
  ArrowRight,
  ArrowsDownUp,
  Buildings,
  CaretDown,
  CaretUp,
  Check,
  Crosshair,
  Info,
  MagnifyingGlass,
  NavigationArrow,
  PathIcon as Path,
  Prohibit,
  SlidersHorizontal,
  Warning,
  X,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { KrakowHeader } from '@/components/KrakowHeader';
import { LocationPicker } from '@/components/LocationPicker';
import { MapView } from '@/components/MapView';
import { t } from '@/i18n/strings';
import { inspectPlace, planAndAnalyzeRoute, reverseGeocodeLocation } from '@/services/api';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

const ROAD_TYPE_OPTIONS = [
  {
    id: 'cobblestone',
    nameKey: 'surfaceCobblestone' as const,
    descPl: 'Bruk i kocie łby, trudne do przejazdu',
    descEn: 'Cobblestone and historic paving',
    descUk: 'Бруківка та кругляк, важко проїхати',
  },
  {
    id: 'gravel',
    nameKey: 'surfaceGravel' as const,
    descPl: 'Gruby żwir i szuter, utrudniający toczenie się kół',
    descEn: 'Coarse gravel hindering wheel rolling',
    descUk: 'Грубий гравій та щебінь, що ускладнює рух коліс',
  },
  {
    id: 'sand',
    nameKey: 'surfaceSand' as const,
    descPl: 'Sypki piasek grzęznący dla wózków',
    descEn: 'Loose sand causing wheels to sink',
    descUk: 'Сипкий пісок, у якому загрузають візки',
  },
  {
    id: 'dirt',
    nameKey: 'surfaceDirt' as const,
    descPl: 'Drogi gruntowe i ziemne, błotniste po deszczu',
    descEn: 'Dirt and soil tracks, muddy in rain',
    descUk: 'Ґрунтові дороги, багнисті після дощу',
  },
  {
    id: 'unpaved',
    nameKey: 'surfaceUnpaved' as const,
    descPl: 'Wszelkie nawierzchnie nieutwardzone',
    descEn: 'Any general unpaved terrain',
    descUk: 'Будь-які невимощені поверхні',
  },
  {
    id: 'compacted',
    nameKey: 'surfaceCompacted' as const,
    descPl: 'Nawierzchnia szutrowa utwardzona / ubita',
    descEn: 'Compacted gravel or stabilized surface',
    descUk: 'Утрамбований щебінь або стабілізоване покриття',
  },
];

type PopupTab = 'route' | 'place' | 'profile' | 'report';

export default function MapHomeScreen() {
  const {
    locale,
    profileId,
    setProfileId,
    customThresholds,
    setCustomThresholds,
    activeThresholds,
    toggleBlockedRoadType,
    debugState,
    activeRouteReport,
    setActiveRouteReport,
    activeWalkingRoute,
    setActiveWalkingRoute,
    activePlaceReport,
    setActivePlaceReport,
    localReports,
    addLocalReport,
    userLocation,
    isLocating,
    fetchUserLocation,
    colors,
    fontSize,
    isHighContrast,
  } = useSession();

  // Map state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 50.0619,
    lon: 19.9373,
  });

  // Proactively request / fetch location on mount
  useEffect(() => {
    fetchUserLocation().then((loc) => {
      if (loc) {
        setMapCenter({ lat: loc.lat, lon: loc.lon });
      }
    });
  }, [fetchUserLocation]);

  // Popup menu / sheet state (Google/Apple Maps style)
  const [popupExpanded, setPopupExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PopupTab>('route');

  // Search & Routing state
  const [fromQuery, setFromQuery] = useState('Rynek Główny');
  const [fromPos, setFromPos] = useState<LonLat>({ lon: 19.9373, lat: 50.0619 });
  const [toQuery, setToQuery] = useState('Zamek Królewski na Wawelu');
  const [toPos, setToPos] = useState<LonLat>({ lon: 19.9354, lat: 50.0544 });
  const [placeQuery, setPlaceQuery] = useState('Sukiennice');
  const [placePos, setPlacePos] = useState<LonLat>({ lon: 19.9373, lat: 50.0619 });

  // Report input state
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Interactive map picking target
  const [pickingTarget, setPickingTarget] = useState<'start' | 'end' | 'place' | null>(null);

  // Loading & Audio state
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingPlace, setLoadingPlace] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);

  const blockedList =
    activeThresholds?.blockedRoadTypes ?? activeThresholds?.blockedSurfaces ?? [];

  const getProfileIcon = (id: ProfileId, size = 18) => {
    switch (id) {
      case 'wheelchair':
        // Less intimidating modern navigation arrow icon
        return <NavigationArrow size={size} weight="bold" color={colors.accent} />;
      case 'custom':
      default:
        return <SlidersHorizontal size={size} weight="bold" color={colors.accent} />;
    }
  };

  const getProfileLabel = (id: ProfileId) => {
    switch (id) {
      case 'wheelchair':
        return t(locale, 'wheelchair');
      case 'custom':
      default:
        return t(locale, 'custom');
    }
  };

  // 1. Locate Me / Reset Map
  const handleCenterKrakow = () => {
    setMapCenter({ lat: 50.0619, lon: 19.9373 });
    setStatusMessage(t(locale, 'toastCenteredKrakow'));
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLocateUser = async () => {
    setStatusMessage(t(locale, 'gpsFetching'));
    const result = await fetchUserLocation();
    const loc = result || userLocation;
    if (loc) {
      setMapCenter({ lat: loc.lat, lon: loc.lon });
      setStatusMessage(t(locale, 'gpsCenteredSuccess'));
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      Alert.alert(
        t(locale, 'gpsUnavailableTitle'),
        t(locale, 'gpsUnavailableDesc'),
        [
          { text: t(locale, 'btnCenterKrakowAction'), onPress: handleCenterKrakow },
          { text: 'OK', style: 'cancel' },
        ],
      );
      setStatusMessage(null);
    }
  };

  const handleUseMyLocation = async () => {
    setStatusMessage(t(locale, 'gpsFetching'));
    const result = await fetchUserLocation();
    const loc = result || userLocation;
    if (loc) {
      setFromQuery(result?.address || t(locale, 'myLocationShort'));
      setFromPos({ lon: loc.lon, lat: loc.lat });
      setMapCenter({ lat: loc.lat, lon: loc.lon });
      setStatusMessage(t(locale, 'gpsStartPointSet'));
      setTimeout(() => setStatusMessage(null), 2500);
    } else {
      Alert.alert(
        t(locale, 'gpsUnavailableTitle'),
        t(locale, 'gpsUnavailableSearchDesc'),
        [
          {
            text: t(locale, 'btnCenterKrakowAction'),
            onPress: () => {
              setFromQuery(t(locale, 'rynekGlowny'));
              setFromPos({ lon: 19.9373, lat: 50.0619 });
              setMapCenter({ lat: 50.0619, lon: 19.9373 });
            },
          },
          { text: t(locale, 'cancel'), style: 'cancel' },
        ],
      );
      setStatusMessage(null);
    }
  };

  // Swap Points (A ⇄ B)
  const handleSwapPoints = () => {
    const prevFromQuery = fromQuery;
    const prevFromPos = fromPos;
    setFromQuery(toQuery);
    setFromPos(toPos);
    setToQuery(prevFromQuery);
    setToPos(prevFromPos);
  };

  // Interactive Map Click Handler
  const handleMapClick = async (coords: { lat: number; lon: number }) => {
    if (!pickingTarget) return;

    let name = `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;
    try {
      const rev = await reverseGeocodeLocation(coords.lat, coords.lon, locale);
      if (rev?.name) name = rev.name;
    } catch {}

    if (pickingTarget === 'start') {
      setFromPos(coords);
      setFromQuery(name);
      setPickingTarget(null);
      setStatusMessage(`${t(locale, 'pointA')}: ${name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (pickingTarget === 'end') {
      setToPos(coords);
      setToQuery(name);
      setPickingTarget(null);
      setStatusMessage(`${t(locale, 'pointB')}: ${name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else if (pickingTarget === 'place') {
      setPlacePos(coords);
      setPlaceQuery(name);
      setPickingTarget(null);
      setStatusMessage(`${t(locale, 'placeLabel')}: ${name}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // 2. Plan & Analyze Route
  const handleAnalyzeRoute = async () => {
    setLoadingRoute(true);
    setStatusMessage(null);
    try {
      const result = await planAndAnalyzeRoute({
        start: { name: fromQuery, position: fromPos },
        end: { name: toQuery, position: toPos },
        profileId,
        thresholds: activeThresholds,
        debugState,
      });

      setActiveWalkingRoute(result.walkingRoute);
      setActiveRouteReport(result.report);
      setPopupExpanded(true);
      setActiveTab('route');

      // Center map on route start
      if (result.walkingRoute.coordinates.length > 0) {
        setMapCenter({
          lat: result.walkingRoute.coordinates[0]![1],
          lon: result.walkingRoute.coordinates[0]![0],
        });
      }
    } catch (err: any) {
      Alert.alert(t(locale, 'routeErrorTitle'), err.message || t(locale, 'routeErrorMsg'));
    } finally {
      setLoadingRoute(false);
    }
  };

  // 3. Inspect Place
  const handleInspectPlace = async () => {
    setLoadingPlace(true);
    setStatusMessage(null);
    try {
      const result = await inspectPlace(placeQuery, placePos, debugState);
      setActivePlaceReport(result.report);
      setPopupExpanded(true);
      setActiveTab('place');
      setMapCenter({ lat: placePos.lat, lon: placePos.lon });
    } catch (err: any) {
      Alert.alert(t(locale, 'placeErrorTitle'), err.message || t(locale, 'placeErrorMsg'));
    } finally {
      setLoadingPlace(false);
    }
  };

  // Quick Demo Route Loader
  const loadDemoRoute = async (index: number) => {
    const routeData = DEMO_SNAPSHOT.routes[index];
    if (!routeData) return;
    setFromQuery(routeData.start.name);
    setFromPos(routeData.start.position);
    setToQuery(routeData.end.name);
    setToPos(routeData.end.position);
    setActiveTab('route');
    setPopupExpanded(true);
    setLoadingRoute(true);
    try {
      const result = await planAndAnalyzeRoute({
        start: { name: routeData.start.name, position: routeData.start.position },
        end: { name: routeData.end.name, position: routeData.end.position },
        profileId,
        thresholds: activeThresholds,
        debugState,
      });
      setActiveWalkingRoute(result.walkingRoute);
      setActiveRouteReport(result.report);
      if (result.walkingRoute.coordinates.length > 0) {
        setMapCenter({
          lat: result.walkingRoute.coordinates[0]![1],
          lon: result.walkingRoute.coordinates[0]![0],
        });
      }
    } catch (err: any) {
      Alert.alert(t(locale, 'errorTitle'), err.message || t(locale, 'routeErrorMsg'));
    } finally {
      setLoadingRoute(false);
    }
  };

  // Quick Demo Place Loader
  const loadDemoPlace = async (index: number) => {
    const placeData = DEMO_SNAPSHOT.places[index];
    if (!placeData) return;
    setPlaceQuery(placeData.name);
    setPlacePos(placeData.position);
    setActiveTab('place');
    setPopupExpanded(true);
    setLoadingPlace(true);
    try {
      const result = await inspectPlace(placeData.name, placeData.position, debugState);
      setActivePlaceReport(result.report);
      setMapCenter({ lat: placeData.position.lat, lon: placeData.position.lon });
    } catch (err: any) {
      Alert.alert(t(locale, 'errorTitle'), err.message || t(locale, 'placeErrorMsg'));
    } finally {
      setLoadingPlace(false);
    }
  };

  // Clear Active Route
  const handleClearRoute = () => {
    setActiveWalkingRoute(null);
    setActiveRouteReport(null);
  };

  // Submit local report
  const handleSubmitLocalReport = () => {
    if (!reportDesc.trim()) {
      Alert.alert(t(locale, 'warningTitle'), t(locale, 'reportDescRequired'));
      return;
    }
    addLocalReport(reportDesc.trim());
    setReportDesc('');
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 3500);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'appName') }} />

      {/* 1. TOP HEADER (Google / Apple Maps Style Floating Top Bar) */}
      <KrakowHeader />

      <DemoBanner />

      {/* 2. MAP CANVAS (CENTRAL FULL-SCREEN VIEWPORT) */}
      <View style={styles.mapCanvasWrapper}>
        <MapView
          fullScreen
          route={activeWalkingRoute}
          findings={activeRouteReport?.findings || []}
          center={mapCenter}
          userLocation={userLocation}
          startLocation={{
            name: fromQuery,
            lat:
              activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? activeWalkingRoute.coordinates[0]![1]
                : fromPos.lat,
            lon:
              activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? activeWalkingRoute.coordinates[0]![0]
                : fromPos.lon,
          }}
          endLocation={{
            name: toQuery,
            lat:
              activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]![1]
                : toPos.lat,
            lon:
              activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]![0]
                : toPos.lon,
          }}
          onMapClick={handleMapClick}
          isPickingMode={pickingTarget !== null}
        />

        {/* Floating Map Action Buttons (Apple / Google Maps style) */}
        <View style={styles.floatingControlsRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'accessibilityShowMyLocation')}
            onPress={handleLocateUser}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: colors.surface,
                borderColor: userLocation ? colors.accent : colors.border,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Crosshair size={22} weight="bold" color={userLocation ? colors.accent : colors.text} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'btnChangeProfile')}
            onPress={() => {
              setActiveTab('profile');
              setPopupExpanded(true);
            }}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            {getProfileIcon(profileId, 20)}
          </Pressable>

          {activeWalkingRoute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'btnClearRoute')}
              onPress={handleClearRoute}
              style={[
                styles.floatingBtn,
                {
                  backgroundColor: colors.blockerBg,
                  borderColor: colors.blockerBorder,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              <X size={20} weight="bold" color={colors.blockerText} />
            </Pressable>
          ) : null}
        </View>

        {/* Active Route Floating Pill (if route is active) */}
        {activeWalkingRoute && activeRouteReport ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'btnShowRouteSummary')}
            onPress={() => {
              setActiveTab('route');
              setPopupExpanded(true);
            }}
            style={[
              styles.floatingRoutePill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.accent,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <Path size={18} weight="bold" color={colors.accent} />
            <Text style={[styles.routePillText, { color: colors.text, fontSize: fontSize(13) }]}>
              {activeRouteReport.lengthMetres} m • {Math.round((activeWalkingRoute.durationSeconds || 120) / 60)} min •{' '}
              {activeRouteReport.findings.filter((f) => f.severity === 'blocker').length} {t(locale, 'severityBlocker').toLowerCase()}
            </Text>
            <CaretUp size={16} weight="bold" color={colors.accent} />
          </Pressable>
        ) : null}

        {/* Status Toast Notification */}
        {statusMessage ? (
          <View style={[styles.statusToast, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Info size={16} weight="bold" color={colors.accent} />
            <Text style={[styles.statusToastText, { color: colors.text, fontSize: fontSize(12.5) }]}>
              {statusMessage}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 3. POPUP MENU / BOTTOM SHEET (Apple Maps / Google Maps Drawer) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.bottomSheetContainer,
          popupExpanded ? styles.bottomSheetExpanded : styles.bottomSheetCollapsed,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: isHighContrast ? 2.5 : 1.5,
          },
        ]}
      >
        {/* Drag Handle Bar / Tap to toggle */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={popupExpanded ? t(locale, 'collapseMenu') : t(locale, 'expandMenu')}
          onPress={() => setPopupExpanded(!popupExpanded)}
          style={styles.sheetHandleRow}
        >
          <View
            style={[
              styles.sheetHandleBar,
              { backgroundColor: isHighContrast ? colors.accent : colors.muted },
            ]}
          />
          <View style={styles.sheetHandleHeader}>
            <View style={styles.sheetHeaderLeft}>
              {getProfileIcon(profileId, 16)}
              <Text style={[styles.sheetProfileName, { color: colors.accent, fontSize: fontSize(12.5) }]}>
                {getProfileLabel(profileId)}
              </Text>
            </View>
            <View style={styles.sheetToggleBtn}>
              <Text style={[styles.toggleText, { color: colors.muted, fontSize: fontSize(12) }]}>
                {popupExpanded ? t(locale, 'hideMenu') : t(locale, 'expandMenu')}
              </Text>
              {popupExpanded ? (
                <CaretDown size={14} weight="bold" color={colors.accent} />
              ) : (
                <CaretUp size={14} weight="bold" color={colors.accent} />
              )}
            </View>
          </View>
        </Pressable>

        {/* Peek (Collapsed) Quick Search Row */}
        {!popupExpanded ? (
          <View style={styles.peekContent}>
            {/* Quick search bar */}
            <Pressable
              onPress={() => {
                setActiveTab('route');
                setPopupExpanded(true);
              }}
              style={[
                styles.peekSearchBar,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: isHighContrast ? 2 : 1,
                },
              ]}
            >
              <MagnifyingGlass size={18} weight="bold" color={colors.accent} />
              <Text style={[styles.peekSearchPlaceholder, { color: colors.muted, fontSize: fontSize(14) }]}>
                {t(locale, 'searchPlaceholderUnified')}
              </Text>
            </Pressable>

            {/* Quick Action Destination Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
              <Pressable
                onPress={() => loadDemoRoute(0)}
                style={[styles.quickChip, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Path size={14} weight="bold" color={colors.accent} />
                <Text style={[styles.quickChipText, { color: colors.text, fontSize: fontSize(12.5) }]}>
                  Rynek → Wawel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => loadDemoRoute(1)}
                style={[styles.quickChip, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Path size={14} weight="bold" color={colors.accent} />
                <Text style={[styles.quickChipText, { color: colors.text, fontSize: fontSize(12.5) }]}>
                  Dworzec → Sukiennice
                </Text>
              </Pressable>

              <Pressable
                onPress={() => loadDemoPlace(0)}
                style={[styles.quickChip, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Buildings size={14} weight="bold" color={colors.accent} />
                <Text style={[styles.quickChipText, { color: colors.text, fontSize: fontSize(12.5) }]}>
                  Sukiennice
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setActiveTab('profile');
                  setPopupExpanded(true);
                }}
                style={[styles.quickChip, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <SlidersHorizontal size={14} weight="bold" color={colors.accent} />
                <Text style={[styles.quickChipText, { color: colors.text, fontSize: fontSize(12.5) }]}>
                  {t(locale, 'surfacesChip')} ({blockedList.length})
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : (
          /* Expanded Full Popup View with Tabs */
          <View style={styles.expandedContent}>
            {/* Tabs Header */}
            <View
              accessibilityRole="tablist"
              style={[
                styles.tabBar,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: isHighContrast ? 2 : 1,
                },
              ]}
            >
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'route' }}
                onPress={() => setActiveTab('route')}
                style={[
                  styles.tabItem,
                  activeTab === 'route' && { backgroundColor: colors.accent },
                ]}
              >
                <Path
                  size={16}
                  weight="bold"
                  color={activeTab === 'route' ? colors.accentText : colors.text}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: activeTab === 'route' ? colors.accentText : colors.text,
                      fontSize: fontSize(13),
                    },
                  ]}
                >
                  {t(locale, 'tabRoute')}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'place' }}
                onPress={() => setActiveTab('place')}
                style={[
                  styles.tabItem,
                  activeTab === 'place' && { backgroundColor: colors.accent },
                ]}
              >
                <Buildings
                  size={16}
                  weight="bold"
                  color={activeTab === 'place' ? colors.accentText : colors.text}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: activeTab === 'place' ? colors.accentText : colors.text,
                      fontSize: fontSize(13),
                    },
                  ]}
                >
                  {t(locale, 'tabPlace')}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'profile' }}
                onPress={() => setActiveTab('profile')}
                style={[
                  styles.tabItem,
                  activeTab === 'profile' && { backgroundColor: colors.accent },
                ]}
              >
                <SlidersHorizontal
                  size={16}
                  weight="bold"
                  color={activeTab === 'profile' ? colors.accentText : colors.text}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: activeTab === 'profile' ? colors.accentText : colors.text,
                      fontSize: fontSize(13),
                    },
                  ]}
                >
                  {t(locale, 'tabProfile')}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'report' }}
                onPress={() => setActiveTab('report')}
                style={[
                  styles.tabItem,
                  activeTab === 'report' && { backgroundColor: colors.accent },
                ]}
              >
                <Warning
                  size={16}
                  weight="bold"
                  color={activeTab === 'report' ? colors.accentText : colors.text}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: activeTab === 'report' ? colors.accentText : colors.text,
                      fontSize: fontSize(13),
                    },
                  ]}
                >
                  {t(locale, 'tabReport')}
                </Text>
              </Pressable>
            </View>

            {/* TAB CONTENT SCROLLVIEW */}
            <ScrollView
              contentContainerStyle={[
                styles.tabContentScroll,
                { paddingBottom: spacing.touch + 20 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* TAB 1: TRASA (ROUTE PLANNING & ANALYSIS) */}
              {activeTab === 'route' ? (
                <View style={styles.formSection}>
                  {/* Point A (Start) */}
                  <LocationPicker
                    label={t(locale, 'from')}
                    badge="A"
                    badgeColor="#005CA9"
                    point={{ name: fromQuery, position: fromPos }}
                    onChangePoint={(p) => {
                      setFromQuery(p.name);
                      setFromPos(p.position);
                      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                    }}
                    placeholder={t(locale, 'fromPlaceholder')}
                    showMyLocation
                    onUseMyLocation={handleUseMyLocation}
                    onPickOnMap={() => setPickingTarget(pickingTarget === 'start' ? null : 'start')}
                    isPickingOnMap={pickingTarget === 'start'}
                  />

                  {/* Swap Points Button (A ⇄ B) */}
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

                  {/* Point B (Destination) */}
                  <LocationPicker
                    label={t(locale, 'to')}
                    badge="B"
                    badgeColor="#D32F2F"
                    point={{ name: toQuery, position: toPos }}
                    onChangePoint={(p) => {
                      setToQuery(p.name);
                      setToPos(p.position);
                      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                    }}
                    placeholder={t(locale, 'toPlaceholder')}
                    onPickOnMap={() => setPickingTarget(pickingTarget === 'end' ? null : 'end')}
                    isPickingOnMap={pickingTarget === 'end'}
                  />

                  {/* Plan Route Action */}
                  <GovButton
                    title={t(locale, 'searchButton')}
                    icon={<NavigationArrow size={16} weight="bold" color={colors.accentText} />}
                    variant="primary"
                    loading={loadingRoute}
                    onPress={handleAnalyzeRoute}
                  />

                  {/* Active Route Result Card (if present) */}
                  {activeRouteReport && activeWalkingRoute ? (
                    <GovCard variant="accent">
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.resultTitle, { color: colors.text, fontSize: fontSize(16) }]}>
                          {t(locale, 'summaryCardTitle')}:
                        </Text>
                        <Text style={[styles.metricVal, { color: colors.accent, fontSize: fontSize(15) }]}>
                          {activeRouteReport.lengthMetres} m • {Math.round((activeWalkingRoute.durationSeconds || 60) / 60)} min
                        </Text>
                      </View>

                      {/* Barrier count grid */}
                      <View style={styles.barriersQuickGrid}>
                        <View style={[styles.barrierMiniBadge, { backgroundColor: colors.blockerBg, borderColor: colors.blockerBorder }]}>
                          <Text style={[styles.barrierMiniNum, { color: colors.blockerText, fontSize: fontSize(17) }]}>
                            {activeRouteReport.findings.filter((f) => f.severity === 'blocker').length}
                          </Text>
                          <Text style={[styles.barrierMiniLabel, { color: colors.blockerText, fontSize: fontSize(11) }]}>
                            {t(locale, 'severityBlocker')}
                          </Text>
                        </View>

                        <View style={[styles.barrierMiniBadge, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                          <Text style={[styles.barrierMiniNum, { color: colors.warningText, fontSize: fontSize(17) }]}>
                            {activeRouteReport.findings.filter((f) => f.severity === 'warning').length}
                          </Text>
                          <Text style={[styles.barrierMiniLabel, { color: colors.warningText, fontSize: fontSize(11) }]}>
                            {t(locale, 'severityWarning')}
                          </Text>
                        </View>

                        <View style={[styles.barrierMiniBadge, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}>
                          <Text style={[styles.barrierMiniNum, { color: colors.okText, fontSize: fontSize(17) }]}>
                            {activeRouteReport.findings.filter((f) => f.severity === 'ok').length}
                          </Text>
                          <Text style={[styles.barrierMiniLabel, { color: colors.okText, fontSize: fontSize(11) }]}>
                            {t(locale, 'facilitiesCount')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.routeActionRow}>
                        <GovButton
                          title={t(locale, 'showFullReportAndManeuvers')}
                          icon={<ArrowRight size={16} weight="bold" color={colors.accent} />}
                          variant="outline"
                          onPress={() => router.push('/route')}
                        />
                      </View>
                    </GovCard>
                  ) : null}

                  {/* Fast Demo Scenarios */}
                  <View style={styles.demoSection}>
                    <Text style={[styles.demoSectionTitle, { color: colors.muted, fontSize: fontSize(12.5) }]}>
                      {t(locale, 'fastDemoRoutes')}
                    </Text>
                    <View style={styles.demoButtonsRow}>
                      <GovButton
                        variant="outline"
                        title="Rynek → Wawel"
                        icon={<Path size={14} weight="bold" color={colors.accent} />}
                        onPress={() => loadDemoRoute(0)}
                        style={styles.halfBtn}
                      />
                      <GovButton
                        variant="outline"
                        title="Dworzec → Sukiennice"
                        icon={<Path size={14} weight="bold" color={colors.accent} />}
                        onPress={() => loadDemoRoute(1)}
                        style={styles.halfBtn}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              {/* TAB 2: OBIEKT (PLACE INSPECTION) */}
              {activeTab === 'place' ? (
                <View style={styles.formSection}>
                  <LocationPicker
                    label={t(locale, 'placeLabel')}
                    point={{ name: placeQuery, position: placePos }}
                    onChangePoint={(p) => {
                      setPlaceQuery(p.name);
                      setPlacePos(p.position);
                      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                    }}
                    placeholder={t(locale, 'placePlaceholder')}
                    onPickOnMap={() => setPickingTarget(pickingTarget === 'place' ? null : 'place')}
                    isPickingOnMap={pickingTarget === 'place'}
                  />

                  <GovButton
                    title={t(locale, 'searchPlaceButton')}
                    icon={<Buildings size={16} weight="bold" color={colors.accentText} />}
                    variant="primary"
                    loading={loadingPlace}
                    onPress={handleInspectPlace}
                  />

                  {activePlaceReport ? (
                    <GovCard variant="accent">
                      <Text style={[styles.resultTitle, { color: colors.text, fontSize: fontSize(16) }]}>
                        {activePlaceReport.placeName}
                      </Text>
                      <Text style={[styles.resultSub, { color: colors.muted, fontSize: fontSize(13) }]}>
                        {activePlaceReport.summaryMessage}
                      </Text>
                      <GovButton
                        title={t(locale, 'openPlaceCard')}
                        icon={<ArrowRight size={16} weight="bold" color={colors.accent} />}
                        variant="outline"
                        onPress={() => router.push('/place')}
                        style={{ marginTop: 8 }}
                      />
                    </GovCard>
                  ) : null}

                  {/* Fast Demo Places */}
                  <View style={styles.demoSection}>
                    <Text style={[styles.demoSectionTitle, { color: colors.muted, fontSize: fontSize(12.5) }]}>
                      {t(locale, 'popularDemoPlaces')}
                    </Text>
                    <View style={styles.demoButtonsRow}>
                      <GovButton
                        variant="outline"
                        title="Sukiennice"
                        icon={<Buildings size={14} weight="bold" color={colors.accent} />}
                        onPress={() => loadDemoPlace(0)}
                        style={styles.halfBtn}
                      />
                      <GovButton
                        variant="outline"
                        title="Wawel (R7)"
                        icon={<Buildings size={14} weight="bold" color={colors.accent} />}
                        onPress={() => loadDemoPlace(1)}
                        style={styles.halfBtn}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              {/* TAB 3: PROFIL I NAWIERZCHNIE (PROFILE & ROAD SURFACES) */}
              {activeTab === 'profile' ? (
                <View style={styles.formSection}>
                  <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(15) }]}>
                    {t(locale, 'selectProfile')}
                  </Text>

                  {/* Profile Cards */}
                  <View style={styles.profilesGrid}>
                    {(['wheelchair', 'custom'] as ProfileId[]).map((pid) => {
                      const selected = profileId === pid;
                      return (
                        <Pressable
                          key={pid}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: selected }}
                          onPress={() => setProfileId(pid)}
                          style={[
                            styles.profileMiniCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: selected ? colors.accent : colors.border,
                              borderWidth: selected ? 2.5 : 1,
                            },
                          ]}
                        >
                          {getProfileIcon(pid, 20)}
                          <Text
                            style={[
                              styles.profileMiniTitle,
                              {
                                color: selected ? colors.accent : colors.text,
                                fontSize: fontSize(13.5),
                                fontWeight: selected ? '800' : '600',
                              },
                            ]}
                          >
                            {getProfileLabel(pid)}
                          </Text>
                          {selected ? <Check size={14} weight="bold" color={colors.accent} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Blocked Road Types */}
                  <GovCard variant="default">
                    <Text style={[styles.customTitle, { color: colors.text, fontSize: fontSize(14.5) }]}>
                      {t(locale, 'blockedRoadTypesTitle')}
                    </Text>

                    <View style={styles.roadChipsWrap}>
                      {ROAD_TYPE_OPTIONS.map((rt) => {
                        const isBlocked = blockedList.includes(rt.id);
                        return (
                          <Pressable
                            key={rt.id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isBlocked }}
                            onPress={() => toggleBlockedRoadType(rt.id)}
                            style={[
                              styles.roadChip,
                              {
                                backgroundColor: isBlocked ? colors.blockerBg : colors.background,
                                borderColor: isBlocked ? colors.blockerBorder : colors.border,
                                borderWidth: isBlocked ? 2 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roadChipLabel,
                                {
                                  color: isBlocked ? colors.blockerText : colors.text,
                                  fontSize: fontSize(12.5),
                                  fontWeight: isBlocked ? '700' : '500',
                                },
                              ]}
                            >
                              {t(locale, rt.nameKey)}
                            </Text>
                            {isBlocked ? (
                              <Prohibit size={12} weight="bold" color={colors.blockerText} />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </GovCard>

                  {/* Custom Thresholds if custom profile selected */}
                  {profileId === 'custom' ? (
                    <GovCard variant="accent">
                      <Text style={[styles.customTitle, { color: colors.text, fontSize: fontSize(14.5) }]}>
                        {t(locale, 'customThresholdsTitle')}
                      </Text>

                      <View style={styles.thresholdRow}>
                        <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(13.5) }]}>
                          {t(locale, 'maxKerb')} <Text style={{ fontWeight: '800' }}>{customThresholds.maxKerbMillimetres} mm</Text>
                        </Text>
                        <View style={styles.stepBtnRow}>
                          <GovButton
                            variant="outline"
                            title="-10 mm"
                            onPress={() =>
                              setCustomThresholds({
                                ...customThresholds,
                                maxKerbMillimetres: Math.max(10, customThresholds.maxKerbMillimetres - 10),
                              })
                            }
                            style={styles.smallStepBtn}
                          />
                          <GovButton
                            variant="outline"
                            title="+10 mm"
                            onPress={() =>
                              setCustomThresholds({
                                ...customThresholds,
                                maxKerbMillimetres: customThresholds.maxKerbMillimetres + 10,
                              })
                            }
                            style={styles.smallStepBtn}
                          />
                        </View>
                      </View>

                      <View style={styles.thresholdRow}>
                        <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(13.5) }]}>
                          {t(locale, 'stepsTreatment')}{' '}
                          <Text style={{ fontWeight: '800', color: customThresholds.stepsAreBlocker ? colors.blockerText : colors.warningText }}>
                            {customThresholds.stepsAreBlocker ? t(locale, 'blockedStatusBlocked') : t(locale, 'severityWarning')}
                          </Text>
                        </Text>
                        <GovButton
                          variant="secondary"
                          title={t(locale, 'toggleStepsStatus')}
                          onPress={() =>
                            setCustomThresholds({
                              ...customThresholds,
                              stepsAreBlocker: !customThresholds.stepsAreBlocker,
                            })
                          }
                        />
                      </View>
                    </GovCard>
                  ) : null}
                </View>
              ) : null}

              {/* TAB 4: ZGŁOŚ (LOCAL REPORT & OSM NOTE) */}
              {activeTab === 'report' ? (
                <View style={styles.formSection}>
                  <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(15) }]}>
                    {t(locale, 'reportObstacleHeading')}
                  </Text>

                  <TextInput
                    value={reportDesc}
                    onChangeText={setReportDesc}
                    placeholder={t(locale, 'reportObstaclePlaceholder')}
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={3}
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        fontSize: fontSize(14),
                        borderWidth: isHighContrast ? 2 : 1,
                      },
                    ]}
                  />

                  {reportSuccess ? (
                    <GovCard variant="ok">
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Check size={16} weight="bold" color={colors.okText} />
                        <Text style={{ color: colors.okText, fontWeight: '700', fontSize: fontSize(13) }}>
                          {t(locale, 'reportSavedSuccess')}
                        </Text>
                      </View>
                    </GovCard>
                  ) : null}

                  <GovButton
                    title={t(locale, 'reportSubmit')}
                    icon={<Check size={16} weight="bold" color={colors.accentText} />}
                    variant="primary"
                    onPress={handleSubmitLocalReport}
                  />

                  <GovButton
                    title={t(locale, 'openFullOsmForm')}
                    icon={<ArrowRight size={16} weight="bold" color={colors.text} />}
                    variant="outline"
                    onPress={() => router.push('/report-correction')}
                  />

                  {localReports && localReports.length > 0 ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.sectionSubtitle, { color: colors.muted, fontSize: fontSize(12) }]}>
                        {t(locale, 'localReportsQueue')} ({localReports.length})
                      </Text>
                      {localReports.map((r) => (
                        <GovCard key={r.id} style={{ marginTop: 6 }}>
                          <Text style={{ color: colors.text, fontSize: fontSize(13) }}>{r.description}</Text>
                          <Text style={{ color: colors.muted, fontSize: fontSize(11), marginTop: 4 }}>
                            {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </GovCard>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  mapCanvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  floatingControlsRight: {
    position: 'absolute',
    right: 14,
    top: 14,
    gap: 10,
    zIndex: 20,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingRoutePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 15,
  },
  routePillText: {
    flex: 1,
    fontWeight: '700',
  },
  statusToast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 25,
  },
  statusToastText: {
    fontWeight: '600',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 30,
  },
  bottomSheetCollapsed: {
    height: 146,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  bottomSheetExpanded: {
    height: '66%',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHandleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetProfileName: {
    fontWeight: '800',
  },
  sheetToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontWeight: '600',
  },
  peekContent: {
    gap: 10,
    marginTop: 4,
  },
  peekSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  peekSearchPlaceholder: {
    fontWeight: '500',
    flex: 1,
  },
  quickChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  quickChipText: {
    fontWeight: '600',
  },
  expandedContent: {
    flex: 1,
    marginTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 3,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  tabItemText: {
    fontWeight: '700',
  },
  tabContentScroll: {
    gap: 12,
  },
  formSection: {
    gap: 10,
  },
  fieldBox: {
    gap: 5,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontWeight: '600',
  },
  myLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  myLocationText: {
    fontWeight: '700',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontWeight: '800',
  },
  resultSub: {
    fontWeight: '500',
    marginTop: 2,
  },
  metricVal: {
    fontWeight: '800',
  },
  barriersQuickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  barrierMiniBadge: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  barrierMiniNum: {
    fontWeight: '800',
  },
  barrierMiniLabel: {
    fontWeight: '600',
  },
  routeActionRow: {
    marginTop: 8,
  },
  demoSection: {
    gap: 6,
    marginTop: 4,
  },
  demoSectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfBtn: {
    flex: 1,
  },
  sectionSubtitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  profilesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  profileMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 6,
  },
  profileMiniTitle: {
    letterSpacing: 0.2,
  },
  customTitle: {
    fontWeight: '700',
  },
  roadChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  roadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  roadChipLabel: {
    letterSpacing: 0.2,
  },
  thresholdRow: {
    gap: 6,
    marginTop: 6,
  },
  paramLabel: {
    fontWeight: '600',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallStepBtn: {
    flex: 1,
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

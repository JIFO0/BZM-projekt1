import {
  DEMO_SNAPSHOT,
  type LonLat,
  type ProfileId,
} from '@krakow-bez-barier/core';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowRight,
  ArrowsDownUp,
  Buildings,
  Camera,
  CaretDown,
  CaretUp,
  Check,
  Crosshair,
  Image as ImageIcon,
  Info,
  Lightning,
  MagnifyingGlass,
  NavigationArrow,
  PathIcon as Path,
  Prohibit,
  Question,
  ShieldCheck,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Warning,
  Wheelchair,
  X,
} from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarrierViewControl } from '@/components/BarrierViewControl';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { KrakowHeader } from '@/components/KrakowHeader';
import { LocationPicker } from '@/components/LocationPicker';
import { MapLocationPopup } from '@/components/MapLocationPopup';
import { MapView } from '@/components/MapView';
import { city } from '@/config/city';
import { t } from '@/i18n/strings';
import {
  addPlaceServerComment,
  checkRoutingEngineHealth,
  createServerHazard,
  DEFAULT_PRESET_PLACES,
  fetchPlaceServerComments,
  fetchServerHazards,
  inspectPlace,
  planAndAnalyzeRoute,
  reverseGeocodeLocation,
  suggestPlaces,
  uploadPhotoToServer,
  type RouteVariantId,
  type RoutingEngineHealth,
  type ServerPlaceComment,
  type ServerRouteHazard,
} from '@/services/api';
import {
  citizenReportsAsFindings,
  getAllCityBarriers,
  selectMapFindings,
} from '@/services/barriers';
import { triggerGentleHaptic } from '@/services/haptics';
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

type PopupTab = 'route' | 'place' | 'profile';

const KERB_LEVELS = [
  { mm: 30, labelKey: 'kerbLow' as const },
  { mm: 70, labelKey: 'kerbMedium' as const },
  { mm: 140, labelKey: 'kerbHigh' as const },
];

const EMPTY_POINT: LonLat = { lon: 19.9373, lat: 50.0619 };

function extractRouteParams(params: Record<string, any>) {
  let fromName = params.fromName;
  let fromLat = params.fromLat ? parseFloat(params.fromLat) : undefined;
  let fromLon = params.fromLon ? parseFloat(params.fromLon) : undefined;
  let toName = params.toName;
  let toLat = params.toLat ? parseFloat(params.toLat) : undefined;
  let toLon = params.toLon ? parseFloat(params.toLon) : undefined;
  let demoRoute = params.demoRoute !== undefined ? parseInt(params.demoRoute, 10) : undefined;
  let variant = params.variant as RouteVariantId | undefined;

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
    } catch { }
  }

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
      if (!variant && getVal('variant')) variant = getVal('variant') as RouteVariantId;
    } catch { }
  }

  return { fromName, fromLat, fromLon, toName, toLat, toLon, demoRoute, variant };
}

function formatBlockerCount(count: number, locale: string): string {
  if (locale === 'pl') {
    if (count === 1) return '1 blokada';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return `${count} blokady`;
    }
    return `${count} blokad`;
  } else if (locale === 'uk') {
    if (count === 1) return '1 блокада';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return `${count} блокади`;
    }
    return `${count} блокад`;
  }
  return `${count} ${count === 1 ? 'blocker' : 'blockers'}`;
}

export default function MapHomeScreen() {
  const rawParams = useLocalSearchParams();
  const initialParamsHandled = useRef(false);
  const {
    locale,
    profileId,
    setProfileId,
    activeThresholds,
    updateActiveThresholds,
    toggleBlockedRoadType,
    pendingDestination,
    setPendingDestination,
    debugState,
    activeRouteReport,
    setActiveRouteReport,
    activeWalkingRoute,
    setActiveWalkingRoute,
    setActiveRouteFacts,
    activeRouteIsSample,
    setActiveRouteIsSample,
    routeVariants,
    setRouteVariants,
    selectedRouteVariant,
    selectRouteVariant,
    activePlaceReport,
    setActivePlaceReport,
    userLocation,
    isLocating,
    fetchUserLocation,
    colors,
    fontSize,
    isHighContrast,
    userAccount,
    barrierViewMode,
    setBarrierViewMode,
    localReports,
    addLocalReport,
    glossaryModalVisible,
    setGlossaryModalVisible,
  } = useSession();

  const routeBarriers = useMemo(() => {
    return activeRouteReport?.findings || [];
  }, [activeRouteReport]);

  const allCityBarriers = useMemo(() => {
    return getAllCityBarriers(activeThresholds);
  }, [activeThresholds]);

  // Map state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 50.0619,
    lon: 19.9373,
  });



  // Routing Engine (GraphHopper) health & coverage status
  const [engineStatus, setEngineStatus] = useState<RoutingEngineHealth | null>(null);

  useEffect(() => {
    let active = true;
    checkRoutingEngineHealth().then((status) => {
      if (active) {
        setEngineStatus(status);
        if (!status.online) {
          setStatusMessage(
            locale === 'pl'
              ? '⚠️ Silnik tras bez barier jest offline. Uruchom usługę w backendzie.'
              : '⚠️ Barrier-free routing engine is offline. Start backend service.'
          );
          setTimeout(() => setStatusMessage(null), 6000);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [locale]);

  // Popup menu / sheet state (Google/Apple Maps style)
  const [popupExpanded, setPopupExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PopupTab>('route');

  // Search & Routing state
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

  // Report popup
  const [reportPopupOpen, setReportPopupOpen] = useState(false);
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportQuery, setReportQuery] = useState('');
  const [reportPos, setReportPos] = useState<LonLat | null>(null);

  const [serverHazards, setServerHazards] = useState<ServerRouteHazard[]>([]);
  const [reportEmail, setReportEmail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  useEffect(() => {
    if (userAccount?.email && !reportEmail) {
      setReportEmail(userAccount.email);
    }
  }, [userAccount?.email, reportEmail]);

  // New Hazard Report with Photo state
  const [newReportCategory, setNewReportCategory] = useState<'hole' | 'obstacle' | 'flood' | 'surface' | 'other'>('obstacle');
  const [newReportPhoto, setNewReportPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Place Accessibility Validation with Photo state
  const [showPlaceValidationForm, setShowPlaceValidationForm] = useState(false);
  const [placeComments, setPlaceComments] = useState<ServerPlaceComment[]>([]);
  const [placeCommentText, setPlaceCommentText] = useState('');
  const [placeCommentSentiment, setPlaceCommentSentiment] = useState<'positive' | 'negative'>('positive');
  const [placeCommentCategory, setPlaceCommentCategory] = useState<'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general'>('entrance');
  const [placeCommentPhoto, setPlaceCommentPhoto] = useState<string | null>(null);
  const [placeCommentSubmitting, setPlaceCommentSubmitting] = useState(false);
  const [inspectedPlace, setInspectedPlace] = useState<{ name?: string; lat: number; lon: number } | null>(null);

  const pickPhotoAsync = async (source: 'camera' | 'library'): Promise<string | null> => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            locale === 'pl' ? 'Uprawnienia aparatu' : 'Camera permission',
            locale === 'pl'
              ? 'Wymagany jest dostęp do aparatu, aby zrobić zdjęcie barierze.'
              : 'Camera access is required to take a photo of the barrier.'
          );
          return null;
        }
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]!;
          return asset.base64
            ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            locale === 'pl' ? 'Uprawnienia galerii' : 'Gallery permission',
            locale === 'pl'
              ? 'Wymagany jest dostęp do galerii zdjęć.'
              : 'Gallery access is required to select a photo.'
          );
          return null;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]!;
          return asset.base64
            ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
            : asset.uri;
        }
      }
    } catch (err: any) {
      Alert.alert(
        locale === 'pl' ? 'Błąd zdjęcia' : 'Photo error',
        err.message || 'Nie udało się wybrać zdjęcia.'
      );
    }
    return null;
  };

  const loadServerHazards = async () => {
    try {
      const list = await fetchServerHazards();
      setServerHazards(list);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    loadServerHazards();
  }, []);

  const loadPlaceComments = async (placeId: string) => {
    try {
      const comments = await fetchPlaceServerComments(placeId);
      setPlaceComments(comments);
    } catch {
      // Non-fatal
    }
  };

  // Interactive map picking target
  const [pickingTarget, setPickingTarget] = useState<'start' | 'end' | 'place' | 'report' | null>(null);

  const mapPins = useMemo(() => {
    const reports = citizenReportsAsFindings([
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
    ]);
    const cityBarriers = getAllCityBarriers(activeThresholds);
    const effectiveFindings = routeBarriers.length > 0 ? routeBarriers : cityBarriers;
    const shared = {
      routeFindings: effectiveFindings,
      reports,
      allCityBarriers,
      routeCoordinates: activeWalkingRoute?.coordinates,
      corridorMetres: city.corridorMeters,
    };
    return {
      displayed: selectMapFindings({ ...shared, mode: barrierViewMode }),
      problems: selectMapFindings({ ...shared, mode: 'route' }),
      evaluated: selectMapFindings({ ...shared, mode: 'all' }),
    };
  }, [barrierViewMode, routeBarriers, serverHazards, localReports, allCityBarriers, activeWalkingRoute?.coordinates, activeThresholds]);
  const displayedFindings = mapPins.displayed;

  // Clicked map location popup state
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
    isLoading?: boolean;
  } | null>(null);

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
        return <Wheelchair size={size} weight="bold" color={colors.accent} />;
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
      triggerGentleHaptic('location');
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

  // 2. Plan & Analyze Route
  const handleAnalyzeRoute = async (
    overrideStart?: { name: string; position?: LonLat | null } | unknown,
    overrideEnd?: { name: string; position?: LonLat | null },
  ) => {
    const isStartObject =
      overrideStart != null &&
      typeof overrideStart === 'object' &&
      'name' in overrideStart &&
      typeof (overrideStart as any).name === 'string';

    const isEndObject =
      overrideEnd != null &&
      typeof overrideEnd === 'object' &&
      'name' in overrideEnd &&
      typeof (overrideEnd as any).name === 'string';

    const startObj = isStartObject
      ? (overrideStart as { name: string; position?: LonLat | null })
      : null;
    const endObj = isEndObject ? overrideEnd : null;

    let resolvedStart =
      startObj?.position !== undefined
        ? startObj.position
        : (fromPosRef.current ?? fromPos);
    let resolvedEnd =
      endObj?.position !== undefined
        ? endObj.position
        : (toPosRef.current ?? toPos);

    let startName =
      (startObj ? startObj.name : (fromQueryRef.current || fromQuery)) || '';
    let endName =
      (endObj ? endObj.name : (toQueryRef.current || toQuery)) || '';

    if (!startName.trim() && resolvedStart) {
      startName = `${resolvedStart.lat.toFixed(5)}, ${resolvedStart.lon.toFixed(5)}`;
    }
    if (!endName.trim() && resolvedEnd) {
      endName = `${resolvedEnd.lat.toFixed(5)}, ${resolvedEnd.lon.toFixed(5)}`;
    }

    if (!startName.trim() || !endName.trim()) {
      Alert.alert(t(locale, 'warningTitle'), t(locale, 'routeEndpointsRequired'));
      return;
    }
    setLoadingRoute(true);
    setStatusMessage(null);
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
        Alert.alert(t(locale, 'warningTitle'), t(locale, 'routeEndpointsRequired'));
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
      setRouteVariants(result.variants ?? null);
      if (result.selectedVariant) {
        selectRouteVariant(result.selectedVariant);
      }
      setBarrierViewMode('route');
      setPopupExpanded(true);
      setActiveTab('route');

      router.setParams({
        fromName: startName,
        fromLat: String(resolvedStart.lat),
        fromLon: String(resolvedStart.lon),
        toName: endName,
        toLat: String(resolvedEnd.lat),
        toLon: String(resolvedEnd.lon),
        profile: profileId,
        variant: result.selectedVariant || selectedRouteVariant,
      });

      // Center map on route start
      if (result.walkingRoute.coordinates.length > 0) {
        setMapCenter({
          lat: result.walkingRoute.coordinates[0]![1],
          lon: result.walkingRoute.coordinates[0]![0],
        });
      }
    } catch (err: any) {
      // CLEAR existing route completely so no misleading route is shown
      setActiveWalkingRoute(null);
      setActiveRouteReport(null);
      setActiveRouteFacts([]);
      setRouteVariants(null);
      const errMsg = err?.message || t(locale, 'routeErrorMsg');
      setStatusMessage(`⚠️ ${errMsg}`);
      Alert.alert(t(locale, 'routeErrorTitle'), errMsg);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Clear Active Route only (keeping points A and B)
  const clearActiveRoute = useCallback(() => {
    setActiveWalkingRoute(null);
    setActiveRouteReport(null);
    setActiveRouteFacts([]);
    setRouteVariants(null);
    setBarrierViewMode('none');
    router.setParams({
      variant: undefined,
    });
  }, [setActiveWalkingRoute, setActiveRouteReport, setActiveRouteFacts, setRouteVariants, setBarrierViewMode]);

  // Handle pending destination set from place screen or external sources
  useEffect(() => {
    if (pendingDestination) {
      const destName = pendingDestination.name;
      const destPos = pendingDestination.position;
      setToQuery(destName);
      setToPos(destPos);
      toQueryRef.current = destName;
      toPosRef.current = destPos;
      setActiveTab('route');
      setPopupExpanded(true);
      setMapCenter({ lat: destPos.lat, lon: destPos.lon });
      setStatusMessage(`Ustawiono cel trasy: ${destName}`);
      setPendingDestination(null);
      setTimeout(() => setStatusMessage(null), 3000);
      clearActiveRoute();
    }
  }, [pendingDestination, setPendingDestination, clearActiveRoute]);

  const handleUseMyLocation = async () => {
    setStatusMessage(t(locale, 'gpsFetching'));
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
      setMapCenter({ lat: loc.lat, lon: loc.lon });
      setStatusMessage(t(locale, 'gpsStartPointSet'));
      setTimeout(() => setStatusMessage(null), 2500);
      clearActiveRoute();
    } else {
      Alert.alert(
        t(locale, 'gpsUnavailableTitle'),
        t(locale, 'gpsUnavailableSearchDesc'),
        [
          {
            text: t(locale, 'btnCenterKrakowAction'),
            onPress: () => {
              const startName = t(locale, 'rynekGlowny');
              const startPoint = { lon: 19.9373, lat: 50.0619 };
              setFromQuery(startName);
              setFromPos(startPoint);
              fromQueryRef.current = startName;
              fromPosRef.current = startPoint;
              setMapCenter({ lat: 50.0619, lon: 19.9373 });
              clearActiveRoute();
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
    clearActiveRoute();
  };

  // Interactive Map Click Handler
  const handleMapClick = async (coords: { lat: number; lon: number }) => {
    let name = `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;

    if (pickingTarget) {
      setClickedLocation(null);
      const coordName = `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;

      if (pickingTarget === 'start') {
        setFromPos(coords);
        setFromQuery(coordName);
        fromPosRef.current = coords;
        fromQueryRef.current = coordName;
        setPickingTarget(null);
        clearActiveRoute();
        setStatusMessage(`${t(locale, 'pointA')}: ${coordName}`);
        setTimeout(() => setStatusMessage(null), 3000);
        reverseGeocodeLocation(coords.lat, coords.lon, locale)
          .then((rev) => {
            if (rev?.name) {
              setFromQuery(rev.name);
              fromQueryRef.current = rev.name;
              setStatusMessage(`${t(locale, 'pointA')}: ${rev.name}`);
              setTimeout(() => setStatusMessage(null), 3000);
            }
          })
          .catch(() => { });
      } else if (pickingTarget === 'end') {
        setToPos(coords);
        setToQuery(coordName);
        toPosRef.current = coords;
        toQueryRef.current = coordName;
        setPickingTarget(null);
        clearActiveRoute();
        setStatusMessage(`${t(locale, 'pointB')}: ${coordName}`);
        setTimeout(() => setStatusMessage(null), 3000);
        reverseGeocodeLocation(coords.lat, coords.lon, locale)
          .then((rev) => {
            if (rev?.name) {
              setToQuery(rev.name);
              toQueryRef.current = rev.name;
              setStatusMessage(`${t(locale, 'pointB')}: ${rev.name}`);
              setTimeout(() => setStatusMessage(null), 3000);
            }
          })
          .catch(() => { });
      } else if (pickingTarget === 'place') {
        setPlacePos(coords);
        setPlaceQuery(coordName);
        setPickingTarget(null);
        setStatusMessage(`${t(locale, 'placeLabel')}: ${coordName}`);
        setTimeout(() => setStatusMessage(null), 3000);
        reverseGeocodeLocation(coords.lat, coords.lon, locale)
          .then((rev) => {
            if (rev?.name) {
              setPlaceQuery(rev.name);
              setStatusMessage(`${t(locale, 'placeLabel')}: ${rev.name}`);
              setTimeout(() => setStatusMessage(null), 3000);
            }
          })
          .catch(() => { });
      } else if (pickingTarget === 'report') {
        const coordText = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
        setReportPos(coords);
        setReportQuery(coordText);
        setPickingTarget(null);
        setReportPopupOpen(true);
        setStatusMessage(`${t(locale, 'reportLocationLabel')}: ${coordText}`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
      return;
    }

    // Default map click: show interactive location popup with geocoded info
    setClickedLocation({
      lat: coords.lat,
      lon: coords.lon,
      name,
      isLoading: true,
    });

    try {
      const rev = await reverseGeocodeLocation(coords.lat, coords.lon, locale);
      if (rev?.name) {
        name = rev.name;
      } else {
        const preset = DEFAULT_PRESET_PLACES.find((p) => {
          const dLat = Math.abs(p.position.lat - coords.lat);
          const dLon = Math.abs(p.position.lon - coords.lon);
          return dLat < 0.0015 && dLon < 0.0015;
        });
        if (preset) {
          name = preset.name;
        }
      }
    } catch {
      // keep coordinates as fallback
    }

    setClickedLocation({
      lat: coords.lat,
      lon: coords.lon,
      name,
      isLoading: false,
    });
  };

  // 3. Inspect Place (supports optional direct query/position overrides and screen navigation)
  const handleInspectPlace = async (
    targetQuery?: string,
    targetPos?: LonLat,
    navigateToScreen = false,
  ) => {
    const q = targetQuery ?? placeQuery;
    const pos = targetPos ?? placePos;
    setLoadingPlace(true);
    setStatusMessage(null);
    setInspectedPlace({ name: q, lat: pos.lat, lon: pos.lon });
    try {
      const result = await inspectPlace(q, pos, debugState);
      setActivePlaceReport(result.report);
      setMapCenter({ lat: pos.lat, lon: pos.lon });
      if (navigateToScreen) {
        router.push({
          pathname: '/place',
          params: {
            placeName: q,
            placeLat: String(pos.lat),
            placeLon: String(pos.lon),
          },
        });
      } else {
        setPopupExpanded(true);
        setActiveTab('place');
      }
    } catch {
      // Fallback report ensures the place always opens and displays the "Brak informacji" card
      const fallbackReport = {
        placeName: q,
        position: pos,
        matchConfidence: 0,
        isConfidentMatch: false,
        factsByCategory: { entrance: [], inside: [], toilet: [], surroundings: [] },
        allFacts: [],
        summaryMessage: locale === 'pl' ? 'Brak informacji w bazie danych' : 'No information in database',
        isSample: false,
      };
      setActivePlaceReport(fallbackReport as any);
      setMapCenter({ lat: pos.lat, lon: pos.lon });
      if (navigateToScreen) {
        router.push({
          pathname: '/place',
          params: {
            placeName: q,
            placeLat: String(pos.lat),
            placeLon: String(pos.lon),
          },
        });
      } else {
        setPopupExpanded(true);
        setActiveTab('place');
      }
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
      triggerGentleHaptic('route');
      setActiveWalkingRoute(result.walkingRoute);
      setActiveRouteReport(result.report);
      setActiveRouteFacts(result.facts);
      setActiveRouteIsSample(result.isSample);
      setRouteVariants(result.variants ?? null);
      if (result.selectedVariant) {
        selectRouteVariant(result.selectedVariant);
      }
      setBarrierViewMode('route');

      router.setParams({
        demoRoute: String(index),
        fromName: routeData.start.name,
        fromLat: String(routeData.start.position.lat),
        fromLon: String(routeData.start.position.lon),
        toName: routeData.end.name,
        toLat: String(routeData.end.position.lat),
        toLon: String(routeData.end.position.lon),
        profile: profileId,
        variant: result.selectedVariant || selectedRouteVariant,
      });

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

  // Restore route on initial mount if query parameters are present
  useEffect(() => {
    if (initialParamsHandled.current || activeWalkingRoute) return;
    initialParamsHandled.current = true;
    const rp = extractRouteParams(rawParams);
    if (rp.demoRoute !== undefined && DEMO_SNAPSHOT.routes[rp.demoRoute]) {
      loadDemoRoute(rp.demoRoute);
    } else if (
      rp.fromLat !== undefined &&
      !isNaN(rp.fromLat) &&
      rp.fromLon !== undefined &&
      !isNaN(rp.fromLon) &&
      rp.toLat !== undefined &&
      !isNaN(rp.toLat) &&
      rp.toLon !== undefined &&
      !isNaN(rp.toLon)
    ) {
      if (rp.fromName) setFromQuery(rp.fromName);
      setFromPos({ lat: rp.fromLat, lon: rp.fromLon });
      if (rp.toName) setToQuery(rp.toName);
      setToPos({ lat: rp.toLat, lon: rp.toLon });
      setActiveTab('route');
      setPopupExpanded(true);
      setLoadingRoute(true);
      planAndAnalyzeRoute({
        start: { name: rp.fromName || 'Start', position: { lat: rp.fromLat, lon: rp.fromLon } },
        end: { name: rp.toName || 'Cel', position: { lat: rp.toLat, lon: rp.toLon } },
        profileId,
        thresholds: activeThresholds,
        debugState,
      })
        .then((result) => {
          triggerGentleHaptic('route');
          setActiveWalkingRoute(result.walkingRoute);
          setActiveRouteReport(result.report);
          setActiveRouteFacts(result.facts);
          setActiveRouteIsSample(result.isSample);
          setRouteVariants(result.variants ?? null);
          if (result.selectedVariant) selectRouteVariant(result.selectedVariant);
          setBarrierViewMode('route');
          if (result.walkingRoute.coordinates.length > 0) {
            setMapCenter({
              lat: result.walkingRoute.coordinates[0]![1],
              lon: result.walkingRoute.coordinates[0]![0],
            });
          }
        })
        .catch(() => { })
        .finally(() => setLoadingRoute(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick Demo Place Loader
  const loadDemoPlace = async (index: number) => {
    const placeData = DEMO_SNAPSHOT.places[index];
    if (!placeData) return;
    setPlaceQuery(placeData.name);
    setPlacePos(placeData.position);
    setInspectedPlace({ name: placeData.name, lat: placeData.position.lat, lon: placeData.position.lon });
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

  const handleSelectPresetPlace = async (p: (typeof DEFAULT_PRESET_PLACES)[number]) => {
    setPlaceQuery(p.name);
    setPlacePos(p.position);
    setInspectedPlace({ name: p.name, lat: p.position.lat, lon: p.position.lon });
    setLoadingPlace(true);
    setStatusMessage(`Pobieranie danych dla: ${p.name}`);
    try {
      const result = await inspectPlace(p.name, p.position, debugState);
      setActivePlaceReport(result.report);
      setPopupExpanded(true);
      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
    } catch (err: any) {
      Alert.alert('Błąd sprawdzania miejsca', err.message || 'Nie udało się pobrać danych.');
    } finally {
      setLoadingPlace(false);
      setStatusMessage(null);
    }
  };

  const handleSetPlaceAsDestination = (p: (typeof DEFAULT_PRESET_PLACES)[number]) => {
    setToQuery(p.name);
    setToPos(p.position);
    toQueryRef.current = p.name;
    toPosRef.current = p.position;
    setActiveTab('route');
    setStatusMessage(`Ustawiono cel trasy: ${p.name}`);
    setTimeout(() => setStatusMessage(null), 3000);
    clearActiveRoute();
  };

  // Clear Active Route
  const handleClearRoute = () => {
    setActiveWalkingRoute(null);
    setActiveRouteReport(null);
    setActiveRouteFacts([]);
    setRouteVariants(null);
    setBarrierViewMode('none');
    setFromQuery('');
    setFromPos(null);
    fromQueryRef.current = '';
    fromPosRef.current = null;
    setToQuery('');
    setToPos(null);
    toQueryRef.current = '';
    toPosRef.current = null;
    router.setParams({
      fromName: undefined,
      fromLat: undefined,
      fromLon: undefined,
      toName: undefined,
      toLat: undefined,
      toLon: undefined,
      demoRoute: undefined,
      variant: undefined,
    });
  };

  // Submit hazard report directly to server with email and optional photo
  const handleSubmitServerReport = async () => {
    const effectiveEmail = (reportEmail.trim() || userAccount?.email || 'mieszkaniec@krakow.pl').trim();
    if (!effectiveEmail || !effectiveEmail.includes('@') || !effectiveEmail.includes('.')) {
      Alert.alert(
        t(locale, 'warningTitle'),
        locale === 'pl'
          ? 'Podaj poprawny adres e-mail (jest wymagany do weryfikacji zgłoszenia).'
          : 'Please provide a valid email address (required for report verification).'
      );
      return;
    }
    if (!reportDesc.trim()) {
      Alert.alert(t(locale, 'warningTitle'), t(locale, 'reportDescRequired'));
      return;
    }

    const position = reportPos
      ? { lat: reportPos.lat, lon: reportPos.lon }
      : { lat: mapCenter.lat, lon: mapCenter.lon };

    let uploadedUrl: string | undefined = undefined;
    if (newReportPhoto) {
      setIsUploadingPhoto(true);
      try {
        uploadedUrl = await uploadPhotoToServer(newReportPhoto, `hazard-${Date.now()}.jpg`);
      } catch (err: any) {
        Alert.alert(
          locale === 'pl' ? 'Błąd zdjęcia' : 'Photo error',
          err.message || 'Nie udało się przesłać zdjęcia.'
        );
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    setIsSubmittingReport(true);
    try {
      await createServerHazard({
        description: reportDesc.trim(),
        category: newReportCategory,
        email: effectiveEmail,
        photoUrl: uploadedUrl,
        position,
      });
      await loadServerHazards();

      setReportDesc('');
      setNewReportPhoto(null);
      setReportSuccess(true);
      setMapCenter({ lat: position.lat, lon: position.lon });
      setStatusMessage(
        locale === 'pl'
          ? 'Zgłoszenie zostało przesłane na serwer i oznaczone na mapie.'
          : locale === 'uk'
            ? 'Повідомлення надіслано на сервер та відображено na карті.'
            : 'Report submitted to server and displayed on map.'
      );
      setTimeout(() => {
        setReportSuccess(false);
        setStatusMessage(null);
        setReportPopupOpen(false);
        setReportPos(null);
        setReportQuery('');
      }, 2000);
      setClickedLocation(null);
    } catch (err: any) {
      addLocalReport(reportDesc.trim(), {
        photoUrl: uploadedUrl,
        category: newReportCategory,
        position,
      });
      setReportDesc('');
      setNewReportPhoto(null);
      setReportPopupOpen(false);
      setReportPos(null);
      setReportQuery('');
      setClickedLocation(null);
      Alert.alert(
        locale === 'pl' ? 'Błąd serwera' : locale === 'uk' ? 'Помилка сервера' : 'Server error',
        err.message ||
        (locale === 'pl'
          ? 'Nie udało się zapisać zgłoszenia na serwerze (zapisano lokalnie).'
          : locale === 'uk'
            ? 'Не вдалося зберегти повідомлення на сервері (збережено локально).'
            : 'Failed to submit report to server (saved locally).')
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const openReportDialog = (explicitPos?: LonLat) => {
    if (explicitPos) {
      const coordText = `${explicitPos.lat.toFixed(6)}, ${explicitPos.lon.toFixed(6)}`;
      setReportPos(explicitPos);
      setReportQuery(coordText);
    } else {
      const activePin = clickedLocation
        ? { lat: clickedLocation.lat, lon: clickedLocation.lon }
        : (activeTab === 'place' && inspectedPlace)
          ? { lat: inspectedPlace.lat, lon: inspectedPlace.lon }
          : null;

      if (activePin) {
        const coordText = `${activePin.lat.toFixed(6)}, ${activePin.lon.toFixed(6)}`;
        setReportPos(activePin);
        setReportQuery(coordText);
      } else if (userLocation) {
        const coordText = `${userLocation.lat.toFixed(6)}, ${userLocation.lon.toFixed(6)}`;
        setReportPos({ lat: userLocation.lat, lon: userLocation.lon });
        setReportQuery(coordText);
      } else {
        const coordText = `${mapCenter.lat.toFixed(6)}, ${mapCenter.lon.toFixed(6)}`;
        setReportPos({ lat: mapCenter.lat, lon: mapCenter.lon });
        setReportQuery(coordText);
      }
    }
    setReportPopupOpen(true);
  };

  // Add Place Accessibility Validation with Photo
  const handleAddPlaceValidation = async (targetPlaceId: string) => {
    if (!placeCommentText.trim()) {
      Alert.alert('Wpisz opinię', 'Podaj opis dostępności tego miejsca.');
      return;
    }
    setPlaceCommentSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (placeCommentPhoto) {
        setIsUploadingPhoto(true);
        try {
          uploadedUrl = await uploadPhotoToServer(placeCommentPhoto, `place-${targetPlaceId}.jpg`);
        } catch {
          uploadedUrl = placeCommentPhoto;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const email = userAccount?.email || 'uzytkownik@krakow.pl';
      const created = await addPlaceServerComment(targetPlaceId, {
        sentiment: placeCommentSentiment,
        comment: placeCommentText.trim(),
        category: placeCommentCategory,
        email,
        photoUrl: uploadedUrl,
      });

      setPlaceComments((prev) => [created, ...prev]);
      setPlaceCommentText('');
      setPlaceCommentPhoto(null);
      setShowPlaceValidationForm(false);
      setStatusMessage('Opinia i zdjęcie dostępności miejsca zostały opublikowane!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      Alert.alert('Błąd walidacji miejsca', err.message || 'Nie udało się dodać walidacji miejsca.');
    } finally {
      setPlaceCommentSubmitting(false);
    }
  };

  useEffect(() => {
    loadServerHazards();
  }, []);

  useEffect(() => {
    if (activeTab === 'place') {
      const placeId = activePlaceReport?.placeName
        ? `place-${activePlaceReport.placeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        : 'place-sukiennice';
      loadPlaceComments(placeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
          findings={displayedFindings}
          center={mapCenter}
          userLocation={userLocation}
          clickedLocation={clickedLocation}
          inspectedPlace={inspectedPlace}
          startLocation={
            fromPos && fromPos.lat != null && fromPos.lon != null
              ? {
                name: fromQuery || 'Start',
                lat: fromPos.lat,
                lon: fromPos.lon,
              }
              : activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? {
                  name: fromQuery || 'Start',
                  lat: activeWalkingRoute.coordinates[0]![1],
                  lon: activeWalkingRoute.coordinates[0]![0],
                }
                : undefined
          }
          endLocation={
            toPos && toPos.lat != null && toPos.lon != null
              ? {
                name: toQuery || (locale === 'pl' ? 'Cel' : locale === 'uk' ? 'Ціль' : 'Destination'),
                lat: toPos.lat,
                lon: toPos.lon,
              }
              : activeWalkingRoute && activeWalkingRoute.coordinates.length > 0
                ? {
                  name: toQuery || (locale === 'pl' ? 'Cel' : locale === 'uk' ? 'Ціль' : 'Destination'),
                  lat: activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]![1],
                  lon: activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]![0],
                }
                : undefined
          }
          onMapClick={handleMapClick}
          isPickingMode={pickingTarget !== null}
        />

        {activeWalkingRoute ? (
          <View style={styles.floatingBarrierControl}>
            <BarrierViewControl
              compact
              mode={barrierViewMode}
              onChangeMode={setBarrierViewMode}
              hasActiveRoute={Boolean(activeWalkingRoute)}
              routeBarriersCount={mapPins.problems.length}
              allBarriersCount={mapPins.evaluated.length}
            />
          </View>
        ) : null}

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

          {/* Report Event / Hazard Floating Button on the Right */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'tabReport')}
            onPress={() => {
              openReportDialog();
            }}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: reportPopupOpen
                  ? colors.warningBg || colors.accent
                  : colors.surface,
                borderColor: reportPopupOpen
                  ? colors.warningBorder || colors.accent
                  : '#D97706',
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <Warning
              size={22}
              weight="bold"
              color={
                reportPopupOpen
                  ? colors.warningText || colors.accentText
                  : '#D97706'
              }
            />
          </Pressable>

          {/* Słowniczek pojęć i skrótów WCAG AAA (Kryteria 3.1.3 i 3.1.4) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'glossaryBtn')}
            onPress={() => setGlossaryModalVisible(true)}
            style={[
              styles.floatingBtn,
              {
                backgroundColor: glossaryModalVisible ? colors.accent : colors.surface,
                borderColor: glossaryModalVisible ? colors.focus : colors.border,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <Question
              size={22}
              weight="bold"
              color={glossaryModalVisible ? colors.accentText : colors.text}
            />
          </Pressable>
        </View>

        {/* Active Route Floating Pill (if route is active) */}
        {activeWalkingRoute && activeRouteReport ? (
          <View
            style={[
              styles.floatingRoutePill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.accent,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'btnShowRouteSummary')}
              onPress={() => {
                setActiveTab('route');
                setPopupExpanded(true);
              }}
              style={styles.routePillMain}
            >
              <Path size={18} weight="bold" color={colors.accent} />
              <Text style={[styles.routePillText, { color: colors.text, fontSize: fontSize(13) }]}>
                {(activeRouteReport.lengthMetres / 1000).toFixed(1)} km • {Math.round((activeWalkingRoute.durationSeconds || 120) / 60)} min
                {routeVariants
                  ? ` • ${t(locale, selectedRouteVariant === 'fastest' ? 'routePillShortest' : 'routePillAccessible')}`
                  : ''}
              </Text>
            </Pressable>
            {routeVariants ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(locale, 'routePillToggle')}
                onPress={() =>
                  selectRouteVariant(selectedRouteVariant === 'accessible' ? 'fastest' : 'accessible')
                }
                hitSlop={8}
                style={(state: any) => [
                  styles.routePillArrow,
                  {
                    borderColor: state?.focused ? colors.focus : colors.border,
                    borderWidth: state?.focused ? 2.5 : 1.5,
                  },
                ]}
              >
                <ArrowsDownUp size={18} weight="bold" color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
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

        {/* Clicked Map Location Interactive Popup */}
        {clickedLocation ? (
          <View style={styles.floatingClickedLocationWrapper}>
            <MapLocationPopup
              location={clickedLocation}
              onSearchPlace={() => {
                const targetPos = { lat: clickedLocation.lat, lon: clickedLocation.lon };
                const targetName = clickedLocation.name;
                setPlacePos(targetPos);
                setPlaceQuery(targetName);
                setInspectedPlace({ name: targetName, lat: targetPos.lat, lon: targetPos.lon });
                setClickedLocation(null);
                setPopupExpanded(true);
                setActiveTab('place');
                handleInspectPlace(targetName, targetPos, false);
              }}
              onSetStart={() => {
                const targetPos = { lat: clickedLocation.lat, lon: clickedLocation.lon };
                const targetName = clickedLocation.name;
                setFromPos(targetPos);
                setFromQuery(targetName);
                fromPosRef.current = targetPos;
                fromQueryRef.current = targetName;
                setStatusMessage(`${t(locale, 'pointA')}: ${targetName}`);
                setClickedLocation(null);
                setTimeout(() => setStatusMessage(null), 3000);
                clearActiveRoute();
              }}
              onSetEnd={() => {
                const targetPos = { lat: clickedLocation.lat, lon: clickedLocation.lon };
                const targetName = clickedLocation.name;
                setToPos(targetPos);
                setToQuery(targetName);
                toPosRef.current = targetPos;
                toQueryRef.current = targetName;
                setStatusMessage(`${t(locale, 'pointB')}: ${targetName}`);
                setClickedLocation(null);
                setTimeout(() => setStatusMessage(null), 3000);
                clearActiveRoute();
              }}
              onClose={() => setClickedLocation(null)}
            />
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
          {popupExpanded ? (
            <CaretDown
              size={22}
              weight="bold"
              color={isHighContrast ? colors.accent : colors.muted}
            />
          ) : (
            <CaretUp
              size={22}
              weight="bold"
              color={isHighContrast ? colors.accent : colors.muted}
            />
          )}
          <View style={styles.sheetHandleHeader}>
            <View style={styles.sheetHeaderLeft}>
              {getProfileIcon(profileId, 16)}
              <Text style={[styles.sheetProfileName, { color: colors.accent, fontSize: fontSize(12.5) }]}>
                {getProfileLabel(profileId)}
              </Text>
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
            </View>

            {/* TAB CONTENT SCROLLVIEW */}
            <ScrollView
              contentContainerStyle={[
                styles.tabContentScroll,
                { paddingBottom: spacing.touch + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* TAB 1: TRASA (ROUTE PLANNING & ANALYSIS) */}
              {activeTab === 'route' ? (
                <View style={styles.formSection}>
                  {/* Engine status warning if offline */}
                  {engineStatus && !engineStatus.online ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        backgroundColor: colors.warningBg,
                        borderColor: colors.warningBorder,
                        borderWidth: 1,
                      }}
                    >
                      <Warning size={22} color={colors.warningText} weight="bold" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.warningText }}>
                          {locale === 'pl'
                            ? 'Silnik tras bez barier jest niedostępny'
                            : 'Barrier-free routing engine unavailable'}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.warningText, marginTop: 2 }}>
                          {locale === 'pl'
                            ? 'Aplikacja nie wyznacza tras zastępczych po jezdniach. Uruchom usługę GraphHopper.'
                            : 'App will not fall back to road routes. Ensure GraphHopper is running.'}
                        </Text>
                        <Pressable
                          onPress={() => {
                            checkRoutingEngineHealth().then(setEngineStatus);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Sprawdź ponownie połączenie z silnikiem"
                          style={{ marginTop: 6 }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.accent, textDecorationLine: 'underline' }}>
                            {locale === 'pl' ? 'Sprawdź ponownie połączenie' : 'Retry connection'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {/* Point A (Start) */}
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
                      clearActiveRoute();
                      if (p.position) {
                        setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                      }
                    }}
                    onClear={() => {
                      setFromQuery('');
                      setFromPos(null);
                      fromQueryRef.current = '';
                      fromPosRef.current = null;
                      clearActiveRoute();
                    }}
                    onQueryChange={(text) => {
                      setFromQuery(text);
                      fromQueryRef.current = text;
                      if (activeWalkingRoute) {
                        clearActiveRoute();
                      }
                    }}
                    placeholder={t(locale, 'fromPlaceholder')}
                    showMyLocation
                    onUseMyLocation={handleUseMyLocation}
                    onPickOnMap={() => {
                      setPickingTarget('start');
                      setPopupExpanded(false);
                      setStatusMessage(locale === 'pl' ? 'Wskaż punkt początkowy (A) na mapie' : 'Tap on map to set start point (A)');
                    }}
                    isPickingOnMap={pickingTarget === 'start'}
                  />

                  {/* Swap Points Button and Clear Route Button */}
                  <View
                    style={[
                      styles.swapBtnRow,
                      !(activeWalkingRoute || fromQuery || toQuery) && styles.swapBtnRowCentered,
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(locale, 'swapPoints')}
                      onPress={handleSwapPoints}
                      hitSlop={6}
                      style={[
                        styles.swapBtn,
                        Boolean(activeWalkingRoute || fromQuery || toQuery) && styles.swapBtnFlex,
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

                    {activeWalkingRoute || fromQuery || toQuery ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(locale, 'btnClearRoute')}
                        onPress={handleClearRoute}
                        hitSlop={6}
                        style={[
                          styles.clearRouteBtn,
                          {
                            backgroundColor: colors.blockerBg,
                            borderColor: colors.blockerBorder,
                            borderWidth: isHighContrast ? 2 : 1,
                          },
                        ]}
                      >
                        <X size={15} weight="bold" color={colors.blockerText} />
                        <Text style={[styles.clearRouteBtnText, { color: colors.blockerText, fontSize: fontSize(12) }]}>
                          {t(locale, 'btnClearRoute')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Point B (Destination) */}
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
                      clearActiveRoute();
                      if (p.position) {
                        setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                      }
                    }}
                    onClear={() => {
                      setToQuery('');
                      setToPos(null);
                      toQueryRef.current = '';
                      toPosRef.current = null;
                      clearActiveRoute();
                    }}
                    onQueryChange={(text) => {
                      setToQuery(text);
                      toQueryRef.current = text;
                      if (activeWalkingRoute) {
                        clearActiveRoute();
                      }
                    }}
                    placeholder={t(locale, 'toPlaceholder')}
                    onPickOnMap={() => {
                      setPickingTarget('end');
                      setPopupExpanded(false);
                      setStatusMessage(locale === 'pl' ? 'Wskaż cel trasy (B) na mapie' : 'Tap on map to set destination (B)');
                    }}
                    isPickingOnMap={pickingTarget === 'end'}
                  />

                  {/* Plan Route Action */}
                  <GovButton
                    title={t(locale, 'searchButton')}
                    icon={<NavigationArrow size={16} weight="bold" color={colors.accentText} />}
                    variant="primary"
                    loading={loadingRoute}
                    onPress={() => {
                      handleAnalyzeRoute();
                    }}
                  />

                  {/* Active Route Result Card (if present) */}
                  {activeRouteReport && activeWalkingRoute ? (
                    <GovCard variant="accent">
                      {/* Route Variant Selection (Shortest vs Barrier-Free) */}
                      {routeVariants ? (
                        <View style={styles.variantSection}>
                          <Text style={[styles.variantSectionTitle, { color: colors.text, fontSize: fontSize(13.5), fontWeight: '700' }]}>
                            {t(locale, 'routeVariantHeading')}
                          </Text>
                          <View style={styles.variantButtonsRow}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: selectedRouteVariant === 'accessible' }}
                              onPress={() => selectRouteVariant('accessible')}
                              style={(state: any) => [
                                styles.variantButton,
                                {
                                  backgroundColor:
                                    selectedRouteVariant === 'accessible' ? colors.accent : colors.background,
                                  borderColor:
                                    state?.focused ? colors.focus : selectedRouteVariant === 'accessible' ? colors.accent : colors.border,
                                  borderWidth: state?.focused ? 3 : selectedRouteVariant === 'accessible' ? 2 : 1,
                                },
                              ]}
                            >
                              <View style={styles.variantHeader}>
                                <ShieldCheck
                                  size={16}
                                  weight="bold"
                                  color={selectedRouteVariant === 'accessible' ? colors.accentText : colors.accent}
                                />
                                <Text
                                  style={[
                                    styles.variantTitle,
                                    {
                                      color: selectedRouteVariant === 'accessible' ? colors.accentText : colors.text,
                                      fontSize: fontSize(13),
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
                                    fontSize: fontSize(11.5),
                                  },
                                ]}
                              >
                                {(routeVariants.accessible.report.lengthMetres / 1000).toFixed(1)} km • {formatBlockerCount(routeVariants.accessible.report.findings.filter((f) => f.severity === 'blocker').length, locale)}
                              </Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: selectedRouteVariant === 'fastest' }}
                              onPress={() => selectRouteVariant('fastest')}
                              style={(state: any) => [
                                styles.variantButton,
                                {
                                  backgroundColor:
                                    selectedRouteVariant === 'fastest' ? colors.accent : colors.background,
                                  borderColor:
                                    state?.focused ? colors.focus : selectedRouteVariant === 'fastest' ? colors.accent : colors.border,
                                  borderWidth: state?.focused ? 3 : selectedRouteVariant === 'fastest' ? 2 : 1,
                                },
                              ]}
                            >
                              <View style={styles.variantHeader}>
                                <Lightning
                                  size={16}
                                  weight="bold"
                                  color={selectedRouteVariant === 'fastest' ? colors.accentText : colors.warningText}
                                />
                                <Text
                                  style={[
                                    styles.variantTitle,
                                    {
                                      color: selectedRouteVariant === 'fastest' ? colors.accentText : colors.text,
                                      fontSize: fontSize(13),
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
                                    fontSize: fontSize(11.5),
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
                                },
                              ]}
                            >
                              <Warning size={18} weight="bold" color={colors.warningText} />
                              <Text style={[styles.variantWarningText, { color: colors.warningText, fontSize: fontSize(12.5) }]}>
                                {t(locale, 'routeVariantFastestWarning')}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.resultTitle, { color: colors.text, fontSize: fontSize(16) }]}>
                          {t(locale, 'summaryCardTitle')}:
                        </Text>
                        <Text style={[styles.metricVal, { color: colors.accent, fontSize: fontSize(15) }]}>
                          {(activeRouteReport.lengthMetres / 1000).toFixed(1)} km • {Math.round((activeWalkingRoute.durationSeconds || 60) / 60)} min
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
                          onPress={() => {
                            router.push({
                              pathname: '/route',
                              params: {
                                fromName: fromQuery,
                                fromLat: String(fromPos?.lat ?? activeWalkingRoute.coordinates[0]?.[1] ?? 50.0619),
                                fromLon: String(fromPos?.lon ?? activeWalkingRoute.coordinates[0]?.[0] ?? 19.9373),
                                toName: toQuery,
                                toLat: String(toPos?.lat ?? activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]?.[1] ?? 50.0619),
                                toLon: String(toPos?.lon ?? activeWalkingRoute.coordinates[activeWalkingRoute.coordinates.length - 1]?.[0] ?? 19.9373),
                                profile: profileId,
                                variant: selectedRouteVariant,
                                ...(activeRouteIsSample ? { isSample: '1' } : {}),
                              },
                            });
                          }}
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
                        title="Dworzec → Sukiennice"
                        icon={<Path size={14} weight="bold" color={colors.accent} />}
                        onPress={() => loadDemoRoute(1)}
                        style={styles.halfBtn}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              {/* TAB 2: OBIEKT (PLACE INSPECTION & EXTENDED PUBLIC CATALOG) */}
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
                  />

                  <GovButton
                    title={t(locale, 'searchPlaceButton')}
                    icon={<Buildings size={16} weight="bold" color={colors.accentText} />}
                    variant="primary"
                    loading={loadingPlace}
                    onPress={() => handleInspectPlace(placeQuery, placePos, false)}
                  />

                  {/* Active Inspected Place Card */}
                  {activePlaceReport ? (
                    <GovCard variant={activePlaceReport.allFacts.length === 0 ? 'warning' : 'accent'}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.resultTitle, { color: colors.text, fontSize: fontSize(16), flex: 1 }]}>
                          {activePlaceReport.placeName}
                        </Text>
                      </View>
                      {activePlaceReport.allFacts.length === 0 ? (
                        <View style={{ marginVertical: 6, gap: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Question size={18} color={colors.warningText} weight="bold" />
                            <Text style={{ fontWeight: '800', color: colors.warningText, fontSize: fontSize(14) }}>
                              {locale === 'pl'
                                ? 'Brak informacji w bazie danych'
                                : locale === 'uk'
                                  ? 'Немає інформації в базі даних'
                                  : 'No information in database'}
                            </Text>
                          </View>
                          <Text style={[styles.resultSub, { color: colors.text, fontSize: fontSize(12.5), lineHeight: 18 }]}>
                            {locale === 'pl'
                              ? 'Dla tej lokalizacji brak jest zgromadzonych danych o dostępności architektonicznej w miejskiej bazie danych ani w OpenStreetMap. Zgodnie ze standardem miejskim brak danych jest zawsze prezentowany jako brak informacji, nigdy jako brak barier.'
                              : locale === 'uk'
                                ? 'Для цієї локації відсутні дані про доступність у міській базі даних та OSM.'
                                : 'No architectural accessibility data found for this location in municipal DB or OSM. Lack of data is always presented as lack of information, never as absence of barriers.'}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.resultSub, { color: colors.muted, fontSize: fontSize(13) }]}>
                          {activePlaceReport.isConfidentMatch
                            ? (locale === 'pl'
                              ? 'Miejski obiekt zweryfikowany pod kątem dostępności'
                              : locale === 'uk'
                                ? 'Об’єкт перевірено на доступність'
                                : 'Municipal place verified for accessibility')
                            : (locale === 'pl'
                              ? 'Brak szczegółowych danych o dostępności'
                              : locale === 'uk'
                                ? 'Немає детальних даних про dostępність'
                                : 'No detailed accessibility data')}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <GovButton
                          title="Opis"
                          icon={<ArrowRight size={14} weight="bold" color={colors.accent} />}
                          variant="outline"
                          onPress={() => {
                            router.push({
                              pathname: '/place',
                              params: {
                                placeName: activePlaceReport.placeName,
                                placeLat: String(placePos.lat),
                                placeLon: String(placePos.lon),
                              },
                            });
                          }}
                          style={{ flex: 1 }}
                        />
                        <GovButton
                          title="Nawiguj"
                          icon={<NavigationArrow size={14} weight="bold" color={colors.accentText} />}
                          variant="primary"
                          onPress={() => {
                            const destName = activePlaceReport.placeName;
                            const destPos = placePos;
                            setToQuery(destName);
                            setToPos(destPos);
                            toQueryRef.current = destName;
                            toPosRef.current = destPos;
                            setActiveTab('route');
                            setStatusMessage(`Ustawiono cel trasy: ${destName}`);
                            setTimeout(() => setStatusMessage(null), 3000);
                            clearActiveRoute();
                          }}
                          style={{ flex: 1 }}
                        />
                      </View>

                      {/* Place Accessibility Community Validations with Photos */}
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontWeight: '700', fontSize: fontSize(13.5), color: colors.text, flex: 1 }}>
                            Walidacje dostępności miejsca ({placeComments.length})
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setShowPlaceValidationForm(!showPlaceValidationForm)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              minHeight: 38,
                              borderRadius: 8,
                              backgroundColor: showPlaceValidationForm ? colors.border : colors.accent,
                            }}
                          >
                            <Camera size={16} weight="bold" color={showPlaceValidationForm ? colors.text : colors.accentText} />
                            <Text style={{ fontSize: fontSize(13), color: showPlaceValidationForm ? colors.text : colors.accentText, fontWeight: '700' }}>
                              {showPlaceValidationForm ? 'Anuluj' : 'Dodaj zdjęcie'}
                            </Text>
                          </Pressable>
                        </View>

                        {showPlaceValidationForm ? (
                          <View
                            style={{
                              marginTop: 8,
                              padding: 10,
                              borderRadius: 8,
                              backgroundColor: colors.background,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Text style={{ fontSize: fontSize(12.5), fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                              Oceń dostępność i dodaj zdjęcie dla mieszkańców:
                            </Text>

                            <View style={styles.actionChoiceRow}>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => setPlaceCommentSentiment('positive')}
                                style={[
                                  styles.actionChoiceBtn,
                                  {
                                    backgroundColor: placeCommentSentiment === 'positive' ? colors.okBg : colors.surface,
                                    borderColor: placeCommentSentiment === 'positive' ? colors.okBorder : colors.border,
                                  },
                                ]}
                              >
                                <ThumbsUp size={14} weight="bold" color={placeCommentSentiment === 'positive' ? colors.okText : colors.text} />
                                <Text style={[styles.actionChoiceText, { color: placeCommentSentiment === 'positive' ? colors.okText : colors.text }]}>
                                  Dostępne
                                </Text>
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                onPress={() => setPlaceCommentSentiment('negative')}
                                style={[
                                  styles.actionChoiceBtn,
                                  {
                                    backgroundColor: placeCommentSentiment === 'negative' ? colors.blockerBg : colors.surface,
                                    borderColor: placeCommentSentiment === 'negative' ? colors.blockerBorder : colors.border,
                                  },
                                ]}
                              >
                                <ThumbsDown size={14} weight="bold" color={placeCommentSentiment === 'negative' ? colors.blockerText : colors.text} />
                                <Text style={[styles.actionChoiceText, { color: placeCommentSentiment === 'negative' ? colors.blockerText : colors.text }]}>
                                  Bariera
                                </Text>
                              </Pressable>
                            </View>

                            {/* Category selector */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
                              {[
                                { id: 'entrance' as const, label: 'Wejście / rampa' },
                                { id: 'inside' as const, label: 'Wnętrze / winda' },
                                { id: 'toilet' as const, label: 'Toaleta PRM' },
                                { id: 'surroundings' as const, label: 'Otoczenie' },
                                { id: 'general' as const, label: 'Ogólne' },
                              ].map((c) => (
                                <Pressable
                                  key={c.id}
                                  accessibilityRole="button"
                                  onPress={() => setPlaceCommentCategory(c.id)}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    backgroundColor: placeCommentCategory === c.id ? colors.accent : colors.surface,
                                    borderWidth: 1,
                                    borderColor: placeCommentCategory === c.id ? colors.accent : colors.border,
                                  }}
                                >
                                  <Text style={{ fontSize: fontSize(11.5), color: placeCommentCategory === c.id ? colors.accentText : colors.text, fontWeight: '600' }}>
                                    {c.label}
                                  </Text>
                                </Pressable>
                              ))}
                            </ScrollView>

                            <TextInput
                              value={placeCommentText}
                              onChangeText={setPlaceCommentText}
                              placeholder="Opisz stan podjazdu, rampy, toalety PRM..."
                              placeholderTextColor={colors.muted}
                              multiline
                              numberOfLines={2}
                              style={[
                                styles.input,
                                {
                                  backgroundColor: colors.surface,
                                  color: colors.text,
                                  borderColor: colors.border,
                                  borderWidth: 1,
                                  fontSize: fontSize(13),
                                  minHeight: 50,
                                },
                              ]}
                            />

                            {/* Photo Picker */}
                            <View style={styles.photoBtnRow}>
                              <Pressable
                                accessibilityRole="button"
                                onPress={async () => {
                                  const photo = await pickPhotoAsync('camera');
                                  if (photo) setPlaceCommentPhoto(photo);
                                }}
                                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              >
                                <Camera size={14} weight="bold" color={colors.accent} />
                                <Text style={[styles.photoBtnText, { color: colors.text }]}>Aparat</Text>
                              </Pressable>

                              <Pressable
                                accessibilityRole="button"
                                onPress={async () => {
                                  const photo = await pickPhotoAsync('library');
                                  if (photo) setPlaceCommentPhoto(photo);
                                }}
                                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              >
                                <ImageIcon size={14} weight="bold" color={colors.accent} />
                                <Text style={[styles.photoBtnText, { color: colors.text }]}>Galeria</Text>
                              </Pressable>
                            </View>

                            {placeCommentPhoto ? (
                              <View style={[styles.photoPreviewContainer, { borderColor: colors.border }]}>
                                <Image source={{ uri: placeCommentPhoto }} style={styles.photoPreviewImage} resizeMode="cover" />
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Usuń zdjęcie"
                                  onPress={() => setPlaceCommentPhoto(null)}
                                  style={styles.photoRemoveBtn}
                                >
                                  <Trash size={14} color="#FFF" weight="bold" />
                                </Pressable>
                              </View>
                            ) : null}

                            <GovButton
                              title={placeCommentSubmitting ? 'Wysyłanie na serwer...' : 'Opublikuj walidację ze zdjęciem'}
                              variant="primary"
                              loading={placeCommentSubmitting}
                              onPress={() => {
                                const targetPlaceId = activePlaceReport.placeName
                                  ? `place-${activePlaceReport.placeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                                  : 'place-sukiennice';
                                handleAddPlaceValidation(targetPlaceId);
                              }}
                              style={{ marginTop: 8 }}
                            />
                          </View>
                        ) : null}

                        {/* List of comments and photos */}
                        {placeComments.length > 0 ? (
                          <View style={{ marginTop: 8, gap: 6 }}>
                            {placeComments.map((pc) => (
                              <View
                                key={pc.id}
                                style={[
                                  styles.validationItem,
                                  {
                                    backgroundColor: colors.surface,
                                    borderColor: pc.sentiment === 'positive' ? colors.okBorder : colors.blockerBorder,
                                  },
                                ]}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={{ fontSize: fontSize(12), fontWeight: '700', color: pc.sentiment === 'positive' ? colors.okText : colors.blockerText }}>
                                    {pc.sentiment === 'positive' ? '✓ Dostępne' : '✗ Bariera'}{pc.category ? ` • ${pc.category}` : ''}
                                  </Text>
                                  <Text style={{ fontSize: fontSize(11), color: colors.muted }}>
                                    {pc.createdAt.slice(0, 10)}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: fontSize(13), color: colors.text }}>{pc.comment}</Text>
                                {pc.photoUrl ? (
                                  <Image source={{ uri: pc.photoUrl }} style={styles.validationThumb} resizeMode="cover" />
                                ) : null}
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </GovCard>
                  ) : null}

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

                  {/* Detailed Thresholds */}
                  <GovCard variant="accent">
                    <Text style={[styles.customTitle, { color: colors.text, fontSize: fontSize(14.5) }]}>
                      {t(locale, 'customThresholdsTitle')} ({profileId === 'wheelchair' ? t(locale, 'wheelchair') : profileId === 'custom' ? t(locale, 'custom') : profileId}):
                    </Text>

                    <View style={styles.thresholdRow}>
                      <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(13.5) }]}>
                        {t(locale, 'maxKerb')}
                      </Text>
                      <View style={styles.presetChipsRow}>
                        {KERB_LEVELS.map((level) => {
                          const selected = activeThresholds.maxKerbMillimetres === level.mm;
                          return (
                            <Pressable
                              key={level.mm}
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                              onPress={() => {
                                if (profileId === 'wheelchair' && level.mm === 30) return;
                                updateActiveThresholds({ maxKerbMillimetres: level.mm });
                              }}
                              style={[
                                styles.roadChip,
                                {
                                  backgroundColor: selected ? colors.accent : colors.background,
                                  borderColor: selected ? colors.accent : colors.border,
                                  borderWidth: selected ? 2 : 1,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: selected ? colors.accentText : colors.text,
                                  fontSize: fontSize(12.5),
                                  fontWeight: '700',
                                }}
                              >
                                {t(locale, level.labelKey)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.thresholdRow}>
                      <Text style={[styles.paramLabel, { color: colors.text, fontSize: fontSize(13.5) }]}>
                        {t(locale, 'stepsTreatment')}{' '}
                        <Text
                          style={{
                            fontWeight: '800',
                            color:
                              (activeThresholds.stepsTreatment ??
                                (activeThresholds.stepsAreBlocker ? 'blocker' : 'warning')) === 'blocker'
                                ? colors.blockerText
                                : (activeThresholds.stepsTreatment ??
                                  (activeThresholds.stepsAreBlocker ? 'blocker' : 'warning')) === 'warning'
                                  ? colors.warningText
                                  : colors.okText,
                          }}
                        >
                          {(activeThresholds.stepsTreatment ??
                            (activeThresholds.stepsAreBlocker ? 'blocker' : 'warning')) === 'blocker'
                            ? t(locale, 'blockedStatusBlocked')
                            : (activeThresholds.stepsTreatment ??
                              (activeThresholds.stepsAreBlocker ? 'blocker' : 'warning')) === 'warning'
                              ? t(locale, 'severityWarning')
                              : t(locale, 'stepsAllowed')}
                        </Text>
                      </Text>
                      <View style={styles.presetChipsRow}>
                        {[
                          {
                            id: 'blocker' as const,
                            label: t(locale, 'blockedStatusBlocked'),
                            bg: colors.blockerBg,
                            border: colors.blockerBorder,
                            text: colors.blockerText,
                          },
                          {
                            id: 'warning' as const,
                            label: t(locale, 'severityWarning'),
                            bg: colors.warningBg,
                            border: colors.warningBorder,
                            text: colors.warningText,
                          },
                          {
                            id: 'allowed' as const,
                            label: t(locale, 'stepsAllowed'),
                            bg: colors.okBg,
                            border: colors.okBorder,
                            text: colors.okText,
                          },
                        ].map((opt) => {
                          const currentTreatment =
                            activeThresholds.stepsTreatment ??
                            (activeThresholds.stepsAreBlocker ? 'blocker' : 'warning');
                          const isSelected = currentTreatment === opt.id;
                          return (
                            <Pressable
                              key={opt.id}
                              accessibilityRole="button"
                              accessibilityLabel={`${t(locale, 'stepsTreatment')} ${opt.label}`}
                              onPress={() =>
                                updateActiveThresholds({
                                  stepsTreatment: opt.id,
                                  stepsAreBlocker: opt.id === 'blocker',
                                })
                              }
                              style={[
                                styles.presetChip,
                                {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: isSelected ? opt.bg : colors.background,
                                  borderColor: isSelected ? opt.border : colors.border,
                                  borderWidth: isSelected ? 2 : 1,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.presetChipText,
                                  {
                                    color: isSelected ? opt.text : colors.text,
                                    fontSize: fontSize(12),
                                    fontWeight: isSelected ? '800' : '600',
                                  },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </GovCard>
                </View>
              ) : null}

            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={reportPopupOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setReportPopupOpen(false)}
      >
        <View style={styles.reportModalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'cancel')}
            onPress={() => setReportPopupOpen(false)}
            style={styles.reportModalDismiss}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.reportModalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.reportModalHeader}>
              <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(17) }]}>
                {t(locale, 'reportPopupTitle')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(locale, 'cancel')}
                onPress={() => setReportPopupOpen(false)}
                style={[styles.reportCloseBtn, { borderColor: colors.border }]}
              >
                <X size={18} weight="bold" color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 28, gap: 10 }}
            >
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: fontSize(13), fontWeight: '700', color: colors.text }}>
                  {locale === 'pl' ? 'Twój adres e-mail (wymagany):' : 'Your email address (required):'}
                </Text>
                <TextInput
                  value={reportEmail}
                  onChangeText={setReportEmail}
                  placeholder={locale === 'pl' ? 'np. jan.kowalski@example.com' : 'e.g. john@example.com'}
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      fontSize: fontSize(14),
                      borderWidth: isHighContrast ? 2 : 1,
                      minHeight: 44,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    },
                  ]}
                />
              </View>

              <LocationPicker
                label={t(locale, 'reportLocationLabel')}
                point={{ name: reportQuery, position: reportPos ?? EMPTY_POINT }}
                onChangePoint={(p) => {
                  setReportQuery(p.name);
                  setReportPos(p.position ?? null);
                  if (p.position) {
                    setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                  }
                }}
                placeholder={t(locale, 'searchPromptOsm')}
                showMyLocation
                onUseMyLocation={() => {
                  if (!userLocation) {
                    fetchUserLocation().then((loc) => {
                      if (!loc) return;
                      const coordText = `${loc.lat.toFixed(6)}, ${loc.lon.toFixed(6)}`;
                      setReportPos({ lat: loc.lat, lon: loc.lon });
                      setReportQuery(coordText);
                    });
                    return;
                  }
                  const coordText = `${userLocation.lat.toFixed(6)}, ${userLocation.lon.toFixed(6)}`;
                  setReportPos({ lat: userLocation.lat, lon: userLocation.lon });
                  setReportQuery(coordText);
                }}
                onPickOnMap={() => {
                  setPickingTarget('report');
                  setReportPopupOpen(false);
                  setPopupExpanded(false);
                }}
                isPickingOnMap={pickingTarget === 'report'}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { id: 'obstacle' as const, label: 'Krawężnik / schody' },
                  { id: 'hole' as const, label: 'Wyrwa / dziura' },
                  { id: 'surface' as const, label: 'Bruk / nawierzchnia' },
                  { id: 'flood' as const, label: 'Zalanie / kałuża' },
                  { id: 'other' as const, label: 'Inna przeszkoda' },
                ].map((cat) => (
                  <Pressable
                    key={cat.id}
                    accessibilityRole="button"
                    onPress={() => setNewReportCategory(cat.id)}
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: newReportCategory === cat.id ? colors.accent : colors.background,
                      borderWidth: 1,
                      borderColor: newReportCategory === cat.id ? colors.accent : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize(11.5),
                        color: newReportCategory === cat.id ? colors.accentText : colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

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

              <View style={styles.photoBtnRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const photo = await pickPhotoAsync('camera');
                    if (photo) setNewReportPhoto(photo);
                  }}
                  style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Camera size={14} weight="bold" color={colors.accent} />
                  <Text style={[styles.photoBtnText, { color: colors.text }]}>Zrób zdjęcie</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const photo = await pickPhotoAsync('library');
                    if (photo) setNewReportPhoto(photo);
                  }}
                  style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <ImageIcon size={14} weight="bold" color={colors.accent} />
                  <Text style={[styles.photoBtnText, { color: colors.text }]}>Wybierz z galerii</Text>
                </Pressable>
              </View>

              {newReportPhoto ? (
                <View style={[styles.photoPreviewContainer, { borderColor: colors.border }]}>
                  <Image source={{ uri: newReportPhoto }} style={styles.photoPreviewImage} resizeMode="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Usuń wybrane zdjęcie"
                    onPress={() => setNewReportPhoto(null)}
                    style={styles.photoRemoveBtn}
                  >
                    <Trash size={14} color="#FFF" weight="bold" />
                  </Pressable>
                </View>
              ) : null}

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
                title={
                  isUploadingPhoto
                    ? (locale === 'pl' ? 'Przesyłanie zdjęcia...' : locale === 'uk' ? 'Завантаження фото...' : 'Uploading photo...')
                    : isSubmittingReport
                      ? (locale === 'pl' ? 'Wysyłanie na serwer...' : locale === 'uk' ? 'Надсилання на сервер...' : 'Submitting to server...')
                      : t(locale, 'reportSubmit')
                }
                icon={<Check size={16} weight="bold" color={colors.accentText} />}
                variant="primary"
                loading={isUploadingPhoto || isSubmittingReport}
                onPress={handleSubmitServerReport}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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
  floatingBarrierControl: {
    position: 'absolute',
    top: 64,
    left: 14,
    right: 70,
    zIndex: 20,
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
    paddingVertical: 4,
    minHeight: 48,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 15,
  },
  floatingBarrierControlWrapper: {
    position: 'absolute',
    left: 14,
    right: 70,
    zIndex: 18,
  },
  floatingClickedLocationWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 26,
  },
  routePillText: {
    flex: 1,
    fontWeight: '700',
  },
  routePillMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  routePillArrow: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    gap: 8,
  },
  smallStepBtn: {
    flex: 1,
  },
  kerbValue: {
    minWidth: 76,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantSection: {
    gap: 8,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  variantSectionTitle: {
    letterSpacing: 0.2,
  },
  variantButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  variantButton: {
    flex: 1,
    padding: 10,
    minHeight: 48,
    borderRadius: 8,
    gap: 3,
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
    marginTop: 4,
  },
  variantWarningText: {
    flex: 1,
    lineHeight: 18,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  presetChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  presetChipText: {
    letterSpacing: 0.2,
  },
  placeCategoryScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  placeCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  placeCatChipText: {
    fontWeight: '700',
  },
  placeCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  placeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  placeCardTitle: {
    fontWeight: '800',
    flex: 1,
  },
  placeCardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  placeCardBadgeText: {
    fontWeight: '700',
  },
  placeCardAddress: {
    fontWeight: '500',
    lineHeight: 18,
  },
  placeCardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  placeCardTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  placeCardTagText: {
    fontWeight: '600',
  },
  placeCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  swapBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    minHeight: 38,
    gap: 8,
    flexWrap: 'wrap',
  },
  swapBtnRowCentered: {
    justifyContent: 'center',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 36,
  },
  swapBtnFlex: {
    flex: 1,
    minWidth: 120,
  },
  swapBtnText: {
    fontWeight: '700',
  },
  clearRouteBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 36,
  },
  clearRouteBtnText: {
    fontWeight: '700',
  },
  photoPreviewContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photoPreviewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  reportModalDismiss: {
    flex: 1,
  },
  reportModalSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoBtnText: {
    fontWeight: '700',
    fontSize: 12.5,
  },
  actionChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  actionChoiceText: {
    fontWeight: '700',
    fontSize: 12.5,
  },
  validationItem: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
    gap: 4,
  },
  validationThumb: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginTop: 4,
  },
});

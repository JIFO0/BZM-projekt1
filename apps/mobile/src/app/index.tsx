import {
  credibilityFromReports,
  DEMO_SNAPSHOT,
  type LonLat,
  type ProfileId,
} from '@krakow-bez-barier/core';
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
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Warning,
  Wheelchair,
  X,
  IdentificationCard,
} from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { BarrierViewControl } from '@/components/BarrierViewControl';
import { CredibilityNote } from '@/components/CredibilityNote';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { KrakowHeader } from '@/components/KrakowHeader';
import { LocationPicker } from '@/components/LocationPicker';
import { MapLocationPopup } from '@/components/MapLocationPopup';
import { MapView } from '@/components/MapView';
import { t } from '@/i18n/strings';
import {
  DEFAULT_PRESET_PLACES,
  inspectPlace,
  planAndAnalyzeRoute,
  reverseGeocodeLocation,
  type RouteVariantId,
  type ServerRouteHazard,
  type ServerPlaceComment,
  fetchServerHazards,
  fetchRandomServerHazard,
  createServerHazard,
  verifyServerHazard,
  uploadPhotoToServer,
  fetchPlaceServerComments,
  addPlaceServerComment,
} from '@/services/api';
import { getAllCityBarriers } from '@/services/barriers';
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
    } catch {}
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
    } catch {}
  }

  return { fromName, fromLat, fromLon, toName, toLat, toLon, demoRoute, variant };
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
    localReports,
    addLocalReport,
    userLocation,
    isLocating,
    fetchUserLocation,
    colors,
    fontSize,
    isHighContrast,
    krakowCardUser,
    setKrakowCardModalVisible,
    barrierViewMode,
    setBarrierViewMode,
  } = useSession();

  // All barriers across Kraków computed with active thresholds
  const allCityBarriers = useMemo(() => {
    return getAllCityBarriers(activeThresholds);
  }, [activeThresholds]);

  // Barriers on the active route
  const routeBarriers = useMemo(() => {
    return activeRouteReport?.findings || [];
  }, [activeRouteReport]);

  // Displayed findings depending on barrier view mode: none | route | all
  const displayedFindings = useMemo(() => {
    switch (barrierViewMode) {
      case 'none':
        return [];
      case 'route':
        return routeBarriers;
      case 'all':
      default:
        return allCityBarriers;
    }
  }, [barrierViewMode, routeBarriers, allCityBarriers]);

  // Map state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 50.0619,
    lon: 19.9373,
  });

  // Handle pending destination set from place screen or external sources
  useEffect(() => {
    if (pendingDestination) {
      setToQuery(pendingDestination.name);
      setToPos(pendingDestination.position);
      setActiveTab('route');
      setPopupExpanded(true);
      setMapCenter({ lat: pendingDestination.position.lat, lon: pendingDestination.position.lon });
      setStatusMessage(`Ustawiono cel trasy: ${pendingDestination.name}`);
      setPendingDestination(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }, [pendingDestination, setPendingDestination]);

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

  // Server Hazards and Photo Validation state
  const [serverHazards, setServerHazards] = useState<ServerRouteHazard[]>([]);
  const [randomHazard, setRandomHazard] = useState<ServerRouteHazard | null>(null);
  const [randomHazardLoading, setRandomHazardLoading] = useState(false);
  const [randomHazardVoteAction, setRandomHazardVoteAction] = useState<'still_here' | 'fixed'>('still_here');
  const [randomHazardPhoto, setRandomHazardPhoto] = useState<string | null>(null);
  const [randomHazardComment, setRandomHazardComment] = useState('');
  const [randomHazardSubmitting, setRandomHazardSubmitting] = useState(false);

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

  const loadRandomHazard = async () => {
    setRandomHazardLoading(true);
    try {
      const hazard = await fetchRandomServerHazard();
      if (hazard) {
        setRandomHazard(hazard);
      } else {
        const list = await fetchServerHazards();
        if (list.length > 0) {
          const pick = list[Math.floor(Math.random() * list.length)];
          setRandomHazard(pick || null);
        } else {
          setRandomHazard({
            id: 'hazard-sample-rynek',
            description: 'Wysoki krawężnik (14 cm) bez zjazdu na przejściu dla pieszych przy Rynku Głównym',
            category: 'obstacle',
            status: 'reported',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stillHereCount: 4,
            fixedCount: 0,
            photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=60',
            validations: [],
          });
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setRandomHazardLoading(false);
    }
  };

  const loadServerHazards = async () => {
    try {
      const list = await fetchServerHazards();
      setServerHazards(list);
    } catch {
      // Non-fatal
    }
  };

  const loadPlaceComments = async (placeId: string) => {
    try {
      const comments = await fetchPlaceServerComments(placeId);
      setPlaceComments(comments);
    } catch {
      // Non-fatal
    }
  };

  // Interactive map picking target
  const [pickingTarget, setPickingTarget] = useState<'start' | 'end' | 'place' | null>(null);

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
    let name = `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`;

    if (pickingTarget) {
      setClickedLocation(null);
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
        fromName: fromQuery,
        fromLat: String(fromPos.lat),
        fromLon: String(fromPos.lon),
        toName: toQuery,
        toLat: String(toPos.lat),
        toLon: String(toPos.lon),
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
      Alert.alert(t(locale, 'routeErrorTitle'), err.message || t(locale, 'routeErrorMsg'));
    } finally {
      setLoadingRoute(false);
    }
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
        .catch(() => {})
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
    setLoadingPlace(true);
    setStatusMessage(`Pobieranie danych dla: ${p.name}`);
    try {
      const result = await inspectPlace(p.name, p.position, debugState);
      setActivePlaceReport(result.report);
      setPopupExpanded(true);
      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
    } catch (err: any) {
      Alert.alert('Błąd sprawdzania obiektu', err.message || 'Nie udało się pobrać danych.');
    } finally {
      setLoadingPlace(false);
      setStatusMessage(null);
    }
  };

  const handleSetPlaceAsDestination = (p: (typeof DEFAULT_PRESET_PLACES)[number]) => {
    setToQuery(p.name);
    setToPos(p.position);
    setActiveTab('route');
    setStatusMessage(`Ustawiono cel trasy: ${p.name}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Clear Active Route
  const handleClearRoute = () => {
    setActiveWalkingRoute(null);
    setActiveRouteReport(null);
    setActiveRouteFacts([]);
    setRouteVariants(null);
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

  // Submit hazard report (local + server with photo)
  const handleSubmitLocalReport = async () => {
    if (!reportDesc.trim()) {
      Alert.alert(t(locale, 'warningTitle'), t(locale, 'reportDescRequired'));
      return;
    }

    let uploadedUrl: string | undefined = undefined;
    if (newReportPhoto) {
      setIsUploadingPhoto(true);
      try {
        uploadedUrl = await uploadPhotoToServer(newReportPhoto, `hazard-${Date.now()}.jpg`);
      } catch {
        uploadedUrl = newReportPhoto;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    try {
      const email = krakowCardUser?.email || 'mieszkaniec@krakow.pl';
      await createServerHazard({
        description: reportDesc.trim(),
        category: newReportCategory,
        email,
        photoUrl: uploadedUrl,
        position: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : { lat: 50.0619, lon: 19.9373 },
      });
      loadServerHazards();
    } catch {
      // Local fallback
    }

    addLocalReport(reportDesc.trim(), {
      photoUrl: uploadedUrl,
      category: newReportCategory,
      position: userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : undefined,
    });

    setReportDesc('');
    setNewReportPhoto(null);
    setReportSuccess(true);
    setStatusMessage('Zgłoszenie ze zdjęciem zostało zapisane i jest widoczne dla wszystkich!');
    setTimeout(() => {
      setReportSuccess(false);
      setStatusMessage(null);
    }, 4000);
  };

  // Submit Random Hazard Validation with Photo
  const handleValidateRandomHazard = async () => {
    if (!randomHazard) return;
    setRandomHazardSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (randomHazardPhoto) {
        setIsUploadingPhoto(true);
        try {
          uploadedUrl = await uploadPhotoToServer(randomHazardPhoto, `val-${randomHazard.id}.jpg`);
        } catch {
          uploadedUrl = randomHazardPhoto;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      const email = krakowCardUser?.email || 'mieszkaniec@krakow.pl';
      const updated = await verifyServerHazard(randomHazard.id, {
        action: randomHazardVoteAction,
        email,
        photoUrl: uploadedUrl,
        comment: randomHazardComment.trim() || undefined,
      });

      setRandomHazard((prev) =>
        prev
          ? {
              ...prev,
              stillHereCount: updated.stillHereCount ?? prev.stillHereCount,
              fixedCount: updated.fixedCount ?? prev.fixedCount,
              photoUrl: updated.photoUrl || uploadedUrl || prev.photoUrl,
              validations: updated.validations || [
                ...(prev.validations || []),
                {
                  id: `val-${Date.now()}`,
                  voterKey: email,
                  action: randomHazardVoteAction,
                  photoUrl: uploadedUrl,
                  comment: randomHazardComment.trim() || undefined,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : null
      );

      setRandomHazardPhoto(null);
      setRandomHazardComment('');
      setStatusMessage('Walidacja ze zdjęciem została wysłana na serwer i jest widoczna dla wszystkich!');
      setTimeout(() => setStatusMessage(null), 4000);
      loadServerHazards();
    } catch (err: any) {
      Alert.alert('Błąd walidacji', err.message || 'Nie udało się zapisać walidacji.');
    } finally {
      setRandomHazardSubmitting(false);
    }
  };

  // Add Place Accessibility Validation with Photo
  const handleAddPlaceValidation = async (targetPlaceId: string) => {
    if (!placeCommentText.trim()) {
      Alert.alert('Wpisz opinię', 'Podaj opis dostępności tego obiektu.');
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

      const email = krakowCardUser?.email || 'mieszkaniec@krakow.pl';
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
      setStatusMessage('Opinia i zdjęcie dostępności obiektu zostały opublikowane!');
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
    if (activeTab === 'report') {
      loadServerHazards();
      if (!randomHazard) {
        loadRandomHazard();
      }
    } else if (activeTab === 'place') {
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

          {/* Report Event / Hazard Floating Button on the Right */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'tabReport')}
            onPress={() => {
              setActiveTab('report');
              setPopupExpanded(true);
            }}
            style={[
              styles.floatingBtn,
              {
                backgroundColor:
                  activeTab === 'report' && popupExpanded
                    ? colors.warningBg || colors.accent
                    : colors.surface,
                borderColor:
                  activeTab === 'report' && popupExpanded
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
                activeTab === 'report' && popupExpanded
                  ? colors.warningText || colors.accentText
                  : '#D97706'
              }
            />
          </Pressable>
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
              {(activeRouteReport.lengthMetres / 1000).toFixed(1)} km • {Math.round((activeWalkingRoute.durationSeconds || 120) / 60)} min •{' '}
              {activeRouteReport.findings.filter((f) => f.severity === 'blocker').length} {t(locale, 'severityBlocker').toLowerCase()}
            </Text>
            <CaretUp size={16} weight="bold" color={colors.accent} />
          </Pressable>
        ) : null}

        {/* Floating Barrier View Mode Selector (Bez barier | Na trasie | Wszystkie) */}
        {activeWalkingRoute ? (
          <View
            style={[
              styles.floatingBarrierControlWrapper,
              { top: activeRouteReport ? 62 : 14 },
            ]}
          >
            <BarrierViewControl
              mode={barrierViewMode}
              onChangeMode={(newMode) => {
                if (newMode === 'route' && !activeWalkingRoute) {
                  setStatusMessage(t(locale, 'noActiveRouteForBarriers'));
                  setTimeout(() => setStatusMessage(null), 3500);
                }
                setBarrierViewMode(newMode);
              }}
              routeBarriersCount={routeBarriers.length}
              allBarriersCount={allCityBarriers.length}
              hasActiveRoute={Boolean(activeWalkingRoute)}
            />
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
                setStatusMessage(`${t(locale, 'pointA')}: ${targetName}`);
                setClickedLocation(null);
                setTimeout(() => setStatusMessage(null), 3000);
              }}
              onSetEnd={() => {
                const targetPos = { lat: clickedLocation.lat, lon: clickedLocation.lon };
                const targetName = clickedLocation.name;
                setToPos(targetPos);
                setToQuery(targetName);
                setStatusMessage(`${t(locale, 'pointB')}: ${targetName}`);
                setClickedLocation(null);
                setTimeout(() => setStatusMessage(null), 3000);
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
            <View style={styles.sheetToggleBtn}>
              {!popupExpanded ? (
                <Text style={[styles.toggleText, { color: colors.muted, fontSize: fontSize(12) }]}>
                  {t(locale, 'expandMenu')}
                </Text>
              ) : null}
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
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* TAB 1: TRASA (ROUTE PLANNING & ANALYSIS) */}
              {activeTab === 'route' ? (
                <View style={styles.formSection}>
                  {/* Point A (Start) */}
                  <LocationPicker
                    label={t(locale, 'from')}
                    badge="A"
                    badgeColor="#22C55E"
                    point={{ name: fromQuery, position: fromPos }}
                    onChangePoint={(p) => {
                      setFromQuery(p.name);
                      setFromPos(p.position);
                      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                    }}
                    placeholder={t(locale, 'fromPlaceholder')}
                    showMyLocation
                    onUseMyLocation={handleUseMyLocation}
                  />

                  {/* Swap Points Button (Icon centered between destinations) and Red Clear Route Button */}
                  <View style={styles.swapBtnRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(locale, 'swapPoints')}
                      onPress={handleSwapPoints}
                      style={[
                        styles.swapIconBtn,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          borderWidth: isHighContrast ? 2 : 1,
                        },
                      ]}
                    >
                      <ArrowsDownUp size={18} weight="bold" color={colors.accent} />
                    </Pressable>

                    {activeWalkingRoute || fromQuery || toQuery ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t(locale, 'btnClearRoute')}
                        onPress={handleClearRoute}
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
                    badgeColor="#D32F2F"
                    point={{ name: toQuery, position: toPos }}
                    onChangePoint={(p) => {
                      setToQuery(p.name);
                      setToPos(p.position);
                      setMapCenter({ lat: p.position.lat, lon: p.position.lon });
                    }}
                    placeholder={t(locale, 'toPlaceholder')}
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
                      {/* Route Variant Selection (Shortest vs Barrier-Free) */}
                      {routeVariants ? (
                        <View style={styles.variantSection}>
                          <Text style={[styles.variantSectionTitle, { color: colors.text, fontSize: fontSize(13.5), fontWeight: '700' }]}>
                            Wybór wariantu trasy:
                          </Text>
                          <View style={styles.variantButtonsRow}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: selectedRouteVariant === 'accessible' }}
                              onPress={() => selectRouteVariant('accessible')}
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
                                  Bez barier
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
                                {(routeVariants.accessible.report.lengthMetres / 1000).toFixed(1)} km • {routeVariants.accessible.report.findings.filter((f) => f.severity === 'blocker').length} blokad
                              </Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: selectedRouteVariant === 'shortest' }}
                              onPress={() => selectRouteVariant('shortest')}
                              style={[
                                styles.variantButton,
                                {
                                  backgroundColor:
                                    selectedRouteVariant === 'shortest' ? colors.accent : colors.background,
                                  borderColor:
                                    selectedRouteVariant === 'shortest' ? colors.accent : colors.border,
                                  borderWidth: selectedRouteVariant === 'shortest' ? 2 : 1,
                                },
                              ]}
                            >
                              <View style={styles.variantHeader}>
                                <Lightning
                                  size={16}
                                  weight="bold"
                                  color={selectedRouteVariant === 'shortest' ? colors.accentText : colors.warningText}
                                />
                                <Text
                                  style={[
                                    styles.variantTitle,
                                    {
                                      color: selectedRouteVariant === 'shortest' ? colors.accentText : colors.text,
                                      fontSize: fontSize(13),
                                      fontWeight: selectedRouteVariant === 'shortest' ? '800' : '600',
                                    },
                                  ]}
                                >
                                  Najkrótsza
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.variantSub,
                                  {
                                    color: selectedRouteVariant === 'shortest' ? colors.accentText : colors.muted,
                                    fontSize: fontSize(11.5),
                                  },
                                ]}
                              >
                                {(routeVariants.shortest.report.lengthMetres / 1000).toFixed(1)} km • {routeVariants.shortest.report.findings.filter((f) => f.severity === 'blocker').length} blokad
                              </Text>
                            </Pressable>
                          </View>

                          {selectedRouteVariant === 'shortest' &&
                            routeVariants.shortest.report.findings.filter((f) => f.severity === 'blocker').length > 0 && (
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
                                  Trasa najkrótsza jest o{' '}
                                  {Math.max(
                                    0,
                                    routeVariants.accessible.report.lengthMetres - routeVariants.shortest.report.lengthMetres,
                                  )}{' '}
                                  m krótsza, ale zawiera{' '}
                                  {routeVariants.shortest.report.findings.filter((f) => f.severity === 'blocker').length}{' '}
                                  blokad(y) dla Twojego profilu. Trasa bez barier omija przeszkody.
                                </Text>
                              </View>
                            )}
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

                      {/* Barrier View Mode Selection on Card */}
                      <View style={{ marginTop: 12, marginBottom: 4 }}>
                        <Text style={[styles.fieldLabel, { color: colors.muted, fontSize: fontSize(12), marginBottom: 6 }]}>
                          {t(locale, 'barrierViewModeLabel')}:
                        </Text>
                        <BarrierViewControl
                          compact
                          mode={barrierViewMode}
                          onChangeMode={(newMode) => {
                            if (newMode === 'route' && !activeWalkingRoute) {
                              setStatusMessage(t(locale, 'noActiveRouteForBarriers'));
                              setTimeout(() => setStatusMessage(null), 3500);
                            }
                            setBarrierViewMode(newMode);
                          }}
                          routeBarriersCount={routeBarriers.length}
                          allBarriersCount={allCityBarriers.length}
                          hasActiveRoute={Boolean(activeWalkingRoute)}
                        />
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
                                fromLat: String(fromPos.lat),
                                fromLon: String(fromPos.lon),
                                toName: toQuery,
                                toLat: String(toPos.lat),
                                toLon: String(toPos.lon),
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
                    <GovCard variant="accent">
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.resultTitle, { color: colors.text, fontSize: fontSize(16), flex: 1 }]}>
                          {activePlaceReport.placeName}
                        </Text>
                      </View>
                      <Text style={[styles.resultSub, { color: colors.muted, fontSize: fontSize(13) }]}>
                        {activePlaceReport.summaryMessage}
                      </Text>
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
                            setToQuery(activePlaceReport.placeName);
                            setToPos(placePos);
                            setActiveTab('route');
                            setStatusMessage(`Ustawiono cel trasy: ${activePlaceReport.placeName}`);
                            setTimeout(() => setStatusMessage(null), 3000);
                          }}
                          style={{ flex: 1 }}
                        />
                      </View>

                      {/* Place Accessibility Community Validations with Photos */}
                      <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontWeight: '700', fontSize: fontSize(13.5), color: colors.text }}>
                            📸 Walidacje dostępności obiektu ({placeComments.length})
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setShowPlaceValidationForm(!showPlaceValidationForm)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingVertical: 4,
                              paddingHorizontal: 8,
                              borderRadius: 6,
                              backgroundColor: showPlaceValidationForm ? colors.border : colors.accent,
                            }}
                          >
                            <Camera size={13} weight="bold" color="#FFF" />
                            <Text style={{ fontSize: fontSize(11.5), color: '#FFF', fontWeight: '700' }}>
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
                      <Text style={{ color: colors.muted, fontSize: fontSize(12), lineHeight: 16 }}>
                        {locale === 'pl'
                          ? `Aktualna dopuszczalna wysokość: ${activeThresholds.maxKerbMillimetres} mm (${(activeThresholds.maxKerbMillimetres / 10).toFixed(0)} cm). Krawężniki wyższe od tej wartości będą traktowane jako bariera blokująca trasę.`
                          : locale === 'uk'
                          ? `Поточна допустима висота: ${activeThresholds.maxKerbMillimetres} мм (${(activeThresholds.maxKerbMillimetres / 10).toFixed(0)} см). Вищі бордюри блокуватимуть маршрут.`
                          : `Current allowable height: ${activeThresholds.maxKerbMillimetres} mm (${(activeThresholds.maxKerbMillimetres / 10).toFixed(0)} cm). Kerbs higher than this will block the route.`}
                      </Text>
                      <View style={styles.stepBtnRow}>
                        <GovButton
                          variant="outline"
                          title="-10 mm"
                          accessibilityLabel={`${t(locale, 'maxKerb')} -10 mm`}
                          onPress={() =>
                            updateActiveThresholds({
                              maxKerbMillimetres: Math.max(10, activeThresholds.maxKerbMillimetres - 10),
                            })
                          }
                          style={styles.smallStepBtn}
                        />
                        <View
                          accessibilityLiveRegion="polite"
                          accessibilityLabel={`${t(locale, 'maxKerb')} ${activeThresholds.maxKerbMillimetres} mm`}
                          style={[
                            styles.kerbValue,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: fontSize(14),
                              fontWeight: '800',
                            }}
                          >
                            {activeThresholds.maxKerbMillimetres} mm
                          </Text>
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: fontSize(11),
                              fontWeight: '600',
                            }}
                          >
                            {(activeThresholds.maxKerbMillimetres / 10).toFixed(0)} cm
                          </Text>
                        </View>
                        <GovButton
                          variant="outline"
                          title="+10 mm"
                          accessibilityLabel={`${t(locale, 'maxKerb')} +10 mm`}
                          onPress={() =>
                            updateActiveThresholds({
                              maxKerbMillimetres: activeThresholds.maxKerbMillimetres + 10,
                            })
                          }
                          style={styles.smallStepBtn}
                        />
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

              {/* TAB 4: ZGŁOŚ (LOCAL REPORT & OSM NOTE) */}
              {activeTab === 'report' ? (
                <View style={styles.formSection}>
                  {/* Karta Krakowska Badge / Quick Login */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      krakowCardUser
                        ? `${t(locale, 'krakowCardVerifiedResident')}: ${krakowCardUser.displayName}`
                        : t(locale, 'krakowCardLoginBtn')
                    }
                    onPress={() => setKrakowCardModalVisible(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: krakowCardUser
                        ? (isHighContrast ? colors.accent : 'rgba(34, 197, 94, 0.15)')
                        : (isHighContrast ? colors.surface : 'rgba(0, 92, 169, 0.08)'),
                      borderWidth: 1,
                      borderColor: krakowCardUser ? '#22C55E' : colors.border,
                      marginBottom: 8,
                    }}
                  >
                    {krakowCardUser ? (
                      <ShieldCheck
                        size={16}
                        color={isHighContrast ? colors.accentText : '#16A34A'}
                        weight="fill"
                      />
                    ) : (
                      <IdentificationCard size={16} color={colors.accent} weight="bold" />
                    )}
                    <Text
                      style={{
                        flex: 1,
                        fontSize: fontSize(12),
                        fontWeight: '700',
                        color: isHighContrast
                          ? colors.text
                          : krakowCardUser
                            ? '#15803D'
                            : colors.accent,
                      }}
                    >
                      {krakowCardUser
                        ? `Zweryfikowany: ${krakowCardUser.displayName} (Karta Krakowska)`
                        : `Zgłaszasz anonimowo. Zaloguj Kartą Krakowską ➔`}
                    </Text>
                  </Pressable>

                  {/* 1. WALIDACJA LOSOWEGO ZGŁOSZENIA HAZARDU ZE ZDJĘCIEM */}
                  <GovCard variant="accent">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(15) }]}>
                        🎲 Waliduj losowe zgłoszenie
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Wylosuj inne zgłoszenie"
                        onPress={loadRandomHazard}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 6,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Shuffle size={13} weight="bold" color={colors.accent} />
                        <Text style={{ fontSize: fontSize(11.5), color: colors.accent, fontWeight: '700' }}>
                          Wylosuj inne
                        </Text>
                      </Pressable>
                    </View>

                    {randomHazardLoading ? (
                      <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 12 }} />
                    ) : randomHazard ? (
                      <View style={{ gap: 6, marginTop: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 5,
                              backgroundColor: colors.warningBg,
                              borderWidth: 1,
                              borderColor: colors.warningBorder,
                            }}
                          >
                            <Text style={{ fontSize: fontSize(11.5), fontWeight: '700', color: colors.warningText }}>
                              {randomHazard.category ? `Kategoria: ${randomHazard.category}` : 'Bariera / Hazard'}
                            </Text>
                          </View>
                          <Text style={{ fontSize: fontSize(11), color: colors.muted }}>
                            Nadal tu: {randomHazard.stillHereCount} · Naprawione: {randomHazard.fixedCount}
                          </Text>
                        </View>

                        <Text style={{ fontSize: fontSize(14), fontWeight: '700', color: colors.text, marginTop: 2 }}>
                          {randomHazard.description}
                        </Text>
                        <CredibilityNote
                          locale={locale}
                          assessment={credibilityFromReports({
                            supportCount: randomHazard.stillHereCount,
                            photoCount:
                              (randomHazard.photoUrl ? 1 : 0) +
                              (randomHazard.validations?.filter((v) => v.photoUrl).length ?? 0),
                          })}
                        />

                        {/* Existing Photo on Server */}
                        {randomHazard.photoUrl ? (
                          <View style={{ marginTop: 4 }}>
                            <Text style={{ fontSize: fontSize(11.5), color: colors.muted, marginBottom: 2 }}>
                              📷 Zdjęcie przeszkody (widoczne dla wszystkich):
                            </Text>
                            <Image
                              source={{ uri: randomHazard.photoUrl }}
                              style={{ width: '100%', height: 160, borderRadius: 8 }}
                              resizeMode="cover"
                            />
                          </View>
                        ) : null}

                        {/* Community photo validations */}
                        {randomHazard.validations && randomHazard.validations.length > 0 ? (
                          <View style={{ marginTop: 6, gap: 4 }}>
                            <Text style={{ fontSize: fontSize(12), fontWeight: '700', color: colors.text }}>
                              Potwierdzenia mieszkańców ({randomHazard.validations.length}):
                            </Text>
                            {randomHazard.validations.slice(0, 3).map((v) => (
                              <View
                                key={v.id}
                                style={{
                                  padding: 6,
                                  borderRadius: 6,
                                  backgroundColor: colors.background,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                }}
                              >
                                <Text style={{ fontSize: fontSize(11), color: colors.muted }}>
                                  {v.action === 'still_here' ? '⚠️ Nadal występuje' : '✅ Naprawione'} • {v.createdAt.slice(0, 10)}
                                </Text>
                                {v.comment ? (
                                  <Text style={{ fontSize: fontSize(12), color: colors.text }}>{v.comment}</Text>
                                ) : null}
                                {v.photoUrl ? (
                                  <Image
                                    source={{ uri: v.photoUrl }}
                                    style={{ width: '100%', height: 100, borderRadius: 6, marginTop: 4 }}
                                    resizeMode="cover"
                                  />
                                ) : null}
                              </View>
                            ))}
                          </View>
                        ) : null}

                        {/* Validation form for this hazard */}
                        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
                          <Text style={{ fontSize: fontSize(12.5), fontWeight: '700', color: colors.text }}>
                            Twoja weryfikacja tego zgłoszenia:
                          </Text>

                          <View style={styles.actionChoiceRow}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setRandomHazardVoteAction('still_here')}
                              style={[
                                styles.actionChoiceBtn,
                                {
                                  backgroundColor: randomHazardVoteAction === 'still_here' ? colors.warningBg : colors.surface,
                                  borderColor: randomHazardVoteAction === 'still_here' ? colors.warningBorder : colors.border,
                                },
                              ]}
                            >
                              <Warning size={14} weight="bold" color={randomHazardVoteAction === 'still_here' ? colors.warningText : colors.text} />
                              <Text style={[styles.actionChoiceText, { color: randomHazardVoteAction === 'still_here' ? colors.warningText : colors.text }]}>
                                Nadal występuje
                              </Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              onPress={() => setRandomHazardVoteAction('fixed')}
                              style={[
                                styles.actionChoiceBtn,
                                {
                                  backgroundColor: randomHazardVoteAction === 'fixed' ? colors.okBg : colors.surface,
                                  borderColor: randomHazardVoteAction === 'fixed' ? colors.okBorder : colors.border,
                                },
                              ]}
                            >
                              <Check size={14} weight="bold" color={randomHazardVoteAction === 'fixed' ? colors.okText : colors.text} />
                              <Text style={[styles.actionChoiceText, { color: randomHazardVoteAction === 'fixed' ? colors.okText : colors.text }]}>
                                Naprawione / brak
                              </Text>
                            </Pressable>
                          </View>

                          {/* Photo Pickers */}
                          <View style={styles.photoBtnRow}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={async () => {
                                const photo = await pickPhotoAsync('camera');
                                if (photo) setRandomHazardPhoto(photo);
                              }}
                              style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                              <Camera size={14} weight="bold" color={colors.accent} />
                              <Text style={[styles.photoBtnText, { color: colors.text }]}>Zrób zdjęcie</Text>
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              onPress={async () => {
                                const photo = await pickPhotoAsync('library');
                                if (photo) setRandomHazardPhoto(photo);
                              }}
                              style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                              <ImageIcon size={14} weight="bold" color={colors.accent} />
                              <Text style={[styles.photoBtnText, { color: colors.text }]}>Z galerii</Text>
                            </Pressable>
                          </View>

                          {randomHazardPhoto ? (
                            <View style={[styles.photoPreviewContainer, { borderColor: colors.border }]}>
                              <Image source={{ uri: randomHazardPhoto }} style={styles.photoPreviewImage} resizeMode="cover" />
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Usuń wybrane zdjęcie"
                                onPress={() => setRandomHazardPhoto(null)}
                                style={styles.photoRemoveBtn}
                              >
                                <Trash size={14} color="#FFF" weight="bold" />
                              </Pressable>
                            </View>
                          ) : null}

                          <TextInput
                            value={randomHazardComment}
                            onChangeText={setRandomHazardComment}
                            placeholder="Krótki komentarz do weryfikacji (opcjonalnie)..."
                            placeholderTextColor={colors.muted}
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: colors.border,
                                borderWidth: 1,
                                fontSize: fontSize(13),
                                marginTop: 6,
                                minHeight: 40,
                              },
                            ]}
                          />

                          <GovButton
                            title={randomHazardSubmitting ? 'Wysyłanie na serwer...' : 'Wyślij walidację ze zdjęciem'}
                            icon={<Check size={16} weight="bold" color={colors.accentText} />}
                            variant="primary"
                            loading={randomHazardSubmitting}
                            onPress={handleValidateRandomHazard}
                            style={{ marginTop: 8 }}
                          />
                        </View>
                      </View>
                    ) : null}
                  </GovCard>

                  {/* 2. FORMULARZ NOWEGO ZGŁOSZENIA BARIERY ZE ZDJĘCIEM */}
                  <GovCard variant="default">
                    <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(15) }]}>
                      {t(locale, 'reportObstacleHeading')}
                    </Text>

                    {/* Category Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
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

                    {/* Photo selection buttons for new report */}
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
                      <GovCard variant="ok" style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Check size={16} weight="bold" color={colors.okText} />
                          <Text style={{ color: colors.okText, fontWeight: '700', fontSize: fontSize(13) }}>
                            {t(locale, 'reportSavedSuccess')}
                          </Text>
                        </View>
                      </GovCard>
                    ) : null}

                    <GovButton
                      title={isUploadingPhoto ? 'Przesyłanie zdjęcia...' : t(locale, 'reportSubmit')}
                      icon={<Check size={16} weight="bold" color={colors.accentText} />}
                      variant="primary"
                      loading={isUploadingPhoto}
                      onPress={handleSubmitLocalReport}
                      style={{ marginTop: 8 }}
                    />

                    <GovButton
                      title={t(locale, 'openFullOsmForm')}
                      icon={<ArrowRight size={16} weight="bold" color={colors.text} />}
                      variant="outline"
                      onPress={() => router.push('/report-correction')}
                      style={{ marginTop: 6 }}
                    />
                  </GovCard>

                  {/* 3. ZGŁOSZENIA W KRAKOWIE ZE ZDJĘCIAMI (WIDOCZNE DLA WSZYSTKICH) */}
                  <View style={{ marginTop: 6 }}>
                    <Text style={[styles.sectionSubtitle, { color: colors.text, fontSize: fontSize(14.5), marginBottom: 6 }]}>
                      Zgłoszenia mieszkańców ze zdjęciami ({serverHazards.length + localReports.length})
                    </Text>

                    {serverHazards.map((h) => (
                      <GovCard key={h.id} style={{ marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View
                            style={{
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: h.status === 'confirmed' ? colors.okBg : colors.warningBg,
                              borderWidth: 1,
                              borderColor: h.status === 'confirmed' ? colors.okBorder : colors.warningBorder,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize(11),
                                fontWeight: '700',
                                color: h.status === 'confirmed' ? colors.okText : colors.warningText,
                              }}
                            >
                              {h.category ? `${h.category.toUpperCase()}` : 'ZGŁOSZENIE'}
                            </Text>
                          </View>
                          <Text style={{ color: colors.muted, fontSize: fontSize(11) }}>
                            {h.createdAt.slice(0, 10)}
                          </Text>
                        </View>

                        <Text style={{ color: colors.text, fontSize: fontSize(13.5), fontWeight: '700', marginTop: 4 }}>
                          {h.description}
                        </Text>
                        <CredibilityNote
                          locale={locale}
                          assessment={credibilityFromReports({
                            supportCount: h.stillHereCount,
                            photoCount:
                              (h.photoUrl ? 1 : 0) +
                              (h.validations?.filter((v) => v.photoUrl).length ?? 0),
                          })}
                        />

                        {/* Photo visible to everyone */}
                        {h.photoUrl ? (
                          <View style={{ marginTop: 6 }}>
                            <Image
                              source={{ uri: h.photoUrl }}
                              style={{ width: '100%', height: 140, borderRadius: 8 }}
                              resizeMode="cover"
                            />
                          </View>
                        ) : null}

                        <View style={{ marginTop: 8 }}>
                          <Text style={{ color: colors.muted, fontSize: fontSize(11.5) }}>
                            Nadal tu: {h.stillHereCount} · Naprawione: {h.fixedCount}
                          </Text>
                        </View>

                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setRandomHazard(h);
                              setStatusMessage(`Wybrano zgłoszenie do walidacji.`);
                              setTimeout(() => setStatusMessage(null), 2500);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: colors.accent,
                            }}
                          >
                            <Camera size={12} weight="bold" color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: fontSize(11), fontWeight: '700' }}>
                              Waliduj zdjęciem
                            </Text>
                          </Pressable>
                      </GovCard>
                    ))}

                    {localReports.map((r) => (
                      <GovCard key={r.id} style={{ marginTop: 6 }}>
                        <Text style={{ color: colors.text, fontSize: fontSize(13) }}>{r.description}</Text>
                        {r.photoUrl ? (
                          <Image
                            source={{ uri: r.photoUrl }}
                            style={{ width: '100%', height: 130, borderRadius: 6, marginTop: 4 }}
                            resizeMode="cover"
                          />
                        ) : null}
                        <Text style={{ color: colors.muted, fontSize: fontSize(11), marginTop: 4 }}>
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t(locale, 'localReportUnverified')}
                        </Text>
                        <CredibilityNote
                          locale={locale}
                          assessment={credibilityFromReports({
                            supportCount: r.stillHereCount ?? 0,
                            photoCount: r.photoUrl ? 1 : 0,
                          })}
                        />
                      </GovCard>
                    ))}
                  </View>
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    minHeight: 38,
  },
  swapIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearRouteBtn: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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

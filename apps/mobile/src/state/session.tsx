import {
  city,
} from '@/config/city';
import {
  analyzeRoute,
  type BarrierThresholds,
  type Fact,
  type LonLat,
  type PlaceAnalysisReport,
  type ProfileId,
  type RouteReport,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { RouteVariant, RouteVariantId } from '@/services/api';
import { getCookie, setCookie } from '@/services/storage';

import type { Locale } from '@/i18n/strings';
import {
  getCurrentUserLocation,
  watchUserLocation,
  type UserCoordinates,
  type UserLocationResult,
} from '@/services/location';
import {
  getColors,
  scaleFontSize,
  getLineHeight,
  getLetterSpacing,
  type ContrastMode,
  type TextSize,
  type LineHeightMode,
  type LetterSpacingMode,
  type FontFamilyMode,
  type ThemeColors,
} from '@/theme/tokens';

export interface LocalReport {
  id: string;
  description: string;
  createdAt: string;
  status: 'reported' | 'confirmed' | 'resolved';
  photoUrl?: string;
  category?: 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
  position?: { lat: number; lon: number };
  stillHereCount?: number;
  fixedCount?: number;
}

export interface DebugState {
  simulateOverpassDown: boolean;
  simulateMapyDown: boolean;
  simulateOffline: boolean;
}

export interface UserAccount {
  email: string;
  displayName: string;
  status: 'active' | 'suspended';
  cardNumber?: string;
  validUntil?: string;
  accessibilityPass?: boolean;
  verifiedResident?: boolean;
  discountTier?: string;
}

export type KrakowCardUser = UserAccount;

export type BarrierViewMode = 'none' | 'route' | 'all';

interface SessionValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  profileId: ProfileId;
  setProfileId: (profileId: ProfileId) => void;
  customThresholds: BarrierThresholds;
  setCustomThresholds: (thresholds: BarrierThresholds) => void;
  activeThresholds: BarrierThresholds;
  updateActiveThresholds: (partial: Partial<BarrierThresholds>) => void;
  toggleBlockedRoadType: (roadType: string) => void;
  setBlockedRoadTypes: (roadTypes: string[]) => void;
  pendingDestination: { name: string; position: LonLat } | null;
  setPendingDestination: (dest: { name: string; position: LonLat } | null) => void;
  debugState: DebugState;
  setDebugState: (updater: (prev: DebugState) => DebugState) => void;
  localReports: LocalReport[];
  addLocalReport: (
    description: string,
    extra?: {
      photoUrl?: string;
      category?: 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
      position?: { lat: number; lon: number };
    }
  ) => void;
  activeRouteReport: RouteReport | null;
  setActiveRouteReport: (report: RouteReport | null) => void;
  activeWalkingRoute: WalkingRoute | null;
  setActiveWalkingRoute: (route: WalkingRoute | null) => void;
  activeRouteFacts: Fact[];
  setActiveRouteFacts: (facts: Fact[]) => void;
  activeRouteIsSample: boolean;
  setActiveRouteIsSample: (isSample: boolean) => void;
  routeVariants: Record<RouteVariantId, RouteVariant> | null;
  setRouteVariants: (variants: Record<RouteVariantId, RouteVariant> | null) => void;
  selectedRouteVariant: RouteVariantId;
  selectRouteVariant: (variantId: RouteVariantId) => void;
  activePlaceReport: PlaceAnalysisReport | null;
  setActivePlaceReport: (report: PlaceAnalysisReport | null) => void;

  // Barrier view mode: none | route | all
  barrierViewMode: BarrierViewMode;
  setBarrierViewMode: (mode: BarrierViewMode) => void;

  // Real user GPS location
  userLocation: UserCoordinates | null;
  setUserLocation: (loc: UserCoordinates | null) => void;
  isLocating: boolean;
  fetchUserLocation: () => Promise<UserLocationResult | null>;

  // User Account (Mockup email account - no server data saved)
  userAccount: UserAccount | null;
  userModalVisible: boolean;
  setUserModalVisible: (val: boolean) => void;
  loginUser: (credentials?: { email?: string; password?: string; name?: string; identifier?: string }) => void;
  logoutUser: () => void;

  // Backwards compatibility aliases
  krakowCardUser: UserAccount | null;
  krakowCardModalVisible: boolean;
  setKrakowCardModalVisible: (val: boolean) => void;
  loginWithKrakowCard: (credentials?: { email?: string; password?: string; name?: string; identifier?: string }) => void;
  logoutKrakowCard: () => void;

  // Accessibility & Design System State
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  cycleContrastMode: () => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  decreaseTextSize: () => void;
  increaseTextSize: () => void;
  lineHeightMode: LineHeightMode;
  setLineHeightMode: (mode: LineHeightMode) => void;
  letterSpacingMode: LetterSpacingMode;
  setLetterSpacingMode: (mode: LetterSpacingMode) => void;
  fontFamilyMode: FontFamilyMode;
  setFontFamilyMode: (mode: FontFamilyMode) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  dyslexicFont: boolean;
  setDyslexicFont: (val: boolean) => void;
  increasedSpacing: boolean;
  setIncreasedSpacing: (val: boolean) => void;
  highlightLinks: boolean;
  setHighlightLinks: (val: boolean) => void;
  readingRuler: boolean;
  setReadingRuler: (val: boolean) => void;
  readingRulerY: number;
  setReadingRulerY: (y: number) => void;
  readingMask: boolean;
  setReadingMask: (val: boolean) => void;
  readingMaskY: number;
  setReadingMaskY: (y: number) => void;
  accessibilityModalVisible: boolean;
  setAccessibilityModalVisible: (val: boolean) => void;
  resetAccessibility: () => void;

  // Computed Theme Helpers
  colors: ThemeColors;
  fontSize: (base: number) => number;
  lineHeight: (base: number) => number;
  letterSpacing: number;
  isHighContrast: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

const COOKIE_CUSTOM_THRESHOLDS = 'krakow_custom_thresholds';
const COOKIE_PROFILE_ID = 'krakow_profile_id';
const COOKIE_LOCALE = 'krakow_locale';
const COOKIE_CONTRAST = 'krakow_contrast';
const COOKIE_TEXT_SIZE = 'krakow_text_size';

function loadInitialCustomThresholds(): BarrierThresholds {
  const defaultCustom = city.profiles.custom || city.profiles.wheelchair;
  try {
    const raw = getCookie(COOKIE_CUSTOM_THRESHOLDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          ...defaultCustom,
          ...parsed,
          stepsTreatment:
            parsed.stepsTreatment === 'blocker' ||
            parsed.stepsTreatment === 'warning' ||
            parsed.stepsTreatment === 'allowed'
              ? parsed.stepsTreatment
              : parsed.stepsAreBlocker
                ? 'blocker'
                : 'warning',
          allowedSurfaces: Array.isArray(parsed.allowedSurfaces)
            ? parsed.allowedSurfaces
            : defaultCustom.allowedSurfaces,
          blockedRoadTypes: Array.isArray(parsed.blockedRoadTypes)
            ? parsed.blockedRoadTypes
            : defaultCustom.blockedRoadTypes,
          blockedSurfaces: Array.isArray(parsed.blockedSurfaces)
            ? parsed.blockedSurfaces
            : defaultCustom.blockedSurfaces,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return { ...defaultCustom };
}

function loadInitialProfileId(): ProfileId {
  try {
    const raw = getCookie(COOKIE_PROFILE_ID);
    if (raw && ['wheelchair', 'custom'].includes(raw)) {
      return raw as ProfileId;
    }
  } catch {
    // Ignore
  }
  return 'wheelchair';
}

function loadInitialLocale(): Locale {
  try {
    const raw = getCookie(COOKIE_LOCALE);
    if (raw && ['pl', 'en', 'uk'].includes(raw)) {
      return raw as Locale;
    }
  } catch {
    // Ignore
  }
  return 'pl';
}

function loadInitialContrast(): ContrastMode {
  try {
    const raw = getCookie(COOKIE_CONTRAST);
    if (
      raw &&
      [
        'standard-light',
        'standard-dark',
        'hc-yellow-black',
        'hc-black-yellow',
        'hc-white-black',
        'monochrome',
      ].includes(raw)
    ) {
      return raw as ContrastMode;
    }
  } catch {
    // Ignore
  }
  return 'standard-light';
}

function loadInitialTextSize(): TextSize {
  try {
    const raw = getCookie(COOKIE_TEXT_SIZE);
    if (raw && ['normal', 'medium', 'large', 'xlarge', 'xxlarge'].includes(raw)) {
      return raw as TextSize;
    }
  } catch {
    // Ignore
  }
  return 'normal';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadInitialLocale);
  const [profileId, setProfileIdState] = useState<ProfileId>(loadInitialProfileId);
  const [customThresholds, setCustomThresholdsState] = useState<BarrierThresholds>(loadInitialCustomThresholds);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    setCookie(COOKIE_LOCALE, loc);
  }, []);

  const setProfileId = useCallback((id: ProfileId) => {
    setProfileIdState(id);
    setCookie(COOKIE_PROFILE_ID, id);
  }, []);

  // Default wheelchair profile is immutable; custom profile holds all customisations
  const activeThresholds = useMemo(() => {
    if (profileId === 'custom') return customThresholds;
    return city.profiles.wheelchair;
  }, [profileId, customThresholds]);

  const setCustomThresholds = useCallback((thresholds: BarrierThresholds) => {
    setCustomThresholdsState(thresholds);
    setCookie(COOKIE_CUSTOM_THRESHOLDS, JSON.stringify(thresholds));
  }, []);

  const toggleBlockedRoadType = useCallback(
    (roadType: string) => {
      const norm = roadType.trim().toLowerCase();
      // If altering while on default wheelchair profile, base the custom profile on the default and switch to custom
      const base = profileId === 'custom' ? customThresholds : { ...city.profiles.wheelchair };
      const currentBlocked = (
        base.blockedRoadTypes ??
        base.blockedSurfaces ??
        []
      ).map((s) => s.trim().toLowerCase());
      const newBlocked = currentBlocked.includes(norm)
        ? currentBlocked.filter((s) => s !== norm)
        : [...currentBlocked, norm];

      const updated: BarrierThresholds = {
        ...base,
        blockedRoadTypes: newBlocked,
        blockedSurfaces: newBlocked,
      };

      setCustomThresholds(updated);
      if (profileId !== 'custom') {
        setProfileId('custom');
      }
    },
    [profileId, customThresholds, setCustomThresholds, setProfileId],
  );

  const setBlockedRoadTypes = useCallback(
    (roadTypes: string[]) => {
      const base = profileId === 'custom' ? customThresholds : { ...city.profiles.wheelchair };
      const newBlocked = roadTypes.map((s) => s.trim().toLowerCase());
      const updated: BarrierThresholds = {
        ...base,
        blockedRoadTypes: newBlocked,
        blockedSurfaces: newBlocked,
      };
      setCustomThresholds(updated);
      if (profileId !== 'custom') {
        setProfileId('custom');
      }
    },
    [profileId, customThresholds, setCustomThresholds, setProfileId],
  );

  const updateActiveThresholds = useCallback(
    (partial: Partial<BarrierThresholds>) => {
      const base = profileId === 'custom' ? customThresholds : { ...city.profiles.wheelchair };
      const updated: BarrierThresholds = { ...base, ...partial };
      setCustomThresholds(updated);
      if (profileId !== 'custom') {
        setProfileId('custom');
      }
    },
    [profileId, customThresholds, setCustomThresholds, setProfileId],
  );

  const [pendingDestination, setPendingDestination] = useState<{
    name: string;
    position: LonLat;
  } | null>(null);

  const [debugState, setDebugStateInternal] = useState<DebugState>({
    simulateOverpassDown: false,
    simulateMapyDown: false,
    simulateOffline: false,
  });
  const [localReports, setLocalReports] = useState<LocalReport[]>([
    {
      id: 'rep-init-1',
      description: 'Uszkodzony zjazd z chodnika na skrzyżowaniu Grodzka/Franciszkańska',
      createdAt: '2026-10-02T16:45:00Z',
      status: 'reported',
      category: 'obstacle',
      position: { lat: 50.05805, lon: 19.93755 },
    },
  ]);
  const [activeRouteReport, setActiveRouteReport] = useState<RouteReport | null>(null);
  const [activeWalkingRoute, setActiveWalkingRoute] = useState<WalkingRoute | null>(null);
  const [activeRouteFacts, setActiveRouteFacts] = useState<Fact[]>([]);
  const [activeRouteIsSample, setActiveRouteIsSample] = useState<boolean>(false);
  const [routeVariants, setRouteVariants] = useState<Record<RouteVariantId, RouteVariant> | null>(null);
  const [selectedRouteVariant, setSelectedRouteVariant] = useState<RouteVariantId>('accessible');
  const [activePlaceReport, setActivePlaceReport] = useState<PlaceAnalysisReport | null>(null);
  const [barrierViewMode, setBarrierViewMode] = useState<BarrierViewMode>('route');

  const routeVariantsRef = useRef(routeVariants);
  routeVariantsRef.current = routeVariants;
  const selectedRouteVariantRef = useRef(selectedRouteVariant);
  selectedRouteVariantRef.current = selectedRouteVariant;
  const activeWalkingRouteRef = useRef(activeWalkingRoute);
  activeWalkingRouteRef.current = activeWalkingRoute;
  const activeRouteFactsRef = useRef(activeRouteFacts);
  activeRouteFactsRef.current = activeRouteFacts;
  const activeRouteReportRef = useRef(activeRouteReport);
  activeRouteReportRef.current = activeRouteReport;
  const activeRouteIsSampleRef = useRef(activeRouteIsSample);
  activeRouteIsSampleRef.current = activeRouteIsSample;

  const selectRouteVariant = useCallback(
    (variantId: RouteVariantId) => {
      setSelectedRouteVariant(variantId);
      if (routeVariants && routeVariants[variantId]) {
        const v = routeVariants[variantId];
        setActiveWalkingRoute(v.walkingRoute);
        setActiveRouteReport(v.report);
        setActiveRouteFacts(v.facts);
        setActiveRouteIsSample(v.isSample);
      }
    },
    [routeVariants],
  );

  // Dynamic real-time blocker recalculation whenever thresholds or mobility profile changes
  useEffect(() => {
    const curVariants = routeVariantsRef.current;
    if (curVariants) {
      const updatedAccessibleReport = analyzeRoute({
        routeId: curVariants.accessible.report.routeId,
        profileId,
        routeCoordinates: curVariants.accessible.walkingRoute.coordinates,
        facts: curVariants.accessible.facts,
        config: city,
        thresholds: activeThresholds,
        isSample: curVariants.accessible.isSample,
      });

      const updatedFastestReport = analyzeRoute({
        routeId: curVariants.fastest.report.routeId,
        profileId,
        routeCoordinates: curVariants.fastest.walkingRoute.coordinates,
        facts: curVariants.fastest.facts,
        config: city,
        thresholds: activeThresholds,
        isSample: curVariants.fastest.isSample,
      });

      const nextVariants: Record<RouteVariantId, RouteVariant> = {
        accessible: {
          ...curVariants.accessible,
          report: updatedAccessibleReport,
        },
        fastest: {
          ...curVariants.fastest,
          report: updatedFastestReport,
        },
      };

      setRouteVariants(nextVariants);

      const activeVar = nextVariants[selectedRouteVariantRef.current];
      if (activeVar) {
        setActiveWalkingRoute(activeVar.walkingRoute);
        setActiveRouteReport(activeVar.report);
        setActiveRouteFacts(activeVar.facts);
        setActiveRouteIsSample(activeVar.isSample);
      }
    } else if (
      activeWalkingRouteRef.current &&
      activeRouteFactsRef.current &&
      activeRouteFactsRef.current.length > 0
    ) {
      const updated = analyzeRoute({
        routeId: activeRouteReportRef.current?.routeId ?? `route-${Date.now()}`,
        profileId,
        routeCoordinates: activeWalkingRouteRef.current.coordinates,
        facts: activeRouteFactsRef.current,
        config: city,
        thresholds: activeThresholds,
        isSample: activeRouteIsSampleRef.current,
      });
      setActiveRouteReport(updated);
    }
  }, [profileId, activeThresholds]);

  // User Account (Mockup email account - zero server storage)
  const [userModalVisible, setUserModalVisible] = useState<boolean>(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  const loginUser = useCallback(
    (credentials?: { email?: string; password?: string; name?: string; identifier?: string }) => {
      const rawEmailOrId = (credentials?.email || credentials?.identifier || '').trim();
      const rawName = (credentials?.name || '').trim();

      let email = rawEmailOrId;
      if (!email) {
        email = 'uzytkownik@example.com';
      } else if (!email.includes('@')) {
        email = `${email.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;
      }

      let displayName = rawName;
      if (!displayName) {
        const userPart = email.split('@')[0];
        displayName = userPart
          .split(/[._-]/)
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
          .join(' ');
      }
      if (!displayName) {
        displayName = 'Użytkownik';
      }

      const user: UserAccount = {
        email,
        displayName,
        status: 'active',
        cardNumber: 'MOCK-USR-2026',
        validUntil: '31.12.2027',
        accessibilityPass: true,
        verifiedResident: true,
        discountTier: 'Konto użytkownika • Mockup',
      };

      setUserAccount(user);
    },
    [],
  );

  const logoutUser = useCallback(() => {
    setUserAccount(null);
  }, []);

  // User GPS location state
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const locationWatcherRef = useRef<(() => void) | null>(null);

  const startWatchingLocation = useCallback(async () => {
    if (locationWatcherRef.current) return;
    try {
      const unsub = await watchUserLocation((loc) => {
        setUserLocation({ lat: loc.lat, lon: loc.lon });
      });
      if (unsub) {
        locationWatcherRef.current = unsub;
      }
    } catch (err) {
      console.warn('[Session] Failed to start location watch:', err);
    }
  }, []);

  const fetchUserLocation = useCallback(async (): Promise<UserLocationResult | null> => {
    setIsLocating(true);
    try {
      const res = await getCurrentUserLocation();
      if (res) {
        setUserLocation({ lat: res.lat, lon: res.lon });
        void startWatchingLocation();
      }
      return res;
    } finally {
      setIsLocating(false);
    }
  }, [startWatchingLocation]);

  useEffect(() => {
    void startWatchingLocation();
    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current();
        locationWatcherRef.current = null;
      }
    };
  }, [startWatchingLocation]);

  // Advanced Public-Sector Accessibility State (WCAG 2.2 AAA)
  const [contrastMode, setContrastModeState] = useState<ContrastMode>(loadInitialContrast);
  const [textSize, setTextSizeState] = useState<TextSize>(loadInitialTextSize);
  const [lineHeightMode, setLineHeightMode] = useState<LineHeightMode>('normal');
  const [letterSpacingMode, setLetterSpacingMode] = useState<LetterSpacingMode>('normal');
  const [fontFamilyMode, setFontFamilyMode] = useState<FontFamilyMode>('system');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(false);
  const [increasedSpacing, setIncreasedSpacing] = useState<boolean>(false);
  const [highlightLinks, setHighlightLinks] = useState<boolean>(false);
  const [readingRuler, setReadingRuler] = useState<boolean>(false);
  const [readingRulerY, setReadingRulerY] = useState<number>(240);
  const [readingMask, setReadingMask] = useState<boolean>(false);
  const [readingMaskY, setReadingMaskY] = useState<number>(260);
  const [accessibilityModalVisible, setAccessibilityModalVisible] = useState<boolean>(false);

  const setContrastMode = useCallback((mode: ContrastMode) => {
    setContrastModeState(mode);
    setCookie(COOKIE_CONTRAST, mode);
  }, []);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    setCookie(COOKIE_TEXT_SIZE, size);
  }, []);

  const cycleContrastMode = () => {
    const modes: ContrastMode[] = [
      'standard-light',
      'hc-yellow-black',
      'hc-black-yellow',
      'hc-white-black',
      'monochrome',
      'standard-dark',
    ];
    setContrastModeState((curr) => {
      const idx = modes.indexOf(curr);
      const next = modes[(idx + 1) % modes.length]!;
      setCookie(COOKIE_CONTRAST, next);
      return next;
    });
  };

  const decreaseTextSize = () => {
    setTextSizeState((curr) => {
      let next: TextSize = 'normal';
      if (curr === 'xxlarge') next = 'xlarge';
      else if (curr === 'xlarge') next = 'large';
      else if (curr === 'large') next = 'medium';
      else next = 'normal';
      setCookie(COOKIE_TEXT_SIZE, next);
      return next;
    });
  };

  const increaseTextSize = () => {
    setTextSizeState((curr) => {
      let next: TextSize = 'normal';
      if (curr === 'normal') next = 'medium';
      else if (curr === 'medium') next = 'large';
      else if (curr === 'large') next = 'xlarge';
      else next = 'xxlarge';
      setCookie(COOKIE_TEXT_SIZE, next);
      return next;
    });
  };

  const resetAccessibility = useCallback(() => {
    setContrastMode('standard-light');
    setTextSize('normal');
    setLineHeightMode('normal');
    setLetterSpacingMode('normal');
    setFontFamilyMode('system');
    setSpeechRate(1.0);
    setDyslexicFont(false);
    setIncreasedSpacing(false);
    setHighlightLinks(false);
    setReadingRuler(false);
    setReadingMask(false);
  }, [setContrastMode, setTextSize]);

  const addLocalReport = (
    description: string,
    extra?: {
      photoUrl?: string;
      category?: 'hole' | 'obstacle' | 'flood' | 'surface' | 'other';
      position?: { lat: number; lon: number };
    }
  ) => {
    const newReport: LocalReport = {
      id: `local-report-${Date.now()}`,
      description,
      createdAt: new Date().toISOString(),
      status: 'reported',
      photoUrl: extra?.photoUrl,
      category: extra?.category || 'obstacle',
      position: extra?.position,
      stillHereCount: 0,
      fixedCount: 0,
    };
    setLocalReports((prev) => [newReport, ...prev]);
  };

  const colors = useMemo(() => getColors(contrastMode), [contrastMode]);
  const isHighContrast = contrastMode.startsWith('hc-');
  const fontSize = useCallback((base: number) => scaleFontSize(base, textSize), [textSize]);
  const lineHeight = useCallback(
    (base: number) => getLineHeight(base, textSize, lineHeightMode),
    [textSize, lineHeightMode],
  );
  const letterSpacing = useMemo(() => getLetterSpacing(letterSpacingMode), [letterSpacingMode]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      profileId,
      setProfileId,
      customThresholds,
      setCustomThresholds,
      activeThresholds,
      updateActiveThresholds,
      toggleBlockedRoadType,
      setBlockedRoadTypes,
      pendingDestination,
      setPendingDestination,
      debugState,
      setDebugState: (fn: (prev: DebugState) => DebugState) => setDebugStateInternal(fn),
      localReports,
      addLocalReport,
      activeRouteReport,
      setActiveRouteReport,
      activeWalkingRoute,
      setActiveWalkingRoute,
      activeRouteFacts,
      setActiveRouteFacts,
      activeRouteIsSample,
      setActiveRouteIsSample,
      routeVariants,
      setRouteVariants,
      selectedRouteVariant,
      selectRouteVariant,
      activePlaceReport,
      setActivePlaceReport,
      barrierViewMode,
      setBarrierViewMode,
      userLocation,
      setUserLocation,
      isLocating,
      fetchUserLocation,
      // User Account (Mockup email account - zero server storage)
      userAccount,
      userModalVisible,
      setUserModalVisible,
      loginUser,
      logoutUser,
      // Backward compatibility aliases
      krakowCardUser: userAccount,
      krakowCardModalVisible: userModalVisible,
      setKrakowCardModalVisible: setUserModalVisible,
      loginWithKrakowCard: loginUser,
      logoutKrakowCard: logoutUser,
      // Accessibility
      contrastMode,
      setContrastMode,
      cycleContrastMode,
      textSize,
      setTextSize,
      decreaseTextSize,
      increaseTextSize,
      lineHeightMode,
      setLineHeightMode,
      letterSpacingMode,
      setLetterSpacingMode,
      fontFamilyMode,
      setFontFamilyMode,
      speechRate,
      setSpeechRate,
      dyslexicFont,
      setDyslexicFont,
      increasedSpacing,
      setIncreasedSpacing,
      highlightLinks,
      setHighlightLinks,
      readingRuler,
      setReadingRuler,
      readingRulerY,
      setReadingRulerY,
      readingMask,
      setReadingMask,
      readingMaskY,
      setReadingMaskY,
      accessibilityModalVisible,
      setAccessibilityModalVisible,
      resetAccessibility,
      colors,
      fontSize,
      lineHeight,
      letterSpacing,
      isHighContrast,
    }),
    [
      locale,
      setLocale,
      profileId,
      setProfileId,
      customThresholds,
      setCustomThresholds,
      activeThresholds,
      updateActiveThresholds,
      toggleBlockedRoadType,
      setBlockedRoadTypes,
      pendingDestination,
      setPendingDestination,
      debugState,
      localReports,
      activeRouteReport,
      activeWalkingRoute,
      activeRouteFacts,
      activeRouteIsSample,
      routeVariants,
      selectedRouteVariant,
      selectRouteVariant,
      activePlaceReport,
      barrierViewMode,
      setBarrierViewMode,
      userLocation,
      isLocating,
      fetchUserLocation,
      userAccount,
      userModalVisible,
      setUserModalVisible,
      loginUser,
      logoutUser,
      contrastMode,
      setContrastMode,
      textSize,
      setTextSize,
      lineHeightMode,
      letterSpacingMode,
      fontFamilyMode,
      speechRate,
      dyslexicFont,
      increasedSpacing,
      highlightLinks,
      readingRuler,
      readingRulerY,
      readingMask,
      readingMaskY,
      accessibilityModalVisible,
      resetAccessibility,
      colors,
      fontSize,
      lineHeight,
      letterSpacing,
      isHighContrast,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

import {
  city,
} from '@/config/city';
import {
  analyzeRoute,
  type BarrierThresholds,
  type Fact,
  type PlaceAnalysisReport,
  type ProfileId,
  type RouteReport,
  type WalkingRoute,
} from '@krakow-bez-barier/core';
import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { RouteVariant, RouteVariantId } from '@/services/api';

import type { Locale } from '@/i18n/strings';
import {
  getCurrentUserLocation,
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
  status: 'reported';
}

export interface DebugState {
  simulateOverpassDown: boolean;
  simulateMapyDown: boolean;
  simulateOffline: boolean;
}

interface SessionValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  profileId: ProfileId;
  setProfileId: (profileId: ProfileId) => void;
  customThresholds: BarrierThresholds;
  setCustomThresholds: (thresholds: BarrierThresholds) => void;
  activeThresholds: BarrierThresholds;
  toggleBlockedRoadType: (roadType: string) => void;
  setBlockedRoadTypes: (roadTypes: string[]) => void;
  debugState: DebugState;
  setDebugState: (updater: (prev: DebugState) => DebugState) => void;
  localReports: LocalReport[];
  addLocalReport: (description: string) => void;
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

  // Real user GPS location
  userLocation: UserCoordinates | null;
  setUserLocation: (loc: UserCoordinates | null) => void;
  isLocating: boolean;
  fetchUserLocation: () => Promise<UserLocationResult | null>;

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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('pl');
  const [profileId, setProfileId] = useState<ProfileId>('wheelchair');
  const [profileThresholds, setProfileThresholds] = useState<Record<ProfileId, BarrierThresholds>>({
    wheelchair: { ...city.profiles.wheelchair },
    custom: { ...city.profiles.custom },
  });
  const [customThresholds, setCustomThresholdsState] = useState<BarrierThresholds>(
    city.profiles.custom || city.profiles.wheelchair,
  );

  const activeThresholds = useMemo(() => {
    if (profileId === 'custom') return customThresholds;
    return profileThresholds[profileId] || city.profiles[profileId];
  }, [profileId, customThresholds, profileThresholds]);

  const setCustomThresholds = useCallback((thresholds: BarrierThresholds) => {
    setCustomThresholdsState(thresholds);
    setProfileThresholds((prev) => ({ ...prev, custom: thresholds }));
  }, []);

  const toggleBlockedRoadType = useCallback(
    (roadType: string) => {
      const norm = roadType.trim().toLowerCase();
      const currentBlocked = (
        activeThresholds.blockedRoadTypes ??
        activeThresholds.blockedSurfaces ??
        []
      ).map((s) => s.trim().toLowerCase());
      const newBlocked = currentBlocked.includes(norm)
        ? currentBlocked.filter((s) => s !== norm)
        : [...currentBlocked, norm];

      if (profileId === 'custom') {
        const updated: BarrierThresholds = {
          ...customThresholds,
          blockedRoadTypes: newBlocked,
          blockedSurfaces: newBlocked,
        };
        setCustomThresholds(updated);
      } else {
        setProfileThresholds((prev) => ({
          ...prev,
          [profileId]: {
            ...prev[profileId],
            blockedRoadTypes: newBlocked,
            blockedSurfaces: newBlocked,
          },
        }));
      }
    },
    [activeThresholds, profileId, customThresholds, setCustomThresholds],
  );

  const setBlockedRoadTypes = useCallback(
    (roadTypes: string[]) => {
      const newBlocked = roadTypes.map((s) => s.trim().toLowerCase());
      if (profileId === 'custom') {
        const updated: BarrierThresholds = {
          ...customThresholds,
          blockedRoadTypes: newBlocked,
          blockedSurfaces: newBlocked,
        };
        setCustomThresholds(updated);
      } else {
        setProfileThresholds((prev) => ({
          ...prev,
          [profileId]: {
            ...prev[profileId],
            blockedRoadTypes: newBlocked,
            blockedSurfaces: newBlocked,
          },
        }));
      }
    },
    [profileId, customThresholds, setCustomThresholds],
  );
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
    },
  ]);
  const [activeRouteReport, setActiveRouteReport] = useState<RouteReport | null>(null);
  const [activeWalkingRoute, setActiveWalkingRoute] = useState<WalkingRoute | null>(null);
  const [activeRouteFacts, setActiveRouteFacts] = useState<Fact[]>([]);
  const [activeRouteIsSample, setActiveRouteIsSample] = useState<boolean>(false);
  const [routeVariants, setRouteVariants] = useState<Record<RouteVariantId, RouteVariant> | null>(null);
  const [selectedRouteVariant, setSelectedRouteVariant] = useState<RouteVariantId>('accessible');
  const [activePlaceReport, setActivePlaceReport] = useState<PlaceAnalysisReport | null>(null);

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
    if (routeVariants) {
      const updatedAccessibleReport = analyzeRoute({
        routeId: routeVariants.accessible.report.routeId,
        profileId,
        routeCoordinates: routeVariants.accessible.walkingRoute.coordinates,
        facts: routeVariants.accessible.facts,
        config: city,
        thresholds: activeThresholds,
        isSample: routeVariants.accessible.isSample,
      });

      const updatedShortestReport = analyzeRoute({
        routeId: routeVariants.shortest.report.routeId,
        profileId,
        routeCoordinates: routeVariants.shortest.walkingRoute.coordinates,
        facts: routeVariants.shortest.facts,
        config: city,
        thresholds: activeThresholds,
        isSample: routeVariants.shortest.isSample,
      });

      const nextVariants: Record<RouteVariantId, RouteVariant> = {
        accessible: {
          ...routeVariants.accessible,
          report: updatedAccessibleReport,
        },
        shortest: {
          ...routeVariants.shortest,
          report: updatedShortestReport,
        },
      };

      setRouteVariants(nextVariants);

      const activeVar = nextVariants[selectedRouteVariant];
      if (activeVar) {
        setActiveWalkingRoute(activeVar.walkingRoute);
        setActiveRouteReport(activeVar.report);
        setActiveRouteFacts(activeVar.facts);
        setActiveRouteIsSample(activeVar.isSample);
      }
    } else if (activeWalkingRoute && activeRouteFacts && activeRouteFacts.length > 0) {
      const updated = analyzeRoute({
        routeId: activeRouteReport?.routeId ?? `route-${Date.now()}`,
        profileId,
        routeCoordinates: activeWalkingRoute.coordinates,
        facts: activeRouteFacts,
        config: city,
        thresholds: activeThresholds,
        isSample: activeRouteIsSample,
      });
      setActiveRouteReport(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, activeThresholds]);

  // User GPS location state
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const fetchUserLocation = useCallback(async (): Promise<UserLocationResult | null> => {
    setIsLocating(true);
    try {
      const res = await getCurrentUserLocation();
      if (res) {
        setUserLocation({ lat: res.lat, lon: res.lon });
      }
      return res;
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Advanced Public-Sector Accessibility State (WCAG 2.2 AAA)
  const [contrastMode, setContrastMode] = useState<ContrastMode>('standard-light');
  const [textSize, setTextSize] = useState<TextSize>('normal');
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

  const cycleContrastMode = () => {
    const modes: ContrastMode[] = [
      'standard-light',
      'hc-yellow-black',
      'hc-black-yellow',
      'hc-white-black',
      'monochrome',
      'standard-dark',
    ];
    setContrastMode((curr) => {
      const idx = modes.indexOf(curr);
      return modes[(idx + 1) % modes.length]!;
    });
  };

  const decreaseTextSize = () => {
    setTextSize((curr) => {
      if (curr === 'xxlarge') return 'xlarge';
      if (curr === 'xlarge') return 'large';
      if (curr === 'large') return 'medium';
      return 'normal';
    });
  };

  const increaseTextSize = () => {
    setTextSize((curr) => {
      if (curr === 'normal') return 'medium';
      if (curr === 'medium') return 'large';
      if (curr === 'large') return 'xlarge';
      return 'xxlarge';
    });
  };

  const resetAccessibility = () => {
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
  };

  const addLocalReport = (description: string) => {
    const newReport: LocalReport = {
      id: `local-report-${Date.now()}`,
      description,
      createdAt: new Date().toISOString(),
      status: 'reported',
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
      toggleBlockedRoadType,
      setBlockedRoadTypes,
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
      userLocation,
      setUserLocation,
      isLocating,
      fetchUserLocation,
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
      profileId,
      customThresholds,
      setCustomThresholds,
      activeThresholds,
      toggleBlockedRoadType,
      setBlockedRoadTypes,
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
      userLocation,
      isLocating,
      fetchUserLocation,
      contrastMode,
      textSize,
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

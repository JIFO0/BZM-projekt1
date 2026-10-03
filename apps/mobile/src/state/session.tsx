import {
  city,
} from '@/config/city';
import type {
  BarrierThresholds,
  PlaceAnalysisReport,
  ProfileId,
  RouteReport,
  WalkingRoute,
} from '@krakow-bez-barier/core';
import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

import type { Locale } from '@/i18n/strings';
import {
  getColors,
  scaleFontSize,
  type ContrastMode,
  type TextSize,
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
  debugState: DebugState;
  setDebugState: (updater: (prev: DebugState) => DebugState) => void;
  localReports: LocalReport[];
  addLocalReport: (description: string) => void;
  activeRouteReport: RouteReport | null;
  setActiveRouteReport: (report: RouteReport | null) => void;
  activeWalkingRoute: WalkingRoute | null;
  setActiveWalkingRoute: (route: WalkingRoute | null) => void;
  activePlaceReport: PlaceAnalysisReport | null;
  setActivePlaceReport: (report: PlaceAnalysisReport | null) => void;

  // Accessibility & Design System State
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  cycleContrastMode: () => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  cycleTextSize: () => void;
  decreaseTextSize: () => void;
  increaseTextSize: () => void;
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
  accessibilityModalVisible: boolean;
  setAccessibilityModalVisible: (val: boolean) => void;
  resetAccessibility: () => void;

  // Computed Theme Helpers
  colors: ThemeColors;
  fontSize: (base: number) => number;
  isHighContrast: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('pl');
  const [profileId, setProfileId] = useState<ProfileId>('wheelchair');
  const [customThresholds, setCustomThresholds] = useState<BarrierThresholds>(
    city.profiles.wheelchair,
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
  const [activePlaceReport, setActivePlaceReport] = useState<PlaceAnalysisReport | null>(null);

  // Accessibility State (WCAG 2.2 AAA Gov standards)
  const [contrastMode, setContrastMode] = useState<ContrastMode>('standard-light');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [dyslexicFont, setDyslexicFont] = useState<boolean>(false);
  const [increasedSpacing, setIncreasedSpacing] = useState<boolean>(false);
  const [highlightLinks, setHighlightLinks] = useState<boolean>(false);
  const [readingRuler, setReadingRuler] = useState<boolean>(false);
  const [readingRulerY, setReadingRulerY] = useState<number>(240);
  const [accessibilityModalVisible, setAccessibilityModalVisible] = useState<boolean>(false);

  const cycleContrastMode = () => {
    const modes: ContrastMode[] = [
      'standard-light',
      'hc-yellow-black',
      'hc-black-yellow',
      'hc-white-black',
      'standard-dark',
    ];
    setContrastMode((curr) => {
      const idx = modes.indexOf(curr);
      return modes[(idx + 1) % modes.length]!;
    });
  };

  const cycleTextSize = () => {
    const sizes: TextSize[] = ['normal', 'medium', 'large', 'xlarge'];
    setTextSize((curr) => {
      const idx = sizes.indexOf(curr);
      return sizes[(idx + 1) % sizes.length]!;
    });
  };

  const decreaseTextSize = () => {
    setTextSize((curr) => {
      if (curr === 'xlarge') return 'large';
      if (curr === 'large') return 'medium';
      return 'normal';
    });
  };

  const increaseTextSize = () => {
    setTextSize((curr) => {
      if (curr === 'normal') return 'medium';
      if (curr === 'medium') return 'large';
      return 'xlarge';
    });
  };

  const resetAccessibility = () => {
    setContrastMode('standard-light');
    setTextSize('normal');
    setDyslexicFont(false);
    setIncreasedSpacing(false);
    setHighlightLinks(false);
    setReadingRuler(false);
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

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      profileId,
      setProfileId,
      customThresholds,
      setCustomThresholds,
      debugState,
      setDebugState: (fn: (prev: DebugState) => DebugState) => setDebugStateInternal(fn),
      localReports,
      addLocalReport,
      activeRouteReport,
      setActiveRouteReport,
      activeWalkingRoute,
      setActiveWalkingRoute,
      activePlaceReport,
      setActivePlaceReport,
      // Accessibility
      contrastMode,
      setContrastMode,
      cycleContrastMode,
      textSize,
      setTextSize,
      cycleTextSize,
      decreaseTextSize,
      increaseTextSize,
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
      accessibilityModalVisible,
      setAccessibilityModalVisible,
      resetAccessibility,
      colors,
      fontSize,
      isHighContrast,
    }),
    [
      locale,
      profileId,
      customThresholds,
      debugState,
      localReports,
      activeRouteReport,
      activeWalkingRoute,
      activePlaceReport,
      contrastMode,
      textSize,
      dyslexicFont,
      increasedSpacing,
      highlightLinks,
      readingRuler,
      readingRulerY,
      accessibilityModalVisible,
      colors,
      fontSize,
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

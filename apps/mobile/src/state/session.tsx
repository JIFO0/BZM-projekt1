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
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Locale } from '@/i18n/strings';

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

  const addLocalReport = (description: string) => {
    const newReport: LocalReport = {
      id: `local-report-${Date.now()}`,
      description,
      createdAt: new Date().toISOString(),
      status: 'reported',
    };
    setLocalReports((prev) => [newReport, ...prev]);
  };

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
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

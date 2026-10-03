import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ProfileId } from '@krakow-bez-barier/core';

import type { Locale } from '@/i18n/strings';

interface SessionValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  profileId: ProfileId | null;
  setProfileId: (profileId: ProfileId) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('pl');
  const [profileId, setProfileId] = useState<ProfileId | null>(null);
  const value = useMemo(
    () => ({ locale, setLocale, profileId, setProfileId }),
    [locale, profileId],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

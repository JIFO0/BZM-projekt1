import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccessibilityModal } from '@/components/AccessibilityModal';
import { GlossaryModal } from '@/components/GlossaryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { UserAccountModal } from '@/components/UserAccountModal';
import { ReadingRuler } from '@/components/ReadingRuler';
import { SessionProvider, useSession } from '@/state/session';

function RootNavigatorInner() {
  const { colors, contrastMode } = useSession();

  const isDarkContent = contrastMode === 'standard-light' || contrastMode === 'hc-black-yellow';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'wcag-aaa-focus-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      *:focus-visible,
      [data-focusable="true"]:focus-visible,
      [tabindex]:focus-visible,
      button:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      a:focus-visible,
      [role="button"]:focus-visible,
      [role="tab"]:focus-visible,
      [role="radio"]:focus-visible {
        outline: 3px solid ${colors.focus} !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(0, 56, 101, 0.25) !important;
      }
    `;
  }, [colors.focus]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkContent ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'HarmonyOS accessible navigation' }} />
        <Stack.Screen name="search" options={{ headerShown: false, title: 'Wyszukiwarka tras i miejsc' }} />
        <Stack.Screen name="place" options={{ headerShown: false, title: 'Szczegóły miejsca' }} />
        <Stack.Screen name="route" options={{ headerShown: false, title: 'Raport trasy' }} />
        <Stack.Screen name="report-correction" options={{ headerShown: false, title: 'Zgłoś uwagę' }} />
        <Stack.Screen name="about" options={{ headerShown: false, title: 'O aplikacji' }} />
      </Stack>
      <AccessibilityModal />
      <GlossaryModal />
      <SettingsModal />
      <UserAccountModal />
      <ReadingRuler />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <RootNavigatorInner />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

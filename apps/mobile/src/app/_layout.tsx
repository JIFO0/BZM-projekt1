import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccessibilityModal } from '@/components/AccessibilityModal';
import { KrakowCardModal } from '@/components/KrakowCardModal';
import { ReadingRuler } from '@/components/ReadingRuler';
import { SessionProvider, useSession } from '@/state/session';

function RootNavigatorInner() {
  const { colors, contrastMode } = useSession();

  const isDarkContent = contrastMode === 'standard-light' || contrastMode === 'hc-black-yellow';

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
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Kraków bez barier' }} />
        <Stack.Screen name="search" options={{ headerShown: false, title: 'Wyszukiwarka tras i miejsc' }} />
        <Stack.Screen name="place" options={{ headerShown: false, title: 'Szczegóły miejsca' }} />
        <Stack.Screen name="route" options={{ headerShown: false, title: 'Raport trasy' }} />
        <Stack.Screen name="report-correction" options={{ headerShown: false, title: 'Zgłoś uwagę' }} />
        <Stack.Screen name="about" options={{ headerShown: false, title: 'O aplikacji' }} />
      </Stack>
      <AccessibilityModal />
      <KrakowCardModal />
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

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccessibilityModal } from '@/components/AccessibilityModal';
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
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <AccessibilityModal />
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

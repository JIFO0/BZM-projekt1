import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/state/session';

interface DemoBannerProps {
  isSample?: boolean;
}

export function DemoBanner({ isSample }: DemoBannerProps) {
  const { debugState } = useSession();

  const isSimulating =
    debugState.simulateOverpassDown || debugState.simulateMapyDown || debugState.simulateOffline;

  if (!isSample && !isSimulating) {
    return null;
  }

  let text = '';
  if (isSimulating) {
    const reasons: string[] = [];
    if (debugState.simulateOverpassDown) reasons.push('Awaria Overpass (503)');
    if (debugState.simulateMapyDown) reasons.push('Błąd Mapy.com (429)');
    if (debugState.simulateOffline) reasons.push('Wymuszony Offline');
    text = `AKTYWNA SYMULACJA AWARII: ${reasons.join(', ')} • Wyświetlono dane zapasowe`;
  } else if (isSample) {
    text = 'DANE PRZYKŁADOWE (Offline Demo Snapshot Kraków)';
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={text}
      style={[styles.banner, { backgroundColor: isSimulating ? '#B71C1C' : '#E65100' }]}
    >
      <Text style={styles.text}>⚠️ {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});

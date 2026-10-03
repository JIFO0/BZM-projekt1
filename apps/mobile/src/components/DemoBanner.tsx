import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/state/session';

interface DemoBannerProps {
  isSample?: boolean;
}

export function DemoBanner({ isSample }: DemoBannerProps) {
  const { debugState, fontSize, isHighContrast, colors } = useSession();

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

  const bgColor = isHighContrast
    ? colors.surface
    : isSimulating
      ? '#B71C1C'
      : '#D97706';
  const textColor = isHighContrast ? colors.text : '#FFFFFF';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={text}
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          borderColor: isHighContrast ? colors.border : 'transparent',
          borderWidth: isHighContrast ? 2 : 0,
        },
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize: fontSize(12.5) }]}>
        ⚠️ {text}
      </Text>
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
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

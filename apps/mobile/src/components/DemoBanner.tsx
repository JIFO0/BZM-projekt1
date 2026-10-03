import { StyleSheet, Text, View } from 'react-native';
import { Warning } from 'phosphor-react-native';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';

interface DemoBannerProps {
  isSample?: boolean;
}

export function DemoBanner({ isSample }: DemoBannerProps) {
  const { debugState, fontSize, isHighContrast, colors, locale } = useSession();

  const isSimulating =
    debugState.simulateOverpassDown || debugState.simulateMapyDown || debugState.simulateOffline;

  if (!isSample && !isSimulating) {
    return null;
  }

  let text = '';
  if (isSimulating) {
    const reasons: string[] = [];
    if (debugState.simulateOverpassDown) reasons.push(t(locale, 'simOverpassFailShort'));
    if (debugState.simulateMapyDown) reasons.push(t(locale, 'simMapyFailShort'));
    if (debugState.simulateOffline) reasons.push(t(locale, 'simOfflineShort'));
    text = `${t(locale, 'activeFailureSimulation')} ${reasons.join(', ')} • ${t(locale, 'fallbackDataDisplayed')}`;
  } else if (isSample) {
    text = t(locale, 'sampleDataBanner');
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
      <Warning size={16} weight="bold" color={textColor} />
      <Text style={[styles.text, { color: textColor, fontSize: fontSize(12.5) }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

import type { FactStatus, Severity } from '@krakow-bez-barier/core';
import { StyleSheet, Text, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';

interface StatusBadgeProps {
  status?: FactStatus;
  severity?: Severity;
  locale?: Locale;
}

export function StatusBadge({ status, severity, locale: propsLocale }: StatusBadgeProps) {
  const session = useSession();
  const colors = session.colors;
  const isHighContrast = session.isHighContrast;
  const fontSize = session.fontSize;
  const locale = propsLocale || session.locale;

  // Determine badge styling and label
  let icon = 'ℹ️';
  let label = '';
  let bg = colors.infoBg;
  let border = colors.infoBorder;
  let text = colors.infoText;

  if (severity) {
    switch (severity) {
      case 'blocker':
        icon = '⛔';
        label = t(locale, 'severityBlocker');
        bg = colors.blockerBg;
        border = colors.blockerBorder;
        text = colors.blockerText;
        break;
      case 'warning':
        icon = '⚠️';
        label = t(locale, 'severityWarning');
        bg = colors.warningBg;
        border = colors.warningBorder;
        text = colors.warningText;
        break;
      case 'ok':
        icon = '✅';
        label = t(locale, 'severityOk');
        bg = colors.okBg;
        border = colors.okBorder;
        text = colors.okText;
        break;
      case 'unknown':
        icon = '❓';
        label = t(locale, 'statusUnknown');
        bg = colors.unknownBg;
        border = colors.unknownBorder;
        text = colors.unknownText;
        break;
      case 'info':
        icon = 'ℹ️';
        label = t(locale, 'severityInfo');
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        break;
    }
  } else if (status) {
    switch (status) {
      case 'verified':
        icon = '🛡️';
        label = t(locale, 'statusVerified');
        bg = colors.okBg;
        border = colors.okBorder;
        text = colors.okText;
        break;
      case 'community':
        icon = '👥';
        label = t(locale, 'statusCommunity');
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        break;
      case 'reported':
        icon = '📝';
        label = t(locale, 'statusReported');
        bg = colors.warningBg;
        border = colors.warningBorder;
        text = colors.warningText;
        break;
      case 'conflicting':
        icon = '⚡';
        label = t(locale, 'statusConflicting');
        bg = colors.conflictingBg;
        border = colors.conflictingBorder;
        text = colors.conflictingText;
        break;
      case 'unknown':
        icon = '❓';
        label = t(locale, 'statusUnknown');
        bg = colors.unknownBg;
        border = colors.unknownBorder;
        text = colors.unknownText;
        break;
      default:
        icon = 'ℹ️';
        label = status;
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        break;
    }
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: fontSize(13) }]}>{icon}</Text>
      <Text style={[styles.text, { color: text, fontSize: fontSize(13) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 13,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

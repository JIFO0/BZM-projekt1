import type { FactStatus, Severity } from '@krakow-bez-barier/core';
import { StyleSheet, Text, View } from 'react-native';
import {
  CheckCircle,
  Info,
  Lightning,
  NotePencil,
  Prohibit,
  Question,
  ShieldCheck,
  Users,
  Warning,
} from 'phosphor-react-native';

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

  let label = '';
  let bg = colors.infoBg;
  let border = colors.infoBorder;
  let text = colors.infoText;
  let iconComponent = <Info size={14} weight="bold" color={text} />;

  if (severity) {
    switch (severity) {
      case 'blocker':
        label = t(locale, 'severityBlocker');
        bg = colors.blockerBg;
        border = colors.blockerBorder;
        text = colors.blockerText;
        iconComponent = <Prohibit size={14} weight="bold" color={text} />;
        break;
      case 'warning':
        label = t(locale, 'severityWarning');
        bg = colors.warningBg;
        border = colors.warningBorder;
        text = colors.warningText;
        iconComponent = <Warning size={14} weight="bold" color={text} />;
        break;
      case 'ok':
        label = t(locale, 'severityOk');
        bg = colors.okBg;
        border = colors.okBorder;
        text = colors.okText;
        iconComponent = <CheckCircle size={14} weight="bold" color={text} />;
        break;
      case 'unknown':
        label = t(locale, 'statusUnknown');
        bg = colors.unknownBg;
        border = colors.unknownBorder;
        text = colors.unknownText;
        iconComponent = <Question size={14} weight="bold" color={text} />;
        break;
      case 'info':
        label = t(locale, 'severityInfo');
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        iconComponent = <Info size={14} weight="bold" color={text} />;
        break;
    }
  } else if (status) {
    switch (status) {
      case 'verified':
        label = t(locale, 'statusVerified');
        bg = colors.okBg;
        border = colors.okBorder;
        text = colors.okText;
        iconComponent = <ShieldCheck size={14} weight="bold" color={text} />;
        break;
      case 'community':
        label = t(locale, 'statusCommunity');
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        iconComponent = <Users size={14} weight="bold" color={text} />;
        break;
      case 'reported':
        label = t(locale, 'statusReported');
        bg = colors.warningBg;
        border = colors.warningBorder;
        text = colors.warningText;
        iconComponent = <NotePencil size={14} weight="bold" color={text} />;
        break;
      case 'conflicting':
        label = t(locale, 'statusConflicting');
        bg = colors.conflictingBg;
        border = colors.conflictingBorder;
        text = colors.conflictingText;
        iconComponent = <Lightning size={14} weight="bold" color={text} />;
        break;
      case 'unknown':
        label = t(locale, 'statusUnknown');
        bg = colors.unknownBg;
        border = colors.unknownBorder;
        text = colors.unknownText;
        iconComponent = <Question size={14} weight="bold" color={text} />;
        break;
      default:
        label = status;
        bg = colors.infoBg;
        border = colors.infoBorder;
        text = colors.infoText;
        iconComponent = <Info size={14} weight="bold" color={text} />;
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
      {iconComponent}
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
  text: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

import type { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSession } from '@/state/session';

interface GovCardProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'blocker' | 'ok' | 'conflicting';
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
}

export function GovCard({
  children,
  variant = 'default',
  style,
  accessibilityRole = 'none',
  accessibilityLabel,
}: GovCardProps) {
  const { colors, isHighContrast, increasedSpacing } = useSession();

  let borderColor = colors.border;
  let stripeColor = colors.accent;
  let bgColor = colors.surface;

  switch (variant) {
    case 'accent':
      borderColor = isHighContrast ? colors.accent : colors.border;
      stripeColor = colors.accent;
      break;
    case 'warning':
      borderColor = isHighContrast ? colors.warningBorder : colors.warningBorder;
      stripeColor = colors.warningBorder;
      bgColor = isHighContrast ? colors.surface : colors.warningBg;
      break;
    case 'blocker':
      borderColor = isHighContrast ? colors.blockerBorder : colors.blockerBorder;
      stripeColor = colors.blockerBorder;
      bgColor = isHighContrast ? colors.surface : colors.blockerBg;
      break;
    case 'ok':
      borderColor = isHighContrast ? colors.okBorder : colors.okBorder;
      stripeColor = colors.okBorder;
      bgColor = isHighContrast ? colors.surface : colors.okBg;
      break;
    case 'conflicting':
      borderColor = isHighContrast ? colors.conflictingBorder : colors.conflictingBorder;
      stripeColor = colors.conflictingBorder;
      bgColor = isHighContrast ? colors.surface : colors.conflictingBg;
      break;
    case 'default':
    default:
      borderColor = colors.border;
      stripeColor = colors.accent;
      bgColor = colors.surface;
      break;
  }

  return (
    <View
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isHighContrast ? 2.5 : 1.5,
          padding: increasedSpacing ? 18 : 14,
        },
        style,
      ]}
    >
      {/* Accent left indicator stripe */}
      <View
        style={[
          styles.stripe,
          {
            backgroundColor: stripeColor,
          },
        ]}
      />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  stripe: {
    width: 5,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  inner: {
    flex: 1,
    paddingLeft: 6,
    gap: 8,
  },
});

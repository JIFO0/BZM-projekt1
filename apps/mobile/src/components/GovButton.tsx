import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

interface GovButtonProps {
  onPress: () => void;
  title?: string;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  icon?: string;
}

export function GovButton({
  onPress,
  title,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  icon,
}: GovButtonProps) {
  const { colors, isHighContrast, increasedSpacing, highlightLinks, fontSize } = useSession();

  const minHeight = increasedSpacing ? spacing.touchExpanded : spacing.touch;

  let bgColor = colors.accent;
  let textColor = colors.accentText;
  let borderColor = colors.accent;

  if (variant === 'secondary') {
    bgColor = isHighContrast ? colors.surface : colors.badgeBg;
    textColor = isHighContrast ? colors.text : colors.accent;
    borderColor = isHighContrast ? colors.border : colors.border;
  } else if (variant === 'outline') {
    bgColor = isHighContrast ? colors.background : colors.surface;
    textColor = colors.text;
    borderColor = colors.border;
  } else if (variant === 'danger') {
    bgColor = colors.blockerBg;
    textColor = colors.blockerText;
    borderColor = colors.blockerBorder;
  }

  if (disabled) {
    bgColor = isHighContrast ? '#333333' : colors.border;
    textColor = isHighContrast ? '#888888' : colors.muted;
    borderColor = isHighContrast ? '#555555' : colors.border;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          minHeight,
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isHighContrast ? 2.5 : 1.5,
          borderBottomWidth: highlightLinks ? 4 : isHighContrast ? 2.5 : 1.5,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Text style={[styles.iconText, { fontSize: fontSize(16) }]}>{icon}</Text> : null}
          {title ? (
            <Text
              style={[
                styles.buttonText,
                {
                  color: textColor,
                  fontSize: fontSize(15),
                  textDecorationLine: highlightLinks ? 'underline' : 'none',
                },
              ]}
            >
              {title}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  buttonText: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  iconText: {
    marginRight: 2,
  },
});

import {
  PathIcon as Path,
  Prohibit,
  Warning,
} from 'phosphor-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSession, type BarrierViewMode } from '@/state/session';
import { t } from '@/i18n/strings';

export interface BarrierViewControlProps {
  mode: BarrierViewMode;
  onChangeMode: (mode: BarrierViewMode) => void;
  routeBarriersCount?: number;
  allBarriersCount?: number;
  hasActiveRoute?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function BarrierViewControl({
  mode,
  onChangeMode,
  routeBarriersCount = 0,
  allBarriersCount = 0,
  hasActiveRoute = false,
  style,
  compact = false,
}: BarrierViewControlProps) {
  const { colors, isHighContrast, fontSize, locale } = useSession();

  const options: {
    id: BarrierViewMode;
    label: string;
    hint: string;
    count?: number;
    icon: (selected: boolean) => React.ReactNode;
  }[] = !hasActiveRoute
    ? [
        {
          id: 'none',
          label: t(locale, 'barrierModeNone'),
          hint: t(locale, 'barrierModeNoneHint'),
          icon: (selected) => (
            <Prohibit
              size={compact ? 15 : 17}
              weight="bold"
              color={selected ? colors.accentText : colors.muted}
            />
          ),
        },
        {
          id: 'all',
          label: t(locale, 'barrierModeAllBarriers'),
          hint: t(locale, 'barrierModeAllHint'),
          count: allBarriersCount > 0 ? allBarriersCount : undefined,
          icon: (selected) => (
            <Path
              size={compact ? 15 : 17}
              weight="bold"
              color={selected ? colors.accentText : colors.muted}
            />
          ),
        },
      ]
    : [
        {
          id: 'route',
          label: t(locale, 'barrierModeRoute'),
          hint: t(locale, 'barrierModeRouteHint'),
          count: routeBarriersCount,
          icon: (selected) => (
            <Warning
              size={compact ? 15 : 17}
              weight="bold"
              color={selected ? colors.accentText : colors.muted}
            />
          ),
        },
        {
          id: 'all',
          label: t(locale, 'barrierModeAll'),
          hint: t(locale, 'barrierModeAllHint'),
          count: allBarriersCount > 0 ? allBarriersCount : undefined,
          icon: (selected) => (
            <Path
              size={compact ? 15 : 17}
              weight="bold"
              color={selected ? colors.accentText : colors.muted}
            />
          ),
        },
        {
          id: 'none',
          label: t(locale, 'barrierModeNone'),
          hint: t(locale, 'barrierModeNoneHint'),
          icon: (selected) => (
            <Prohibit
              size={compact ? 15 : 17}
              weight="bold"
              color={selected ? colors.accentText : colors.muted}
            />
          ),
        },
      ];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t(locale, 'barrierViewModeLabel')}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isHighContrast ? colors.accent : colors.border,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = mode === opt.id;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${opt.label}. ${opt.hint}${
              opt.count !== undefined ? `. Liczba barier: ${opt.count}` : ''
            }`}
            onPress={() => onChangeMode(opt.id)}
            style={(state: any) => [
              styles.segment,
              compact && styles.segmentCompact,
              isSelected && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
              state?.focused && {
                borderColor: colors.focus,
                borderWidth: 2.5,
              },
            ]}
          >
            {opt.icon(isSelected)}
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                {
                  color: isSelected
                    ? (isHighContrast ? colors.accentText : colors.surface)
                    : colors.text,
                  fontSize: fontSize(compact ? 12 : 13),
                  fontWeight: isSelected ? '700' : '600',
                },
              ]}
            >
              {opt.label}
            </Text>

            {opt.count !== undefined ? (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.28)'
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    {
                      color: isSelected
                        ? (isHighContrast ? colors.accentText : colors.surface)
                        : colors.text,
                      fontSize: fontSize(10.5),
                    },
                  ]}
                >
                  {opt.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 3,
    gap: 3,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 5,
    minHeight: 44,
  },
  segmentCompact: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 44,
  },
  segmentText: {
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontWeight: '800',
  },
});

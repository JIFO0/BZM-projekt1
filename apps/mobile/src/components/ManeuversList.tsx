import { StyleSheet, Text, View } from 'react-native';
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowLeft,
  ArrowDownLeft,
  FlagBanner,
  ArrowsClockwise,
  NavigationArrow,
} from 'phosphor-react-native';
import type { AccessibleRouteResult } from '@krakow-bez-barier/sources';
import { useSession } from '@/state/session';
import { t, type Locale } from '@/i18n/strings';

interface ManeuversListProps {
  route: AccessibleRouteResult;
  locale: Locale;
}

export function ManeuversList({ route, locale }: ManeuversListProps) {
  const { colors, fontSize, isHighContrast } = useSession();
  const { instructions } = route;

  const getSignIcon = (sign: number, color: string) => {
    switch (sign) {
      case 0:
        return <ArrowUp size={20} color={color} weight="bold" />;
      case 1:
        return <ArrowUpRight size={20} color={color} weight="bold" />;
      case 2:
        return <ArrowRight size={20} color={color} weight="bold" />;
      case 3:
        return <ArrowDownRight size={20} color={color} weight="bold" />;
      case -1:
        return <ArrowUpLeft size={20} color={color} weight="bold" />;
      case -2:
        return <ArrowLeft size={20} color={color} weight="bold" />;
      case -3:
        return <ArrowDownLeft size={20} color={color} weight="bold" />;
      case 4:
        return <FlagBanner size={20} color={color} weight="fill" />;
      case 6:
        return <ArrowsClockwise size={20} color={color} weight="bold" />;
      default:
        return <NavigationArrow size={20} color={color} weight="bold" />;
    }
  };

  if (!instructions || instructions.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: isHighContrast ? 2.5 : 1.5,
          },
        ]}
      >
        <Text style={[styles.body, { color: colors.text, fontSize: fontSize(14) }]}>
          {t(locale, 'noDetailedManeuvers')}
        </Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="list" style={styles.container}>
      {instructions.map((maneuver, index) => {
        const timeMin = Math.ceil(maneuver.timeSeconds / 60);

        return (
          <View
            key={maneuver.id}
            accessibilityRole="text"
            accessibilityLabel={`${index + 1}. ${maneuver.text}. ${t(locale, 'distanceLabel')}: ${maneuver.distanceMeters} m.`}
            style={[
              styles.itemCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            <View
              style={[
                styles.signBadge,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: isHighContrast ? 2.5 : 1.5,
                },
              ]}
            >
              {getSignIcon(maneuver.sign, colors.accent)}
            </View>

            <View style={styles.textContent}>
              <Text
                style={[
                  styles.maneuverText,
                  { color: colors.text, fontSize: fontSize(15) },
                ]}
              >
                {maneuver.text}
              </Text>
              {maneuver.streetName ? (
                <Text
                  style={[
                    styles.streetName,
                    { color: colors.muted, fontSize: fontSize(13) },
                  ]}
                >
                  {maneuver.streetName}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.metaText,
                  { color: colors.muted, fontSize: fontSize(12) },
                ]}
              >
                {maneuver.distanceMeters} m {maneuver.timeSeconds > 0 ? `(~${timeMin} min)` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  signBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  maneuverText: {
    fontWeight: '700',
    lineHeight: 20,
  },
  streetName: {
    fontWeight: '500',
  },
  metaText: {},
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  body: {},
});

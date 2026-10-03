import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import type { AccessibleRouteResult } from '@krakow-bez-barier/sources';
import { darkColors, lightColors } from '@/theme/tokens';
import type { Locale } from '@/i18n/strings';

interface ManeuversListProps {
  route: AccessibleRouteResult;
  locale: Locale;
}

export function ManeuversList({ route, locale }: ManeuversListProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { instructions } = route;

  const getSignSymbol = (sign: number) => {
    switch (sign) {
      case 0:
        return '↑'; // straight
      case 1:
        return '↗'; // slight right
      case 2:
        return '→'; // right
      case 3:
        return '↘'; // sharp right
      case -1:
        return '↖'; // slight left
      case -2:
        return '←'; // left
      case -3:
        return '↙'; // sharp left
      case 4:
        return '🏁'; // destination
      case 6:
        return '🔄'; // roundabout
      default:
        return '•';
    }
  };

  if (!instructions || instructions.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.body, { color: colors.text }]}>
          {locale === 'pl' ? 'Brak szczegółowych manewrów.' : 'No detailed maneuvers.'}
        </Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="list" style={styles.container}>
      {instructions.map((maneuver, index) => {
        const symbol = getSignSymbol(maneuver.sign);
        const timeMin = Math.ceil(maneuver.timeSeconds / 60);

        return (
          <View
            key={maneuver.id}
            accessibilityRole="text"
            accessibilityLabel={`${index + 1}. ${maneuver.text}. Dystans: ${maneuver.distanceMeters} metrów.`}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.signBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.signText, { color: colors.text }]}>{symbol}</Text>
            </View>

            <View style={styles.textContent}>
              <Text style={[styles.maneuverText, { color: colors.text }]}>{maneuver.text}</Text>
              {maneuver.streetName ? (
                <Text style={[styles.streetName, { color: colors.muted }]}>{maneuver.streetName}</Text>
              ) : null}
              <Text style={[styles.metaText, { color: colors.muted }]}>
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
    borderWidth: 2,
    gap: 12,
  },
  signBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signText: {
    fontSize: 18,
    fontWeight: '700',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  maneuverText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  streetName: {
    fontSize: 13,
    fontWeight: '500',
  },
  metaText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  body: {
    fontSize: 14,
  },
});

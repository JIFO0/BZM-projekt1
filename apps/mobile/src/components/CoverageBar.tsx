import type { CoverageStat } from '@krakow-bez-barier/core';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { darkColors, lightColors } from '@/theme/tokens';

interface CoverageBarProps {
  stat: CoverageStat;
}

export function CoverageBar({ stat }: CoverageBarProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const pct = stat.ratio !== null ? Math.round(stat.ratio * 100) : 0;
  const ratioText =
    stat.ratio !== null ? `${pct}% (${stat.known}/${stat.total})` : 'brak punktów pomiarowych';

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Pokrycie parametru ${stat.criterion}: ${ratioText}`}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{stat.criterion}</Text>
        <Text style={[styles.ratio, { color: colors.muted }]}>{ratioText}</Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: pct >= 80 ? colors.okBorder : pct >= 40 ? colors.warningBorder : colors.blockerBorder,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratio: {
    fontSize: 13,
    fontWeight: '500',
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

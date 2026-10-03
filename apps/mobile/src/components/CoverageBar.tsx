import type { CoverageStat } from '@krakow-bez-barier/core';
import { StyleSheet, Text, View } from 'react-native';

import { getLocalizedCoverageCriterion, t } from '@/i18n/strings';
import { useSession } from '@/state/session';

interface CoverageBarProps {
  stat: CoverageStat;
}

export function CoverageBar({ stat }: CoverageBarProps) {
  const { colors, fontSize, isHighContrast, locale } = useSession();

  const pct = stat.ratio !== null ? Math.round(stat.ratio * 100) : 0;
  const ratioText =
    stat.ratio !== null
      ? `${pct}% (${stat.known}/${stat.total})`
      : t(locale, 'noMeasurementPoints');

  const localizedCriterion = getLocalizedCoverageCriterion(stat.criterion, locale);

  const fillColor =
    pct >= 80 ? colors.okBorder : pct >= 40 ? colors.warningBorder : colors.blockerBorder;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${t(locale, 'coverageParam')} ${localizedCriterion}: ${ratioText}`}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text, fontSize: fontSize(14) }]}>
          {localizedCriterion}
        </Text>
        <Text style={[styles.ratio, { color: colors.muted, fontSize: fontSize(13) }]}>
          {ratioText}
        </Text>
      </View>
      <View
        style={[
          styles.barBg,
          {
            backgroundColor: isHighContrast ? '#333333' : colors.border,
            borderColor: colors.border,
            borderWidth: isHighContrast ? 1 : 0,
          },
        ]}
      >
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  ratio: {
    fontWeight: '600',
  },
  barBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
});

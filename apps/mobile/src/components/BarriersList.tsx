import { credibilityFromSource } from '@krakow-bez-barier/core';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import type { AccessibleRouteResult, RouteBarrier } from '@krakow-bez-barier/sources';
import { darkColors, lightColors } from '@/theme/tokens';
import {
  getLocalizedBarrierMessage,
  getLocalizedFactValue,
  getLocalizedFindingType,
  t,
  type Locale,
} from '@/i18n/strings';
import { CredibilityNote, sourceWithCredit } from './CredibilityNote';

interface BarriersListProps {
  route: AccessibleRouteResult;
  locale: Locale;
}

export function BarriersList({ route, locale }: BarriersListProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const { barriers, summary } = route;

  const honestyNoteText = summary.honestyNote.includes('Nie znaleziono')
    ? t(locale, 'noBarriersFound')
    : t(locale, 'caveatNotice');

  const getStatusBadge = (status: RouteBarrier['status']) => {
    switch (status) {
      case 'verified':
        return { label: t(locale, 'statusVerified'), bg: '#1B5E20', text: '#FFFFFF' };
      case 'community':
        return { label: t(locale, 'statusCommunity'), bg: '#0D47A1', text: '#FFFFFF' };
      case 'reported':
        return { label: t(locale, 'statusReported'), bg: '#E65100', text: '#FFFFFF' };
      case 'unknown':
        return { label: t(locale, 'statusUnknown'), bg: '#37474F', text: '#FFFFFF' };
      case 'conflicting':
        return { label: t(locale, 'statusConflicting'), bg: '#B71C1C', text: '#FFFFFF' };
      default:
        return { label: status, bg: colors.border, text: colors.text };
    }
  };

  const getSeverityBadge = (severity: RouteBarrier['severity']) => {
    switch (severity) {
      case 'blocker':
        return { label: t(locale, 'severityBlocker'), bg: colors.blockerBorder, text: colors.surface };
      case 'warning':
        return { label: t(locale, 'severityWarning'), bg: colors.warningBorder, text: colors.surface };
      case 'unknown':
        return { label: t(locale, 'statusUnknown'), bg: colors.unknownBorder, text: colors.surface };
      case 'ok':
        return { label: t(locale, 'severityOk'), bg: colors.okBorder, text: colors.surface };
      default:
        return { label: severity, bg: colors.border, text: colors.text };
    }
  };

  return (
    <View style={styles.container}>
      {/* Honesty & Coverage Alert Banner */}
      <View
        accessibilityRole="alert"
        style={[
          styles.honestyCard,
          {
            backgroundColor: summary.blockerCount > 0 ? colors.blockerBg : colors.warningBg,
            borderColor: summary.blockerCount > 0 ? colors.blockerBorder : colors.warningBorder,
          },
        ]}
      >
        <Text style={[styles.honestyTitle, { color: summary.blockerCount > 0 ? colors.blockerText : colors.warningText }]}>
          {honestyNoteText}
        </Text>
        {summary.coverageRatio !== null && (
          <Text style={[styles.coverageText, { color: colors.text }]}>
            {t(locale, 'dataCoverage')}: {Math.round(summary.coverageRatio * 100)}%
          </Text>
        )}
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.blockerText }]}>{summary.blockerCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t(locale, 'blockersCount')}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.warningText }]}>{summary.warningCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t(locale, 'warningsCount')}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{summary.unknownCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.muted }]}>{t(locale, 'unknownCount')}</Text>
        </View>
      </View>

      {/* Barrier List */}
      {barriers.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.text }]}>{t(locale, 'noBarriersFound')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {barriers.map((barrier) => {
            const statusB = getStatusBadge(barrier.status);
            const severityB = getSeverityBadge(barrier.severity);
            const localizedCrit = getLocalizedFindingType(barrier.criterion, locale);
            const localizedVal = getLocalizedFactValue(barrier.value, locale, barrier.criterion);
            const localizedMsg = getLocalizedBarrierMessage(barrier, locale) || barrier.message;
            const credibility = credibilityFromSource({
              name: barrier.source.name,
              licence: barrier.source.licence,
              status: barrier.status,
            });
            const sourceLine = sourceWithCredit(barrier.source.name, barrier.source.licence);

            return (
              <View
                key={barrier.id}
                accessibilityRole="text"
                accessibilityLabel={`${localizedCrit}: ${localizedVal}. ${localizedMsg}. Status: ${statusB.label}`}
                style={[styles.barrierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: severityB.bg }]}>
                    <Text style={[styles.badgeText, { color: severityB.text }]}>{severityB.label}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusB.bg }]}>
                    <Text style={[styles.badgeText, { color: statusB.text }]}>{statusB.label}</Text>
                  </View>
                  <Text style={[styles.distanceText, { color: colors.muted }]}>
                    {barrier.distanceFromStartMeters} m
                  </Text>
                </View>

                <Text style={[styles.criterionTitle, { color: colors.text }]}>
                  {localizedCrit}: <Text style={{ fontWeight: '400' }}>{localizedVal}</Text>
                </Text>

                <Text style={[styles.body, { color: colors.text }]}>{localizedMsg}</Text>

                <CredibilityNote assessment={credibility} locale={locale} />

                <View style={styles.footerRow}>
                  <Text style={[styles.sourceText, { color: colors.muted }]}>
                    {t(locale, 'source')}: {sourceLine}
                    {barrier.source.licence ? ` (${barrier.source.licence})` : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  honestyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
  },
  honestyTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  coverageText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  list: {
    gap: 10,
  },
  barrierCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  distanceText: {
    fontSize: 12,
    marginLeft: 'auto',
    fontWeight: '600',
  },
  criterionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 6,
    marginTop: 4,
  },
  sourceText: {
    fontSize: 11,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
});

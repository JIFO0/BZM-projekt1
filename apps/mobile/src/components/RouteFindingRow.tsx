import { credibilityFromSource, dateLabel, type RouteFinding } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';

import {
  getLocalizedFactValue,
  getLocalizedFindingType,
  t,
  type Locale,
} from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';
import { CredibilityNote, credibilityLabel, sourceWithCredit } from './CredibilityNote';
import { StatusBadge } from './StatusBadge';

interface RouteFindingRowProps {
  finding: RouteFinding;
  index: number;
  locale: Locale;
}

export function RouteFindingRow({ finding, index, locale }: RouteFindingRowProps) {
  const { colors, fontSize, isHighContrast, highlightLinks } = useSession();
  const [expanded, setExpanded] = useState(false);

  const { fact, severity, distanceFromStartMetres, type } = finding;
  const dl = dateLabel(fact);

  let dateText = '';
  if (dl.kind === 'confirmed' && dl.at) {
    dateText = `${t(locale, 'dateConfirmed')}: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'osm_last_edit' && dl.at) {
    dateText = `${t(locale, 'dateOsmEdit')}: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'retrieved' && dl.at) {
    dateText = `${t(locale, 'dateRetrieved')}: ${dl.at.slice(0, 10)}`;
  } else {
    dateText = t(locale, 'noVerificationDate');
  }

  const localizedVal = getLocalizedFactValue(fact.value, locale);
  const localizedCrit = getLocalizedFindingType(fact.criterion, locale);
  const localizedType = getLocalizedFindingType(type, locale);
  const localizedSeverity =
    severity === 'blocker'
      ? t(locale, 'severityBlocker')
      : severity === 'warning'
        ? t(locale, 'severityWarning')
        : severity === 'ok'
          ? t(locale, 'severityOk')
          : t(locale, 'statusUnknown');

  const credibility = credibilityFromSource({
    name: fact.source.name,
    licence: fact.source.licence,
    status: fact.status,
    hasAuditDate: Boolean(fact.lastConfirmedAt),
  });
  const sourceLine = sourceWithCredit(fact.source.name, fact.source.licence);
  const indexLabel = `${t(locale, 'credibilityIndex')} ${credibility.score} · ${credibilityLabel(locale, credibility.rank)}`;

  // Narrative for screen readers (WCAG D1 & D5)
  const accessibleNarrative =
    locale === 'pl'
      ? `Punkt ${index + 1}. Po ${distanceFromStartMetres} metrach: ${localizedCrit}, ${localizedVal}. Status: ${localizedSeverity}. Źródło: ${sourceLine}, ${dateText}. ${indexLabel}.`
      : locale === 'uk'
        ? `Пункт ${index + 1}. Через ${distanceFromStartMetres} метрів: ${localizedCrit}, ${localizedVal}. Статус: ${localizedSeverity}. Джерело: ${sourceLine}, ${dateText}. ${indexLabel}.`
        : `Point ${index + 1}. After ${distanceFromStartMetres} metres: ${localizedCrit}, ${localizedVal}. Status: ${localizedSeverity}. Source: ${sourceLine}, ${dateText}. ${indexLabel}.`;

  const borderColor =
    severity === 'blocker'
      ? colors.blockerBorder
      : severity === 'warning'
        ? colors.warningBorder
        : colors.border;

  const localizedStatus =
    fact.status === 'verified'
      ? t(locale, 'statusVerified')
      : fact.status === 'community'
        ? t(locale, 'statusCommunity')
        : fact.status === 'reported'
          ? t(locale, 'statusReported')
          : fact.status === 'conflicting'
            ? t(locale, 'statusConflicting')
            : t(locale, 'statusUnknown');

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibleNarrative}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.distanceBadge}>
          <Text style={[styles.indexText, { color: colors.accent, fontSize: fontSize(15) }]}>
            #{index + 1}
          </Text>
          <Text style={[styles.distanceText, { color: colors.text, fontSize: fontSize(14) }]}>
            {t(locale, 'afterDistance')} {distanceFromStartMetres} m
          </Text>
        </View>
        <StatusBadge severity={severity} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text, fontSize: fontSize(16) }]}>
        {localizedVal}
      </Text>

      <Text style={[styles.evidenceText, { color: colors.muted, fontSize: fontSize(13) }]}>
        {t(locale, 'criterion')}: {localizedCrit} • {localizedType}
      </Text>

      <CredibilityNote assessment={credibility} locale={locale} />

      <View style={[styles.sourceRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.sourceText, { color: colors.muted, fontSize: fontSize(12.5) }]}>
          {t(locale, 'source')}: {sourceLine} ({dateText})
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'whyThisStatus')}, punkt ${index + 1}`}
          onPress={() => setExpanded(!expanded)}
          style={[styles.expandButton, { minHeight: spacing.touch - 10 }]}
        >
          <Text
            style={[
              styles.expandText,
              {
                color: colors.accent,
                fontSize: fontSize(13),
                textDecorationLine: highlightLinks ? 'underline' : 'none',
              },
            ]}
          >
            {expanded ? t(locale, 'hideDetails') : t(locale, 'whyThisStatus')}
          </Text>
          {expanded ? (
            <CaretUp size={14} weight="bold" color={colors.accent} />
          ) : (
            <CaretDown size={14} weight="bold" color={colors.accent} />
          )}
        </Pressable>
      </View>

      {expanded ? (
        <View
          style={[
            styles.detailsBox,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 1.5 : 1,
            },
          ]}
        >
          <Text style={[styles.detailTitle, { color: colors.text, fontSize: fontSize(13.5) }]}>
            {t(locale, 'evidenceDetails')}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • {t(locale, 'objectId')}: {fact.source.objectId ?? fact.subject.ref}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • {t(locale, 'credibilityStatus')}: {localizedStatus}
          </Text>
          {fact.status === 'community' && !fact.lastConfirmedAt ? (
            <Text style={[styles.detailItem, { color: colors.muted, fontSize: fontSize(13) }]}>
              • {t(locale, 'credibilityCaveatOsmEdit')}
            </Text>
          ) : null}
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • {t(locale, 'dataLicense')}: {fact.source.licence}
          </Text>
          {fact.matchConfidence !== undefined ? (
            <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
              • {t(locale, 'geometricMatchConfidence')}: {Math.round(fact.matchConfidence * 100)}%
            </Text>
          ) : null}
          <Text style={[styles.detailItem, { color: colors.muted, fontSize: fontSize(12) }]}>
            {t(locale, 'sourceUrl')}: {fact.source.url}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexText: {
    fontWeight: '900',
  },
  distanceText: {
    fontWeight: '700',
  },
  valueText: {
    fontWeight: '700',
    lineHeight: 22,
  },
  evidenceText: {
    fontWeight: '500',
  },
  sourceRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  sourceText: {
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  expandText: {
    fontWeight: '700',
  },
  detailsBox: {
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginTop: 6,
  },
  detailTitle: {
    fontWeight: '800',
    marginBottom: 2,
  },
  detailItem: {
    lineHeight: 18,
    fontWeight: '500',
  },
});

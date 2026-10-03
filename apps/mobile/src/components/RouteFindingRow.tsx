import { dateLabel, type RouteFinding } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';
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
    dateText = `potwierdzono: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'osm_last_edit' && dl.at) {
    dateText = `ostatnia edycja OSM: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'retrieved' && dl.at) {
    dateText = `pobrano: ${dl.at.slice(0, 10)}`;
  } else {
    dateText = 'brak daty weryfikacji';
  }

  // Narrative for screen readers (WCAG D1 & D5)
  const accessibleNarrative = `Punkt ${index + 1}. Po ${distanceFromStartMetres} metrach: ${
    fact.criterion
  }, ${fact.value}. Status: ${severity}. Źródło: ${fact.source.name}, ${dateText}.`;

  const borderColor =
    severity === 'blocker'
      ? colors.blockerBorder
      : severity === 'warning'
        ? colors.warningBorder
        : colors.border;

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
            Po {distanceFromStartMetres} m
          </Text>
        </View>
        <StatusBadge severity={severity} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text, fontSize: fontSize(16) }]}>
        {finding.fact.value}
      </Text>

      <Text style={[styles.evidenceText, { color: colors.muted, fontSize: fontSize(13) }]}>
        Kryterium: {fact.criterion} • {type}
      </Text>

      <View style={[styles.sourceRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.sourceText, { color: colors.muted, fontSize: fontSize(12.5) }]}>
          Źródło: {fact.source.name} ({dateText})
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
            {expanded ? 'Ukryj szczegóły' : 'Dlaczego ten status?'}
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
            Szczegóły dowodowe z OpenStreetMap:
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • Identyfikator obiektu: {fact.source.objectId ?? fact.subject.ref}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • Status wiarygodności: {fact.status}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • Licencja danych: {fact.source.licence}
          </Text>
          {fact.matchConfidence !== undefined ? (
            <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
              • Pewność dopasowania geometrycznego: {Math.round(fact.matchConfidence * 100)}%
            </Text>
          ) : null}
          <Text style={[styles.detailItem, { color: colors.muted, fontSize: fontSize(12) }]}>
            URL źródła: {fact.source.url}
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

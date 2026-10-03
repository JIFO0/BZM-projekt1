import { dateLabel, type RouteFinding } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { darkColors, lightColors, spacing } from '@/theme/tokens';
import { StatusBadge } from './StatusBadge';

interface RouteFindingRowProps {
  finding: RouteFinding;
  index: number;
  locale: Locale;
}

export function RouteFindingRow({ finding, index, locale }: RouteFindingRowProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
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

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibleNarrative}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor:
            severity === 'blocker'
              ? colors.blockerBorder
              : severity === 'warning'
                ? colors.warningBorder
                : colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.distanceBadge}>
          <Text style={[styles.indexText, { color: colors.accent }]}>#{index + 1}</Text>
          <Text style={[styles.distanceText, { color: colors.text }]}>
            Po {distanceFromStartMetres} m
          </Text>
        </View>
        <StatusBadge severity={severity} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text }]}>{finding.fact.value}</Text>

      <Text style={[styles.evidenceText, { color: colors.muted }]}>
        Kryterium: {fact.criterion} • {type}
      </Text>

      <View style={styles.sourceRow}>
        <Text style={[styles.sourceText, { color: colors.muted }]}>
          Źródło: {fact.source.name} ({dateText})
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(locale, 'whyThisStatus')}, punkt ${index + 1}`}
          onPress={() => setExpanded(!expanded)}
          style={[styles.expandButton, { minHeight: spacing.touch }]}
        >
          <Text style={[styles.expandText, { color: colors.accent }]}>
            {expanded ? 'Ukryj szczegóły ▲' : 'Dlaczego ten status? ▼'}
          </Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={[styles.detailsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>Szczegóły dowodowe z OpenStreetMap:</Text>
          <Text style={[styles.detailItem, { color: colors.text }]}>
            • Identyfikator obiektu: {fact.source.objectId ?? fact.subject.ref}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text }]}>
            • Status wiarygodności: {fact.status}
          </Text>
          <Text style={[styles.detailItem, { color: colors.text }]}>
            • Licencja danych: {fact.source.licence}
          </Text>
          {fact.matchConfidence !== undefined ? (
            <Text style={[styles.detailItem, { color: colors.text }]}>
              • Pewność dopasowania geometrycznego: {Math.round(fact.matchConfidence * 100)}%
            </Text>
          ) : null}
          <Text style={[styles.detailItem, { color: colors.muted }]}>
            URL źródła: {fact.source.url}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexText: {
    fontSize: 16,
    fontWeight: '800',
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  evidenceText: {
    fontSize: 14,
  },
  sourceRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 6,
  },
  sourceText: {
    fontSize: 13,
  },
  expandButton: {
    justifyContent: 'center',
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    marginTop: 6,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailItem: {
    fontSize: 13,
    lineHeight: 18,
  },
});

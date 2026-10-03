import { dateLabel, type Fact } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { darkColors, lightColors, spacing } from '@/theme/tokens';
import { StatusBadge } from './StatusBadge';

interface FactRowProps {
  fact: Fact;
  locale: Locale;
}

export function FactRow({ fact, locale }: FactRowProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const [expanded, setExpanded] = useState(false);

  const dl = dateLabel(fact);
  let dateText = '';
  if (dl.kind === 'confirmed' && dl.at) {
    dateText = `potwierdzono: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'osm_last_edit' && dl.at) {
    dateText = `ostatnia edycja OSM: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'retrieved' && dl.at) {
    dateText = `pobrano: ${dl.at.slice(0, 10)}`;
  } else {
    dateText = 'brak daty';
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${fact.criterion}: ${fact.value}. Status: ${fact.status}. Źródło: ${fact.source.name}, ${dateText}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: fact.status === 'conflicting' ? colors.conflictingBorder : colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.criterionText, { color: colors.accent }]}>{fact.criterion}</Text>
        <StatusBadge status={fact.status} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text }]}>{fact.value}</Text>

      <View style={styles.footerRow}>
        <Text style={[styles.sourceText, { color: colors.muted }]}>
          {fact.source.name} • {dateText}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'whyThisStatus')}
          onPress={() => setExpanded(!expanded)}
          style={[styles.expandButton, { minHeight: spacing.touch }]}
        >
          <Text style={[styles.expandText, { color: colors.accent }]}>
            {expanded ? 'Mniej ▲' : 'Dlaczego taki status? ▼'}
          </Text>
        </Pressable>
      </View>

      {expanded ? (
        <View style={[styles.detailsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.detailItem, { color: colors.text }]}>
            • Obiekt: {fact.source.objectId ?? fact.subject.ref} ({fact.subject.type})
          </Text>
          <Text style={[styles.detailItem, { color: colors.text }]}>
            • Licencja: {fact.source.licence}
          </Text>
          {fact.lastConfirmedAt ? (
            <Text style={[styles.detailItem, { color: colors.okBorder }]}>
              • Data potwierdzenia (check_date): {fact.lastConfirmedAt}
            </Text>
          ) : (
            <Text style={[styles.detailItem, { color: colors.muted }]}>
              • Brak tagu potwierdzenia (check_date). Data edycji nie jest datą weryfikacji.
            </Text>
          )}
          {fact.matchConfidence !== undefined ? (
            <Text style={[styles.detailItem, { color: colors.text }]}>
              • Pewność dopasowania do miejsca: {Math.round(fact.matchConfidence * 100)}%
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  criterionText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 6,
  },
  sourceText: {
    fontSize: 13,
  },
  expandButton: {
    justifyContent: 'center',
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    gap: 4,
    marginTop: 4,
  },
  detailItem: {
    fontSize: 13,
    lineHeight: 18,
  },
});

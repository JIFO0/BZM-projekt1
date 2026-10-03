import { dateLabel, type Fact } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';
import { StatusBadge } from './StatusBadge';

interface FactRowProps {
  fact: Fact;
  locale: Locale;
}

export function FactRow({ fact, locale }: FactRowProps) {
  const { colors, fontSize, isHighContrast, highlightLinks } = useSession();
  const [expanded, setExpanded] = useState(false);

  const dl = dateLabel(fact);
  let dateText = '';
  if (dl.kind === 'confirmed' && dl.at) {
    dateText = `${t(locale, 'dateConfirmed')}: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'osm_last_edit' && dl.at) {
    dateText = `${t(locale, 'dateOsmEdit')}: ${dl.at.slice(0, 10)}`;
  } else if (dl.kind === 'retrieved' && dl.at) {
    dateText = `${t(locale, 'dateRetrieved')}: ${dl.at.slice(0, 10)}`;
  } else {
    dateText = t(locale, 'noDate');
  }

  const a11yLabel =
    locale === 'pl'
      ? `${fact.criterion}: ${fact.value}. Status: ${fact.status}. Źródło: ${fact.source.name}, ${dateText}`
      : locale === 'uk'
        ? `${fact.criterion}: ${fact.value}. Статус: ${fact.status}. Джерело: ${fact.source.name}, ${dateText}`
        : `${fact.criterion}: ${fact.value}. Status: ${fact.status}. Source: ${fact.source.name}, ${dateText}`;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: fact.status === 'conflicting' ? colors.conflictingBorder : colors.border,
          borderWidth: isHighContrast ? 2.5 : 1.5,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.criterionText, { color: colors.accent, fontSize: fontSize(13.5) }]}>
          {fact.criterion}
        </Text>
        <StatusBadge status={fact.status} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text, fontSize: fontSize(16) }]}>
        {fact.value}
      </Text>

      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.sourceText, { color: colors.muted, fontSize: fontSize(12.5) }]}>
          {fact.source.name} • {dateText}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'whyThisStatus')}
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
            {expanded ? t(locale, 'less') : t(locale, 'whyThisStatus')}
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
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • {t(locale, 'objectLabel')}: {fact.source.objectId ?? fact.subject.ref} ({fact.subject.type})
          </Text>
          <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
            • {t(locale, 'licenseLabel')}: {fact.source.licence}
          </Text>
          {fact.lastConfirmedAt ? (
            <Text style={[styles.detailItem, { color: colors.okBorder, fontSize: fontSize(13) }]}>
              • {t(locale, 'confirmationDateLabel')}: {fact.lastConfirmedAt}
            </Text>
          ) : (
            <Text style={[styles.detailItem, { color: colors.muted, fontSize: fontSize(13) }]}>
              • {t(locale, 'noCheckDateLabel')}
            </Text>
          )}
          {fact.matchConfidence !== undefined ? (
            <Text style={[styles.detailItem, { color: colors.text, fontSize: fontSize(13) }]}>
              • {t(locale, 'placeMatchConfidenceLabel')}: {Math.round(fact.matchConfidence * 100)}%
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  criterionText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  valueText: {
    fontWeight: '700',
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 8,
  },
  sourceText: {
    fontWeight: '500',
    flex: 1,
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
    marginTop: 4,
  },
  detailItem: {
    lineHeight: 18,
    fontWeight: '500',
  },
});

import { credibilityFromSource, dateLabel, type Fact } from '@krakow-bez-barier/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown, CaretUp } from 'phosphor-react-native';

import { t, type Locale, getLocalizedCriterionName, getLocalizedFactValue } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';
import { CredibilityNote, credibilityLabel, sourceWithCredit } from './CredibilityNote';
import { StatusBadge } from './StatusBadge';

interface FactRowProps {
  fact: Fact;
  locale: Locale;
}

export function FactRow({ fact, locale }: FactRowProps) {
  const { colors, fontSize, isHighContrast, highlightLinks } = useSession();
  const [expanded, setExpanded] = useState(false);

  const criterionDisplay = getLocalizedCriterionName(fact.criterion, locale);
  const valueDisplay = getLocalizedFactValue(fact.value, locale, fact.criterion);

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

  const credibility = credibilityFromSource({
    name: fact.source.name,
    licence: fact.source.licence,
    status: fact.status,
    hasAuditDate: Boolean(fact.lastConfirmedAt),
  });
  const sourceLine = sourceWithCredit(fact.source.name, fact.source.licence);
  const indexLabel = `${t(locale, 'credibilityIndex')} ${credibility.score} · ${credibilityLabel(locale, credibility.rank)}`;

  const a11yLabel =
    locale === 'pl'
      ? `${criterionDisplay}: ${valueDisplay}. Status: ${fact.status}. Źródło: ${sourceLine}, ${dateText}. ${indexLabel}`
      : locale === 'uk'
        ? `${criterionDisplay}: ${valueDisplay}. Статус: ${fact.status}. Джерело: ${sourceLine}, ${dateText}. ${indexLabel}`
        : `${criterionDisplay}: ${valueDisplay}. Status: ${fact.status}. Source: ${sourceLine}, ${dateText}. ${indexLabel}`;

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
          {criterionDisplay}
        </Text>
        <StatusBadge status={fact.status} locale={locale} />
      </View>

      <Text style={[styles.valueText, { color: colors.text, fontSize: fontSize(16) }]}>
        {valueDisplay}
      </Text>

      <CredibilityNote assessment={credibility} locale={locale} />

      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.sourceText, { color: colors.muted, fontSize: fontSize(12.5) }]}>
          {sourceLine} • {dateText}
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

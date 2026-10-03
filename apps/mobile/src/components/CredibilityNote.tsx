import {
  conciseSourceCredit,
  type CredibilityAssessment,
  type CredibilityRank,
} from '@krakow-bez-barier/core';
import { StyleSheet, Text, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';

const RANK_KEY: Record<CredibilityRank, Parameters<typeof t>[1]> = {
  corroborated: 'credibilityRankCorroborated',
  osm_verified: 'credibilityRankOsmVerified',
  official_city: 'credibilityRankOfficialCity',
  msip_zdmk: 'credibilityRankMsipZdmk',
  wawel: 'credibilityRankWawel',
  field_audit: 'credibilityRankFieldAudit',
  osm_community: 'credibilityRankOsmCommunity',
  geoportal: 'credibilityRankGeoportal',
  partial_report: 'credibilityRankPartialReport',
  conflicting: 'credibilityRankConflicting',
  unspecified: 'credibilityRankUnspecified',
  single_report: 'credibilityRankSingleReport',
  unknown: 'credibilityRankUnknown',
};

interface CredibilityNoteProps {
  assessment: CredibilityAssessment;
  locale: Locale;
}

export function credibilityLabel(locale: Locale, rank: CredibilityRank): string {
  return t(locale, RANK_KEY[rank]);
}

export function CredibilityNote({ assessment, locale }: CredibilityNoteProps) {
  const { colors, fontSize } = useSession();
  const label = credibilityLabel(locale, assessment.rank);
  const line = `${t(locale, 'credibilityIndex')} ${assessment.score} · ${label}`;

  let caveat: string | null = null;
  if (assessment.rank === 'single_report') caveat = t(locale, 'credibilityCaveatSingle');
  else if (assessment.rank === 'partial_report') caveat = t(locale, 'credibilityCaveatPartial');

  const tone =
    assessment.score >= 65 ? colors.text : assessment.score >= 40 ? colors.muted : colors.warningText;

  return (
    <View accessibilityRole="text" accessibilityLabel={`${line}${caveat ? `. ${caveat}` : ''}`}>
      <Text style={[styles.line, { color: tone, fontSize: fontSize(12.5) }]}>{line}</Text>
      {caveat ? (
        <Text style={[styles.caveat, { color: colors.muted, fontSize: fontSize(12) }]}>{caveat}</Text>
      ) : null}
    </View>
  );
}

export function sourceWithCredit(name: string, licence?: string): string {
  const credit = conciseSourceCredit({ name, licence });
  if (!credit) return name;
  return `${name} · ${credit}`;
}

const styles = StyleSheet.create({
  line: {
    fontWeight: '700',
  },
  caveat: {
    fontWeight: '500',
    marginTop: 2,
  },
});

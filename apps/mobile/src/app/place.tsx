import { findConflicts, isStale } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/DemoBanner';
import { FactRow } from '@/components/FactRow';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function PlaceScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale, activePlaceReport } = useSession();

  if (!activePlaceReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t(locale, 'placeDetailTitle') }} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Brak wybranego miejsca.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: colors.accentText, fontWeight: '700' }}>Wróć</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const report = activePlaceReport;
  const conflicts = findConflicts(report.allFacts);

  // Check for any stale facts (>24 months) (R8)
  const now = new Date();
  const staleFacts = report.allFacts.filter(
    (f) =>
      isStale(f.lastConfirmedAt, now, 24) ||
      (!f.lastConfirmedAt && isStale(f.lastEditedAt, now, 24)),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: report.placeName }} />
      <DemoBanner isSample={report.isSample} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Place Header & Match Confidence */}
        <View
          accessibilityRole="header"
          style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.placeName, { color: colors.text }]}>{report.placeName}</Text>
          <Text style={[styles.summaryMsg, { color: colors.muted }]}>{report.summaryMessage}</Text>

          <View style={styles.confidenceRow}>
            <Text style={[styles.confLabel, { color: colors.text }]}>
              {t(locale, 'matchConfidence')}:
            </Text>
            <View
              style={[
                styles.confBadge,
                {
                  backgroundColor: report.isConfidentMatch ? colors.okBg : colors.unknownBg,
                  borderColor: report.isConfidentMatch ? colors.okBorder : colors.unknownBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.confBadgeText,
                  { color: report.isConfidentMatch ? colors.okText : colors.unknownText },
                ]}
              >
                {report.isConfidentMatch
                  ? `✓ ${Math.round(report.matchConfidence * 100)}% (${t(locale, 'confidentMatch')})`
                  : `? ${t(locale, 'noPlaceData')}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Conflicting Data Warning (R7) */}
        {conflicts.length > 0 ? (
          <View
            accessibilityRole="alert"
            style={[styles.alertCard, { backgroundColor: colors.conflictingBg, borderColor: colors.conflictingBorder }]}
          >
            <Text style={[styles.alertTitle, { color: colors.conflictingText }]}>
              ⚡ Wykryto sprzeczne dane w OpenStreetMap (R7):
            </Text>
            <Text style={[styles.alertBody, { color: colors.conflictingText }]}>
              Różne obiekty OSM (np. budynek vs węzeł wejścia) podają sprzeczne informacje dla tego samego miejsca. Poniżej przedstawiono obie wartości:
            </Text>
            {conflicts.map((conf, idx) => (
              <View key={idx} style={styles.conflictItem}>
                <Text style={[styles.conflictHeader, { color: colors.conflictingText }]}>
                  Kryterium: {conf.criterion}
                </Text>
                {conf.facts.map((f) => (
                  <Text key={f.id} style={[styles.conflictRow, { color: colors.conflictingText }]}>
                    {`• Źródło: ${f.source.name} → Wartość: "${f.value}"`}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Stale Data Warning (R8) */}
        {staleFacts.length > 0 ? (
          <View
            accessibilityRole="alert"
            style={[styles.alertCard, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}
          >
            <Text style={[styles.alertTitle, { color: colors.warningText }]}>
              ⏰ Uwaga: Przedawnione dane w OpenStreetMap (R8):
            </Text>
            <Text style={[styles.alertBody, { color: colors.warningText }]}>
              Niektóre informacje o tym miejscu nie były weryfikowane ani edytowane od ponad 24 miesięcy. Stan faktyczny mógł ulec zmianie.
            </Text>
          </View>
        ) : null}

        {/* 4 Standard Challenge Categories (R4) */}
        <CategorySection
          title={`🚪 ${t(locale, 'catEntrance')}`}
          facts={report.factsByCategory.entrance}
          locale={locale}
          colors={colors}
        />

        <CategorySection
          title={`🏢 ${t(locale, 'catInside')}`}
          facts={report.factsByCategory.inside}
          locale={locale}
          colors={colors}
        />

        <CategorySection
          title={`🚻 ${t(locale, 'catToilet')}`}
          facts={report.factsByCategory.toilet}
          locale={locale}
          colors={colors}
        />

        <CategorySection
          title={`🌳 ${t(locale, 'catSurroundings')}`}
          facts={report.factsByCategory.surroundings}
          locale={locale}
          colors={colors}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/report-correction' as any)}
          style={[styles.reportBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={{ color: colors.accent, fontWeight: '700' }}>
            ✍️ {t(locale, 'reportCorrection')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategorySection({
  title,
  facts,
  locale,
  colors,
}: {
  title: string;
  facts: any[];
  locale: any;
  colors: typeof lightColors;
}) {
  return (
    <View style={styles.catBox}>
      <Text accessibilityRole="header" style={[styles.catTitle, { color: colors.text }]}>
        {title}
      </Text>
      {facts.length === 0 ? (
        <View style={[styles.emptyCategory, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            ❓ {t(locale, 'emptyCategory')}
          </Text>
        </View>
      ) : (
        facts.map((fact) => <FactRow key={fact.id} fact={fact} locale={locale} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  headerCard: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  placeName: { fontSize: 22, fontWeight: '800' },
  summaryMsg: { fontSize: 15, lineHeight: 22 },
  confidenceRow: { gap: 6, marginTop: 4 },
  confLabel: { fontSize: 14, fontWeight: '700' },
  confBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confBadgeText: { fontSize: 13, fontWeight: '700' },
  alertCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  alertTitle: { fontSize: 16, fontWeight: '800' },
  alertBody: { fontSize: 14, lineHeight: 20 },
  conflictItem: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.15)',
    paddingTop: 6,
    gap: 2,
  },
  conflictHeader: { fontSize: 14, fontWeight: '700' },
  conflictRow: { fontSize: 13 },
  catBox: { gap: 6, marginTop: 6 },
  catTitle: { fontSize: 18, fontWeight: '800' },
  emptyCategory: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
  },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  reportBtn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: spacing.touch,
  },
  primaryBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
});

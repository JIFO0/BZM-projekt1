import { findConflicts, isStale } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  CheckCircle,
  Question,
  Lightning,
  Clock,
  Door,
  Buildings,
  Toilet,
  Tree,
  NotePencil,
  NavigationArrow,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { FactRow } from '@/components/FactRow';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function PlaceScreen() {
  const {
    locale,
    activePlaceReport,
    setPendingDestination,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);

  if (!activePlaceReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'placeDetailTitle') }} />
        <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />
        <View style={styles.emptyContainer}>
          <GovCard variant="warning">
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
              Brak wybranego miejsca.
            </Text>
            <GovButton
              title="Wróć"
              icon={<ArrowLeft size={18} color="#fff" weight="bold" />}
              variant="primary"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            />
          </GovCard>
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

  const handleRouteHere = () => {
    setPendingDestination({
      name: report.placeName,
      position: report.position,
    });
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: report.placeName }} />
      <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />

      <DemoBanner isSample={report.isSample} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* Place Header & Match Confidence */}
        <GovCard variant="accent">
          <View style={styles.cardTopRow}>
            <Text style={[styles.krakowPlaceTag, { color: colors.accent, fontSize: fontSize(12) }]}>
              OBIEKT MIEJSKI KRAKÓW
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[
              styles.placeName,
              {
                color: colors.text,
                fontSize: fontSize(22),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
              },
            ]}
          >
            {report.placeName}
          </Text>
          <Text
            style={[
              styles.summaryMsg,
              {
                color: colors.muted,
                fontSize: fontSize(14.5),
                lineHeight: fontSize(22),
              },
            ]}
          >
            {report.summaryMessage}
          </Text>

          <View style={styles.confidenceRow}>
            <Text style={[styles.confLabel, { color: colors.text, fontSize: fontSize(14) }]}>
              {t(locale, 'matchConfidence')}:
            </Text>
            <View
              style={[
                styles.confBadge,
                {
                  backgroundColor: report.isConfidentMatch ? colors.okBg : colors.unknownBg,
                  borderColor: report.isConfidentMatch ? colors.okBorder : colors.unknownBorder,
                  borderWidth: isHighContrast ? 2 : 1.5,
                },
              ]}
            >
              <View style={styles.inlineBadgeRow}>
                {report.isConfidentMatch ? (
                  <CheckCircle size={15} color={colors.okText} weight="bold" />
                ) : (
                  <Question size={15} color={colors.unknownText} weight="bold" />
                )}
                <Text
                  style={[
                    styles.confBadgeText,
                    {
                      color: report.isConfidentMatch ? colors.okText : colors.unknownText,
                      fontSize: fontSize(13),
                    },
                  ]}
                >
                  {report.isConfidentMatch
                    ? `${Math.round(report.matchConfidence * 100)}% (${t(locale, 'confidentMatch')})`
                    : t(locale, 'noPlaceData')}
                </Text>
              </View>
            </View>
          </View>

          <GovButton
            title="Wyznacz trasę do tego obiektu"
            icon={<NavigationArrow size={18} color={colors.accentText} weight="bold" />}
            variant="primary"
            onPress={handleRouteHere}
            style={{ marginTop: 14 }}
          />
        </GovCard>

        {/* Conflicting Data Warning (R7) */}
        {conflicts.length > 0 ? (
          <GovCard variant="conflicting">
            <View style={styles.inlineHeaderRow}>
              <Lightning size={20} color={colors.conflictingText} weight="bold" />
              <Text
                accessibilityRole="header"
                style={[styles.alertTitle, { color: colors.conflictingText, fontSize: fontSize(15.5) }]}
              >
                Wykryto sprzeczne dane w OpenStreetMap (R7):
              </Text>
            </View>
            <Text
              style={[styles.alertBody, { color: colors.conflictingText, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}
            >
              Różne obiekty OSM (np. budynek vs węzeł wejścia) podają sprzeczne informacje dla tego samego miejsca. Poniżej przedstawiono obie wartości:
            </Text>
            {conflicts.map((conf, idx) => (
              <View key={idx} style={[styles.conflictItem, { borderTopColor: colors.conflictingBorder }]}>
                <Text style={[styles.conflictHeader, { color: colors.conflictingText, fontSize: fontSize(13.5) }]}>
                  Kryterium: {conf.criterion}
                </Text>
                {conf.facts.map((f) => (
                  <Text
                    key={f.id}
                    style={[styles.conflictRow, { color: colors.conflictingText, fontSize: fontSize(13) }]}
                  >
                    {`• Źródło: ${f.source.name} → Wartość: "${f.value}"`}
                  </Text>
                ))}
              </View>
            ))}
          </GovCard>
        ) : null}

        {/* Stale Data Warning (R8) */}
        {staleFacts.length > 0 ? (
          <GovCard variant="warning">
            <View style={styles.inlineHeaderRow}>
              <Clock size={20} color={colors.warningText} weight="bold" />
              <Text
                accessibilityRole="header"
                style={[styles.alertTitle, { color: colors.warningText, fontSize: fontSize(15.5) }]}
              >
                Uwaga: Przedawnione dane w OpenStreetMap (R8):
              </Text>
            </View>
            <Text
              style={[styles.alertBody, { color: colors.warningText, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}
            >
              Niektóre informacje o tym miejscu nie były weryfikowane ani edytowane od ponad 24 miesięcy. Stan faktyczny mógł ulec zmianie.
            </Text>
          </GovCard>
        ) : null}

        {/* 4 Standard Challenge Categories (R4) */}
        <CategorySection
          title={t(locale, 'catEntrance')}
          icon={<Door size={20} color={colors.accent} weight="bold" />}
          facts={report.factsByCategory.entrance}
          locale={locale}
        />

        <CategorySection
          title={t(locale, 'catInside')}
          icon={<Buildings size={20} color={colors.accent} weight="bold" />}
          facts={report.factsByCategory.inside}
          locale={locale}
        />

        <CategorySection
          title={t(locale, 'catToilet')}
          icon={<Toilet size={20} color={colors.accent} weight="bold" />}
          facts={report.factsByCategory.toilet}
          locale={locale}
        />

        <CategorySection
          title={t(locale, 'catSurroundings')}
          icon={<Tree size={20} color={colors.accent} weight="bold" />}
          facts={report.factsByCategory.surroundings}
          locale={locale}
        />

        <GovButton
          title={t(locale, 'reportCorrection')}
          icon={<NotePencil size={18} color={colors.text} weight="bold" />}
          variant="secondary"
          onPress={() => router.push('/report-correction' as any)}
        />

        <GovFooter />
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

function CategorySection({
  title,
  icon,
  facts,
  locale,
}: {
  title: string;
  icon: React.ReactNode;
  facts: any[];
  locale: any;
}) {
  const { colors, fontSize } = useSession();

  return (
    <View style={styles.catBox}>
      <View style={styles.inlineHeaderRow}>
        {icon}
        <Text accessibilityRole="header" style={[styles.catTitle, { color: colors.text, fontSize: fontSize(17.5) }]}>
          {title}
        </Text>
      </View>
      {facts.length === 0 ? (
        <GovCard variant="default">
          <View style={styles.inlineNoticeRow}>
            <Question size={16} color={colors.muted} weight="bold" />
            <Text style={[styles.emptyText, { color: colors.muted, fontSize: fontSize(13.5) }]}>
              {t(locale, 'emptyCategory')}
            </Text>
          </View>
        </GovCard>
      ) : (
        facts.map((fact) => <FactRow key={fact.id} fact={fact} locale={locale} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  emptyContainer: { padding: 20 },
  content: {
    padding: spacing.screen,
    gap: spacing.stack,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  krakowPlaceTag: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  placeName: {
    fontWeight: '900',
  },
  summaryMsg: {
    fontWeight: '500',
  },
  confidenceRow: {
    gap: 6,
    marginTop: 2,
  },
  confLabel: {
    fontWeight: '700',
  },
  confBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  confBadgeText: {
    fontWeight: '800',
  },
  alertTitle: {
    fontWeight: '800',
  },
  alertBody: {
    fontWeight: '500',
  },
  conflictItem: {
    borderTopWidth: 1,
    paddingTop: 6,
    gap: 2,
  },
  conflictHeader: {
    fontWeight: '800',
  },
  conflictRow: {
    fontWeight: '500',
  },
  catBox: {
    gap: 6,
    marginTop: 4,
  },
  catTitle: {
    fontWeight: '800',
  },
  emptyText: {
    fontStyle: 'italic',
  },
  title: {
    fontWeight: '800',
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

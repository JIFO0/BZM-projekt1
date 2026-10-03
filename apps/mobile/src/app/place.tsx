import { findConflicts, isStale } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!activePlaceReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'placeDetailTitle') }} />
        <KrakowHeader onOpenDemo={() => setDebugVisible(true)} />
        <View style={styles.emptyContainer}>
          <GovCard variant="warning">
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
              Brak wybranego miejsca.
            </Text>
            <GovButton
              title="Wróć"
              icon="←"
              variant="primary"
              onPress={() => router.back()}
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

  const handleReadScreen = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    let speechText = `Karta obiektu: ${report.placeName}. ${report.summaryMessage}. `;
    if (report.isConfidentMatch) {
      speechText += `Dopasowano obiekt z bazy OpenStreetMap z pewnością ${Math.round(report.matchConfidence * 100)} procent. `;
    } else {
      speechText += 'Brak danych o dostępności tego miejsca w OpenStreetMap. ';
    }
    if (conflicts.length > 0) {
      speechText += `Wykryto sprzeczne dane dla ${conflicts.length} parametrów. `;
    }
    if (staleFacts.length > 0) {
      speechText += 'Część danych jest starsza niż 24 miesiące. ';
    }

    setIsSpeaking(true);
    Speech.speak(speechText, {
      language: locale === 'pl' ? 'pl-PL' : 'en-US',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: report.placeName }} />

      <KrakowHeader
        onOpenDemo={() => setDebugVisible(true)}
        onReadScreen={handleReadScreen}
        isSpeaking={isSpeaking}
      />

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
                  ? `✓ ${Math.round(report.matchConfidence * 100)}% (${t(locale, 'confidentMatch')})`
                  : `? ${t(locale, 'noPlaceData')}`}
              </Text>
            </View>
          </View>

          <GovButton
            title={isSpeaking ? t(locale, 'stopSpeech') : 'Odsłuchaj opis obiektu'}
            icon={isSpeaking ? '⏹️' : '🔊'}
            variant={isSpeaking ? 'danger' : 'outline'}
            onPress={handleReadScreen}
          />
        </GovCard>

        {/* Conflicting Data Warning (R7) */}
        {conflicts.length > 0 ? (
          <GovCard variant="conflicting">
            <Text
              accessibilityRole="header"
              style={[styles.alertTitle, { color: colors.conflictingText, fontSize: fontSize(15.5) }]}
            >
              ⚡ Wykryto sprzeczne dane w OpenStreetMap (R7):
            </Text>
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
            <Text
              accessibilityRole="header"
              style={[styles.alertTitle, { color: colors.warningText, fontSize: fontSize(15.5) }]}
            >
              ⏰ Uwaga: Przedawnione dane w OpenStreetMap (R8):
            </Text>
            <Text
              style={[styles.alertBody, { color: colors.warningText, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}
            >
              Niektóre informacje o tym miejscu nie były weryfikowane ani edytowane od ponad 24 miesięcy. Stan faktyczny mógł ulec zmianie.
            </Text>
          </GovCard>
        ) : null}

        {/* 4 Standard Challenge Categories (R4) */}
        <CategorySection
          title={`🚪 ${t(locale, 'catEntrance')}`}
          facts={report.factsByCategory.entrance}
          locale={locale}
        />

        <CategorySection
          title={`🏢 ${t(locale, 'catInside')}`}
          facts={report.factsByCategory.inside}
          locale={locale}
        />

        <CategorySection
          title={`🚻 ${t(locale, 'catToilet')}`}
          facts={report.factsByCategory.toilet}
          locale={locale}
        />

        <CategorySection
          title={`🌳 ${t(locale, 'catSurroundings')}`}
          facts={report.factsByCategory.surroundings}
          locale={locale}
        />

        <GovButton
          title={t(locale, 'reportCorrection')}
          icon="✍️"
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
  facts,
  locale,
}: {
  title: string;
  facts: any[];
  locale: any;
}) {
  const { colors, fontSize } = useSession();

  return (
    <View style={styles.catBox}>
      <Text accessibilityRole="header" style={[styles.catTitle, { color: colors.text, fontSize: fontSize(17.5) }]}>
        {title}
      </Text>
      {facts.length === 0 ? (
        <GovCard variant="default">
          <Text style={[styles.emptyText, { color: colors.muted, fontSize: fontSize(13.5) }]}>
            ❓ {t(locale, 'emptyCategory')}
          </Text>
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
});

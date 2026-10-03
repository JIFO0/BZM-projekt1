import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  NotePencil,
  FloppyDisk,
  MapTrifold,
  Globe,
  ListChecks,
  Warning,
  CheckCircle,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function ReportCorrectionScreen() {
  const {
    locale,
    localReports,
    addLocalReport,
    activeRouteReport,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleSubmitLocal = () => {
    if (!description.trim()) {
      Alert.alert('Błąd', 'Wpisz treść uwagi lub przeszkody.');
      return;
    }
    addLocalReport(description.trim());
    setDescription('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  const handleOpenOsmNote = async () => {
    let lat = 50.0619;
    let lon = 19.9373;
    if (activeRouteReport && activeRouteReport.findings.length > 0) {
      lat = activeRouteReport.findings[0]!.fact.subject.lat;
      lon = activeRouteReport.findings[0]!.fact.subject.lon;
    }
    const osmUrl = `https://www.openstreetmap.org/note/new?lat=${lat}&lon=${lon}#map=17/${lat}/${lon}`;
    const supported = await Linking.canOpenURL(osmUrl);
    if (supported) {
      await Linking.openURL(osmUrl);
    } else {
      Alert.alert('Błąd', `Nie można otworzyć linku: ${osmUrl}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'reportTitle') }} />
      <KrakowHeader />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        <GovCard variant="accent">
          <Text
            accessibilityRole="header"
            style={[
              styles.lead,
              {
                color: colors.text,
                fontSize: fontSize(21),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
              },
            ]}
          >
            {t(locale, 'reportTitle')}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: colors.muted,
                fontSize: fontSize(14.5),
                lineHeight: fontSize(22),
              },
            ]}
          >
            {t(locale, 'reportLead')}
          </Text>
        </GovCard>

        {/* Local Submission Form */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <NotePencil size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              {t(locale, 'reportObstacleDesc')}
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t(locale, 'reportObstaclePlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
                fontSize: fontSize(15),
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          />

          {successMsg ? (
            <GovCard variant="ok">
              <View style={styles.cardHeaderRow}>
                <CheckCircle size={18} color={colors.okText} weight="bold" />
                <Text style={{ color: colors.okText, fontWeight: '800', fontSize: fontSize(13.5) }}>
                  {t(locale, 'reportSavedSuccess')}
                </Text>
              </View>
            </GovCard>
          ) : null}

          <GovButton
            title={t(locale, 'reportSubmit')}
            icon={<FloppyDisk size={18} color="#fff" weight="bold" />}
            variant="primary"
            onPress={handleSubmitLocal}
          />
        </GovCard>

        {/* OpenStreetMap Deep Link (R11) */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <MapTrifold size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              OpenStreetMap (OSM Note)
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}>
            {t(locale, 'osmNoteDisclaimer')}
          </Text>

          <GovButton
            title={t(locale, 'openOsmNote')}
            icon={<Globe size={18} color={colors.text} weight="bold" />}
            variant="outline"
            onPress={handleOpenOsmNote}
          />
        </GovCard>

        {/* Local Reports Queue List */}
        <View style={styles.queueSection}>
          <View style={styles.cardHeaderRow}>
            <ListChecks size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.queueTitle, { color: colors.text, fontSize: fontSize(17.5) }]}
            >
              {t(locale, 'localReportsQueue')} ({localReports.length})
            </Text>
          </View>

          {localReports.length === 0 ? (
            <GovCard variant="default">
              <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(14) }]}>
                {t(locale, 'noLocalReports')}
              </Text>
            </GovCard>
          ) : (
            localReports.map((report) => (
              <GovCard key={report.id} variant="warning">
                <View style={styles.itemHeader}>
                  <View style={styles.statusBadgeRow}>
                    <Warning size={16} color={colors.warningText} weight="bold" />
                    <Text style={[styles.statusBadge, { color: colors.warningText, fontSize: fontSize(13) }]}>
                      Zgłoszenie lokalne (niezweryfikowane)
                    </Text>
                  </View>
                  <Text style={[styles.itemDate, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {report.createdAt.slice(0, 10)}
                  </Text>
                </View>
                <Text style={[styles.itemText, { color: colors.text, fontSize: fontSize(14) }]}>
                  {report.description}
                </Text>
              </GovCard>
            ))
          )}
        </View>

        <GovFooter />
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.screen,
    gap: spacing.stack,
  },
  lead: {
    fontWeight: '800',
  },
  body: {
    fontWeight: '500',
  },
  cardTitle: {
    fontWeight: '800',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  queueSection: {
    gap: 10,
    marginTop: 6,
  },
  queueTitle: {
    fontWeight: '800',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    fontWeight: '800',
    flex: 1,
  },
  itemDate: {
    fontWeight: '600',
  },
  itemText: {
    lineHeight: 20,
    fontWeight: '600',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
});

import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function ReportCorrectionScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale, localReports, addLocalReport, activeRouteReport } = useSession();

  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

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
    // Kraków Rynek coordinates as center or first finding
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: t(locale, 'reportTitle') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: colors.text }]}>{t(locale, 'reportTitle')}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'reportLead')}</Text>

        {/* Local Submission Form */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            📝 {t(locale, 'reportObstacleDesc')}
          </Text>
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
              },
            ]}
          />

          {successMsg ? (
            <View
              accessibilityRole="alert"
              style={[styles.successBanner, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}
            >
              <Text style={{ color: colors.okText, fontWeight: '700' }}>
                ✓ {t(locale, 'reportSavedSuccess')}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'reportSubmit')}
            onPress={handleSubmitLocal}
            style={[styles.primaryBtn, { backgroundColor: colors.accent, minHeight: spacing.touch }]}
          >
            <Text style={[styles.btnText, { color: colors.accentText }]}>
              {t(locale, 'reportSubmit')}
            </Text>
          </Pressable>
        </View>

        {/* OpenStreetMap Deep Link (R11) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            🗺️ OpenStreetMap (OSM Note)
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {t(locale, 'osmNoteDisclaimer')}
          </Text>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t(locale, 'openOsmNote')}
            onPress={handleOpenOsmNote}
            style={[
              styles.secondaryBtn,
              { borderColor: colors.accent, minHeight: spacing.touch },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
              🌐 {t(locale, 'openOsmNote')}
            </Text>
          </Pressable>
        </View>

        {/* Local Reports Queue List */}
        <View style={styles.queueSection}>
          <Text accessibilityRole="header" style={[styles.queueTitle, { color: colors.text }]}>
            📋 {t(locale, 'localReportsQueue')} ({localReports.length})
          </Text>

          {localReports.length === 0 ? (
            <Text style={[styles.body, { color: colors.muted }]}>{t(locale, 'noLocalReports')}</Text>
          ) : (
            localReports.map((report) => (
              <View
                key={report.id}
                style={[
                  styles.reportItem,
                  { backgroundColor: colors.surface, borderColor: colors.warningBorder },
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.statusBadge, { color: colors.warningText }]}>
                    ⚠️ Zgłoszenie lokalne (niezweryfikowane)
                  </Text>
                  <Text style={[styles.itemDate, { color: colors.muted }]}>
                    {report.createdAt.slice(0, 10)}
                  </Text>
                </View>
                <Text style={[styles.itemText, { color: colors.text }]}>{report.description}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  lead: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 2, borderRadius: 12, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  primaryBtn: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
  successBanner: { borderWidth: 1.5, borderRadius: 8, padding: 10 },
  queueSection: { gap: 8, marginTop: 8 },
  queueTitle: { fontSize: 17, fontWeight: '700' },
  reportItem: { borderWidth: 1.5, borderRadius: 10, padding: 12, gap: 6 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  itemDate: { fontSize: 12 },
  itemText: { fontSize: 14, lineHeight: 20 },
});

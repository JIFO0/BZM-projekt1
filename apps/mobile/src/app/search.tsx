import { DEMO_SNAPSHOT, type LonLat } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { t } from '@/i18n/strings';
import { inspectPlace, planAndAnalyzeRoute } from '@/services/api';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const {
    locale,
    profileId,
    debugState,
    setActiveRouteReport,
    setActiveWalkingRoute,
    setActivePlaceReport,
  } = useSession();

  const [activeTab, setActiveTab] = useState<'route' | 'place'>('route');
  const [fromQuery, setFromQuery] = useState('Rynek Główny');
  const [fromPos, setFromPos] = useState<LonLat>({ lon: 19.9373, lat: 50.0619 });

  const [toQuery, setToQuery] = useState('Zamek Królewski na Wawelu');
  const [toPos, setToPos] = useState<LonLat>({ lon: 19.9354, lat: 50.0544 });

  const [placeQuery, setPlaceQuery] = useState('Sukiennice');
  const [placePos, setPlacePos] = useState<LonLat>({ lon: 19.9373, lat: 50.0619 });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleUseMyLocation = () => {
    // Explicit user tap as required by P3
    setFromQuery('Moja lokalizacja (Centrum Krakowa)');
    setFromPos({ lon: 19.9373, lat: 50.0619 });
  };

  const handleAnalyzeRoute = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await planAndAnalyzeRoute({
        start: { name: fromQuery, position: fromPos },
        end: { name: toQuery, position: toPos },
        profileId,
        debugState,
      });

      setActiveWalkingRoute(result.walkingRoute);
      setActiveRouteReport(result.report);
      router.push('/route' as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas analizowania trasy.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectPlace = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await inspectPlace(placeQuery, placePos, debugState);
      setActivePlaceReport(result.report);
      router.push('/place' as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas sprawdzania miejsca.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoRoute = (index: number) => {
    const routeData = DEMO_SNAPSHOT.routes[index];
    if (!routeData) return;
    setFromQuery(routeData.start.name);
    setFromPos(routeData.start.position);
    setToQuery(routeData.end.name);
    setToPos(routeData.end.position);
    setActiveTab('route');
  };

  const loadDemoPlace = (index: number) => {
    const placeData = DEMO_SNAPSHOT.places[index];
    if (!placeData) return;
    setPlaceQuery(placeData.name);
    setPlacePos(placeData.position);
    setActiveTab('place');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t(locale, 'searchTitle'),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Panel testowy"
              onPress={() => setDebugVisible(true)}
              style={styles.headerBtn}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>🛠️ Demo</Text>
            </Pressable>
          ),
        }}
      />
      <DemoBanner />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Tab switcher */}
        <View
          accessibilityRole="tablist"
          style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'route' }}
            onPress={() => setActiveTab('route')}
            style={[
              styles.tab,
              activeTab === 'route' && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'route' ? colors.accentText : colors.text },
              ]}
            >
              {t(locale, 'routeTab')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'place' }}
            onPress={() => setActiveTab('place')}
            style={[
              styles.tab,
              activeTab === 'place' && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'place' ? colors.accentText : colors.text },
              ]}
            >
              {t(locale, 'placeTab')}
            </Text>
          </Pressable>
        </View>

        {activeTab === 'route' ? (
          <View style={styles.formSection}>
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={[styles.label, { color: colors.text }]}>{t(locale, 'from')}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(locale, 'myLocation')}
                  onPress={handleUseMyLocation}
                >
                  <Text style={[styles.linkText, { color: colors.accent }]}>
                    📍 {t(locale, 'myLocation')}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={fromQuery}
                onChangeText={setFromQuery}
                placeholder={t(locale, 'fromPlaceholder')}
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    minHeight: spacing.touch,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t(locale, 'to')}</Text>
              <TextInput
                value={toQuery}
                onChangeText={setToQuery}
                placeholder={t(locale, 'toPlaceholder')}
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    minHeight: spacing.touch,
                  },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'searchButton')}
              disabled={loading}
              onPress={handleAnalyzeRoute}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent, minHeight: spacing.touch },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.accentText }]}>
                  🔍 {t(locale, 'searchButton')}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>{t(locale, 'placeLabel')}</Text>
              <TextInput
                value={placeQuery}
                onChangeText={setPlaceQuery}
                placeholder={t(locale, 'placePlaceholder')}
                placeholderTextColor={colors.muted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    minHeight: spacing.touch,
                  },
                ]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'searchPlaceButton')}
              disabled={loading}
              onPress={handleInspectPlace}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.accent, minHeight: spacing.touch },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.accentText }]}>
                  🏢 {t(locale, 'searchPlaceButton')}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {errorMsg ? (
          <View
            accessibilityRole="alert"
            style={[styles.errorCard, { backgroundColor: colors.blockerBg, borderColor: colors.blockerBorder }]}
          >
            <Text style={{ color: colors.blockerText, fontWeight: '700' }}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Demo Fast Triggers */}
        <View style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.demoTitle, { color: colors.text }]}>
            🎯 {t(locale, 'demoScenarios')}
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Kliknij gotowy scenariusz, aby przetestować bez wpisywania:
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => loadDemoRoute(0)}
            style={[styles.scenarioBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.scenarioText, { color: colors.text }]}>
              🚶 Trasa 1: {t(locale, 'demoRoute1')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => loadDemoRoute(1)}
            style={[styles.scenarioBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.scenarioText, { color: colors.text }]}>
              🚶 Trasa 2: {t(locale, 'demoRoute2')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => loadDemoPlace(0)}
            style={[styles.scenarioBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.scenarioText, { color: colors.text }]}>
              🏛️ Obiekt 1: {t(locale, 'demoPlace1')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => loadDemoPlace(1)}
            style={[styles.scenarioBtn, { borderColor: colors.conflictingBorder }]}
          >
            <Text style={[styles.scenarioText, { color: colors.conflictingBorder }]}>
              ⚡ Obiekt 2 (R7): {t(locale, 'demoPlace2')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => loadDemoPlace(2)}
            style={[styles.scenarioBtn, { borderColor: colors.warningBorder }]}
          >
            <Text style={[styles.scenarioText, { color: colors.warningBorder }]}>
              ⏰ Obiekt 3 (R8): {t(locale, 'demoPlace3')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <DebugModal visible={debugVisible} onClose={() => setDebugVisible(false)} locale={locale} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  tabs: { flexDirection: 'row', borderWidth: 2, borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '700' },
  formSection: { gap: 14 },
  field: { gap: 6 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '700' },
  linkText: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  primaryBtn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 16, fontWeight: '700' },
  errorCard: { borderWidth: 2, borderRadius: 12, padding: 12 },
  demoCard: { borderWidth: 2, borderRadius: 12, padding: 14, gap: 8, marginTop: 10 },
  demoTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  scenarioBtn: { borderWidth: 1.5, borderRadius: 8, padding: 10 },
  scenarioText: { fontSize: 14, fontWeight: '600' },
});

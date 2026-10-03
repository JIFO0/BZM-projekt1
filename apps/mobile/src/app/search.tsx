import { DEMO_SNAPSHOT, type LonLat } from '@krakow-bez-barier/core';
import { router, Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Footprints,
  Buildings,
  MapPin,
  MagnifyingGlass,
  Warning,
  Lightning,
  Clock,
  Target,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { DemoBanner } from '@/components/DemoBanner';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { inspectPlace, planAndAnalyzeRoute } from '@/services/api';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const {
    locale,
    profileId,
    debugState,
    setActiveRouteReport,
    setActiveWalkingRoute,
    setActivePlaceReport,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    highlightLinks,
    dyslexicFont,
    activeThresholds,
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
  const [isSpeaking, setIsSpeaking] = useState(false);

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
        thresholds: activeThresholds,
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

  const handleReadScreen = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const text = `${t(locale, 'searchTitle')}. ${t(locale, 'searchLead')}. ${
      activeTab === 'route'
        ? `Aktywna zakładka: Trasa piesza A do B. Punkt początkowy: ${fromQuery}. Punkt docelowy: ${toQuery}. Naciśnij przycisk Analizuj trasę, aby sprawdzić bariery.`
        : `Aktywna zakładka: Dostępność obiektu. Szukany obiekt: ${placeQuery}. Naciśnij przycisk Sprawdź dostępność miejsca.`
    }`;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: locale === 'pl' ? 'pl-PL' : 'en-US',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'searchTitle') }} />

      <KrakowHeader
        onOpenDemo={() => setDebugVisible(true)}
        onReadScreen={handleReadScreen}
        isSpeaking={isSpeaking}
      />

      <DemoBanner />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* Intro banner */}
        <GovCard variant="accent">
          <Text
            accessibilityRole="header"
            style={[
              styles.screenTitle,
              {
                color: colors.text,
                fontSize: fontSize(20),
                letterSpacing: dyslexicFont ? 1.2 : 0.3,
              },
            ]}
          >
            {t(locale, 'searchTitle')}
          </Text>
          <Text style={[styles.leadText, { color: colors.muted, fontSize: fontSize(14) }]}>
            {t(locale, 'searchLead')}
          </Text>
        </GovCard>

        {/* Tab switcher */}
        <View
          accessibilityRole="tablist"
          style={[
            styles.tabs,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2.5 : 1.5,
            },
          ]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'route' }}
            onPress={() => setActiveTab('route')}
            style={[
              styles.tab,
              activeTab === 'route' && { backgroundColor: colors.accent },
              { minHeight: increasedSpacing ? 54 : 46 },
            ]}
          >
            <View style={styles.tabInner}>
              <Footprints
                size={18}
                color={activeTab === 'route' ? colors.accentText : colors.text}
                weight={activeTab === 'route' ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'route' ? colors.accentText : colors.text,
                    fontSize: fontSize(14.5),
                    textDecorationLine: highlightLinks && activeTab === 'route' ? 'underline' : 'none',
                  },
                ]}
              >
                {t(locale, 'routeTab')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'place' }}
            onPress={() => setActiveTab('place')}
            style={[
              styles.tab,
              activeTab === 'place' && { backgroundColor: colors.accent },
              { minHeight: increasedSpacing ? 54 : 46 },
            ]}
          >
            <View style={styles.tabInner}>
              <Buildings
                size={18}
                color={activeTab === 'place' ? colors.accentText : colors.text}
                weight={activeTab === 'place' ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === 'place' ? colors.accentText : colors.text,
                    fontSize: fontSize(14.5),
                    textDecorationLine: highlightLinks && activeTab === 'place' ? 'underline' : 'none',
                  },
                ]}
              >
                {t(locale, 'placeTab')}
              </Text>
            </View>
          </Pressable>
        </View>

        {activeTab === 'route' ? (
          <GovCard variant="default">
            <View style={styles.formSection}>
              {/* Point A */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.label, { color: colors.text, fontSize: fontSize(15) }]}>
                    {t(locale, 'from')}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(locale, 'myLocation')}
                    onPress={handleUseMyLocation}
                    style={styles.locationBtn}
                  >
                    <View style={styles.inlineRow}>
                      <MapPin size={15} color={colors.accent} weight="bold" />
                      <Text
                        style={[
                          styles.linkText,
                          {
                            color: colors.accent,
                            fontSize: fontSize(13),
                            textDecorationLine: highlightLinks ? 'underline' : 'none',
                          },
                        ]}
                      >
                        {t(locale, 'myLocation')}
                      </Text>
                    </View>
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
                      backgroundColor: colors.background,
                      minHeight: increasedSpacing ? 56 : spacing.touch,
                      fontSize: fontSize(15),
                      borderWidth: isHighContrast ? 2.5 : 1.5,
                    },
                  ]}
                />
              </View>

              {/* Point B */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSize(15) }]}>
                  {t(locale, 'to')}
                </Text>
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
                      backgroundColor: colors.background,
                      minHeight: increasedSpacing ? 56 : spacing.touch,
                      fontSize: fontSize(15),
                      borderWidth: isHighContrast ? 2.5 : 1.5,
                    },
                  ]}
                />
              </View>

              <GovButton
                title={t(locale, 'searchButton')}
                icon={<MagnifyingGlass size={18} color={colors.accentText} weight="bold" />}
                variant="primary"
                loading={loading}
                onPress={handleAnalyzeRoute}
              />
            </View>
          </GovCard>
        ) : (
          <GovCard variant="default">
            <View style={styles.formSection}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSize(15) }]}>
                  {t(locale, 'placeLabel')}
                </Text>
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
                      backgroundColor: colors.background,
                      minHeight: increasedSpacing ? 56 : spacing.touch,
                      fontSize: fontSize(15),
                      borderWidth: isHighContrast ? 2.5 : 1.5,
                    },
                  ]}
                />
              </View>

              <GovButton
                title={t(locale, 'searchPlaceButton')}
                icon={<Buildings size={18} color={colors.accentText} weight="bold" />}
                variant="primary"
                loading={loading}
                onPress={handleInspectPlace}
              />
            </View>
          </GovCard>
        )}

        {errorMsg ? (
          <GovCard variant="blocker">
            <View style={styles.inlineRow}>
              <Warning size={18} color={colors.blockerText} weight="bold" />
              <Text style={{ color: colors.blockerText, fontWeight: '800', fontSize: fontSize(14), flex: 1 }}>
                {errorMsg}
              </Text>
            </View>
          </GovCard>
        ) : null}

        {/* Demo Fast Triggers */}
        <GovCard variant="accent">
          <View style={styles.inlineRow}>
            <Target size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.demoTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              {t(locale, 'demoScenarios')}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(13.5) }]}>
            Kliknij gotowy scenariusz, aby przetestować bez wpisywania:
          </Text>

          <View style={styles.scenariosList}>
            <GovButton
              variant="outline"
              title={`Trasa: ${t(locale, 'demoRoute1')}`}
              icon={<Footprints size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoRoute(0)}
            />
            <GovButton
              variant="outline"
              title={`Trasa: ${t(locale, 'demoRoute2')}`}
              icon={<Footprints size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoRoute(1)}
            />
            <GovButton
              variant="outline"
              title={`Miejsce: ${t(locale, 'demoPlace1')}`}
              icon={<Buildings size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(0)}
            />
            <GovButton
              variant="outline"
              title={`Miejsce (R7 Sprzeczne): ${t(locale, 'demoPlace2')}`}
              icon={<Lightning size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(1)}
            />
            <GovButton
              variant="outline"
              title={`Miejsce (R8 Przedawnione): ${t(locale, 'demoPlace3')}`}
              icon={<Clock size={18} color={colors.text} weight="bold" />}
              onPress={() => loadDemoPlace(2)}
            />
          </View>
        </GovCard>

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
  screenTitle: {
    fontWeight: '800',
  },
  leadText: {
    fontWeight: '500',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '800',
  },
  formSection: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
  },
  locationBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  linkText: {
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  demoTitle: {
    fontWeight: '800',
  },
  body: {
    lineHeight: 18,
    fontWeight: '500',
  },
  scenariosList: {
    gap: 8,
    marginTop: 4,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

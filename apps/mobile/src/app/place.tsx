import { DEMO_SNAPSHOT, findConflicts, isStale, credibilityFromReports } from '@krakow-bez-barier/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  Camera,
  Image as ImageIcon,
  Trash,
  Plus,
  ThumbsUp,
  ThumbsDown,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { CredibilityNote } from '@/components/CredibilityNote';
import { DemoBanner } from '@/components/DemoBanner';
import { FactRow } from '@/components/FactRow';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t, getLocalizedCriterionName, getLocalizedFactValue, getLocalizedCategoryName } from '@/i18n/strings';
import {
  inspectPlace,
  fetchPlaceServerComments,
  addPlaceServerComment,
  uploadPhotoToServer,
  ServerPlaceComment,
} from '@/services/api';
import { pickPhotoAsync } from '@/services/photo';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

function extractPlaceParams(params: Record<string, any>) {
  let placeName = params.placeName;
  let placeLat = params.placeLat ? parseFloat(params.placeLat) : undefined;
  let placeLon = params.placeLon ? parseFloat(params.placeLon) : undefined;
  let demoPlace = params.demoPlace !== undefined ? parseInt(params.demoPlace, 10) : undefined;

  if (params.u) {
    try {
      const decoded = JSON.parse(decodeURIComponent(params.u));
      if (decoded.placeName) placeName = decoded.placeName;
      if (decoded.placeLat !== undefined) placeLat = parseFloat(decoded.placeLat);
      if (decoded.placeLon !== undefined) placeLon = parseFloat(decoded.placeLon);
      if (decoded.demoPlace !== undefined) demoPlace = parseInt(decoded.demoPlace, 10);
    } catch {}
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

      const getVal = (k: string) => urlParams.get(k) || hashParams.get(k);

      if (placeLat === undefined && getVal('placeLat')) placeLat = parseFloat(getVal('placeLat')!);
      if (placeLon === undefined && getVal('placeLon')) placeLon = parseFloat(getVal('placeLon')!);
      if (!placeName && getVal('placeName')) placeName = getVal('placeName')!;
      if (demoPlace === undefined && getVal('demoPlace')) demoPlace = parseInt(getVal('demoPlace')!, 10);
    } catch {}
  }

  return { placeName, placeLat, placeLon, demoPlace };
}

export default function PlaceScreen() {
  const {
    locale,
    activePlaceReport,
    setActivePlaceReport,
    setPendingDestination,
    debugState,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [debugVisible, setDebugVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeComments, setPlaceComments] = useState<ServerPlaceComment[]>([]);
  const [showAddComment, setShowAddComment] = useState(false);
  const [commentSentiment, setCommentSentiment] = useState<'positive' | 'negative'>('positive');
  const [commentCategory, setCommentCategory] = useState<'entrance' | 'inside' | 'toilet' | 'surroundings' | 'general'>('entrance');
  const [commentText, setCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const rawParams = useLocalSearchParams();
  const placeParams = useMemo(() => extractPlaceParams(rawParams), [rawParams]);

  useEffect(() => {
    if (!activePlaceReport?.placeName) return;
    const placeId = `place-${activePlaceReport.placeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    fetchPlaceServerComments(placeId)
      .then((c) => setPlaceComments(c))
      .catch(() => {});
  }, [activePlaceReport?.placeName]);

  useEffect(() => {
    if (activePlaceReport) return;

    if (placeParams.demoPlace !== undefined && DEMO_SNAPSHOT.places[placeParams.demoPlace]) {
      const dp = DEMO_SNAPSHOT.places[placeParams.demoPlace]!;
      setLoading(true);
      inspectPlace(dp.name, dp.position, debugState)
        .then((result) => {
          setActivePlaceReport(result.report);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    if (
      placeParams.placeLat !== undefined &&
      !isNaN(placeParams.placeLat) &&
      placeParams.placeLon !== undefined &&
      !isNaN(placeParams.placeLon)
    ) {
      setLoading(true);
      inspectPlace(
        placeParams.placeName || 'Miejsce',
        { lat: placeParams.placeLat, lon: placeParams.placeLon },
        debugState,
      )
        .then((result) => {
          setActivePlaceReport(result.report);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activePlaceReport, placeParams, debugState, setActivePlaceReport]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'placeDetailTitle') }} />
        <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.text, fontSize: fontSize(15) }]}>
            {locale === 'pl' ? 'Pobieranie danych miejsca...' : locale === 'uk' ? 'Завантаження даних про місце...' : 'Loading place details...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activePlaceReport) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false, title: t(locale, 'placeDetailTitle') }} />
        <KrakowHeader
          showBack
          backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'}
          onBack={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            } catch {
              router.replace('/');
            }
          }}
        />
        <View style={styles.emptyContainer}>
          <GovCard variant="warning">
            <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
              {t(locale, 'noSelectedPlace')}
            </Text>
            <GovButton
              title={t(locale, 'back')}
              icon={<ArrowLeft size={18} color="#fff" weight="bold" />}
              variant="primary"
              onPress={() => {
                try {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/');
                  }
                } catch {
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
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  };

  const handleAddPlaceComment = async () => {
    if (!report?.placeName) return;
    if (!commentText.trim() && !commentPhoto) {
      Alert.alert(
        locale === 'pl' ? 'Uwaga' : 'Warning',
        locale === 'pl'
          ? 'Wpisz opis weryfikacji lub dołącz zdjęcie.'
          : 'Please enter verification description or attach a photo.'
      );
      return;
    }
    setCommentSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (commentPhoto) {
        photoUrl = (await uploadPhotoToServer(commentPhoto)) || commentPhoto;
      }
      const placeId = `place-${report.placeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newComment = await addPlaceServerComment(placeId, {
        sentiment: commentSentiment,
        category: commentCategory,
        comment:
          commentText.trim() ||
          (commentSentiment === 'positive'
            ? 'Dostępność potwierdzona ze zdjęciem'
            : 'Zgłoszenie utrudnienia ze zdjęciem'),
        photoUrl,
      });
      setPlaceComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setCommentPhoto(null);
      setShowAddComment(false);
      Alert.alert(
        locale === 'pl' ? 'Dziękujemy!' : 'Thank you!',
        locale === 'pl'
          ? 'Twoja weryfikacja ze zdjęciem została opublikowana na serwerze i jest widoczna dla wszystkich.'
          : 'Your photo validation has been published to the server and is visible to everyone.'
      );
    } catch (err: any) {
      Alert.alert(
        locale === 'pl' ? 'Błąd' : 'Error',
        err.message || 'Nie udało się dodać weryfikacji.'
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: report.placeName }} />
      <KrakowHeader showBack backTitle={locale === 'pl' ? 'Wróć do mapy' : 'Back to map'} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            padding: increasedSpacing ? 24 : spacing.screen,
            gap: increasedSpacing ? 18 : spacing.stack,
          },
        ]}
      >
        {/* Place Header */}
        <GovCard variant="accent">
          <View style={styles.cardTopRow}>
            <Text style={[styles.krakowPlaceTag, { color: colors.accent, fontSize: fontSize(12) }]}>
              {t(locale, 'municipalObjectKrakow')}
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

          <GovButton
            title="Wyznacz trasę do tego miejsca"
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
                {t(locale, 'conflictingDataTitle')}
              </Text>
            </View>
            <Text
              style={[styles.alertBody, { color: colors.conflictingText, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}
            >
              {t(locale, 'conflictingDataDesc')}
            </Text>
            {conflicts.map((conf, idx) => (
              <View key={idx} style={[styles.conflictItem, { borderTopColor: colors.conflictingBorder }]}>
                <Text style={[styles.conflictHeader, { color: colors.conflictingText, fontSize: fontSize(13.5) }]}>
                  {t(locale, 'criterion')}: {getLocalizedCriterionName(conf.criterion, locale)}
                </Text>
                {conf.facts.map((f) => (
                  <Text
                    key={f.id}
                    style={[styles.conflictRow, { color: colors.conflictingText, fontSize: fontSize(13) }]}
                  >
                    {`• ${t(locale, 'source')}: ${f.source.name} → ${t(locale, 'value')}: "${getLocalizedFactValue(f.value, locale, f.criterion)}"`}
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
                {t(locale, 'staleDataTitle')}
              </Text>
            </View>
            <Text
              style={[styles.alertBody, { color: colors.warningText, fontSize: fontSize(13.5), lineHeight: fontSize(20) }]}
            >
              {t(locale, 'staleDataDesc')}
            </Text>
          </GovCard>
        ) : null}

        {/* Standard Challenge Categories */}
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

        {/* Community Accessibility Validations & Photos */}
        <GovCard variant="default">
          <View style={styles.inlineHeaderRow}>
            <Camera size={20} color={colors.accent} weight="bold" />
            <Text accessibilityRole="header" style={[styles.catTitle, { color: colors.text, fontSize: fontSize(17.5) }]}>
              {locale === 'pl' ? 'Weryfikacje dostępności i zdjęcia mieszkańców' : 'Accessibility Photos & Community Validations'}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: fontSize(13.5), lineHeight: fontSize(20), marginTop: 4 }}>
            {locale === 'pl'
              ? 'Weryfikuj stan ramp, wind, toalet PRM lub nawierzchni zdjęciem z miejsca. Wszystkie zdjęcia są natychmiast widoczne dla społeczności.'
              : 'Validate ramps, elevators, accessible toilets, or paths with a photo. Photos are instantly visible to the community.'}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAddComment(!showAddComment)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: colors.accent,
              marginTop: 10,
            }}
          >
            <Plus size={16} weight="bold" color={colors.accentText} />
            <Text style={{ color: colors.accentText, fontWeight: '700', fontSize: fontSize(13.5) }}>
              {showAddComment
                ? (locale === 'pl' ? 'Anuluj dodawanie' : 'Cancel')
                : (locale === 'pl' ? 'Dodaj weryfikację ze zdjęciem' : 'Add photo validation')}
            </Text>
          </Pressable>

          {showAddComment ? (
            <View style={{ marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, gap: 10 }}>
              <Text style={{ color: colors.text, fontSize: fontSize(13), fontWeight: '700' }}>
                {locale === 'pl' ? 'Stan dostępności:' : 'Accessibility status:'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCommentSentiment('positive')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: commentSentiment === 'positive' ? colors.okBg : colors.surface,
                    borderColor: commentSentiment === 'positive' ? colors.okBorder : colors.border,
                    borderWidth: 1.5,
                  }}
                >
                  <ThumbsUp size={16} weight="bold" color={commentSentiment === 'positive' ? colors.okText : colors.text} />
                  <Text style={{ fontSize: fontSize(13), fontWeight: '700', color: commentSentiment === 'positive' ? colors.okText : colors.text }}>
                    {locale === 'pl' ? 'Dostępne' : 'Accessible'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCommentSentiment('negative')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: commentSentiment === 'negative' ? colors.blockerBg : colors.surface,
                    borderColor: commentSentiment === 'negative' ? colors.blockerBorder : colors.border,
                    borderWidth: 1.5,
                  }}
                >
                  <ThumbsDown size={16} weight="bold" color={commentSentiment === 'negative' ? colors.blockerText : colors.text} />
                  <Text style={{ fontSize: fontSize(13), fontWeight: '700', color: commentSentiment === 'negative' ? colors.blockerText : colors.text }}>
                    {locale === 'pl' ? 'Bariera' : 'Barrier'}
                  </Text>
                </Pressable>
              </View>

              <Text style={{ color: colors.text, fontSize: fontSize(13), fontWeight: '700' }}>
                {locale === 'pl' ? 'Obszar:' : 'Category:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { id: 'entrance' as const, label: locale === 'pl' ? 'Wejście' : 'Entrance' },
                  { id: 'inside' as const, label: locale === 'pl' ? 'Wnętrze' : 'Inside' },
                  { id: 'toilet' as const, label: locale === 'pl' ? 'Toaleta PRM' : 'Accessible Toilet' },
                  { id: 'surroundings' as const, label: locale === 'pl' ? 'Otoczenie' : 'Surroundings' },
                  { id: 'general' as const, label: locale === 'pl' ? 'Ogólne' : 'General' },
                ].map((cat) => (
                  <Pressable
                    key={cat.id}
                    accessibilityRole="button"
                    onPress={() => setCommentCategory(cat.id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                      backgroundColor: commentCategory === cat.id ? colors.accent : colors.surface,
                      borderColor: commentCategory === cat.id ? colors.accent : colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{ fontSize: fontSize(12), fontWeight: '600', color: commentCategory === cat.id ? colors.accentText : colors.text }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={locale === 'pl' ? 'Opis weryfikacji (np. rampa ma odpowiedni kąt nachylenia)...' : 'Verification details...'}
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                    fontSize: fontSize(13.5),
                    minHeight: 60,
                  },
                ]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const photo = await pickPhotoAsync('camera', locale);
                    if (photo) setCommentPhoto(photo);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Camera size={16} weight="bold" color={colors.accent} />
                  <Text style={{ fontSize: fontSize(12.5), fontWeight: '700', color: colors.text }}>
                    {locale === 'pl' ? 'Aparat' : 'Camera'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const photo = await pickPhotoAsync('library', locale);
                    if (photo) setCommentPhoto(photo);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <ImageIcon size={16} weight="bold" color={colors.accent} />
                  <Text style={{ fontSize: fontSize(12.5), fontWeight: '700', color: colors.text }}>
                    {locale === 'pl' ? 'Galeria' : 'Gallery'}
                  </Text>
                </Pressable>
              </View>

              {commentPhoto ? (
                <View style={{ position: 'relative', height: 160, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Image source={{ uri: commentPhoto }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Usuń zdjęcie"
                    onPress={() => setCommentPhoto(null)}
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 6 }}
                  >
                    <Trash size={14} color="#FFF" weight="bold" />
                  </Pressable>
                </View>
              ) : null}

              <GovButton
                title={commentSubmitting ? (locale === 'pl' ? 'Wysyłanie na serwer...' : 'Uploading...') : (locale === 'pl' ? 'Opublikuj weryfikację ze zdjęciem' : 'Publish photo validation')}
                variant="primary"
                disabled={commentSubmitting}
                loading={commentSubmitting}
                onPress={handleAddPlaceComment}
              />
            </View>
          ) : null}

          {/* List of Place Validations & Photos */}
          <View style={{ marginTop: 14, gap: 10 }}>
            {placeComments.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: fontSize(13), fontStyle: 'italic' }}>
                {locale === 'pl'
                  ? 'Brak opublikowanych zdjęć dla tego miejsca. Bądź pierwszym, który zweryfikuje dostępność!'
                  : 'No photo reviews for this place yet. Be the first to validate accessibility!'}
              </Text>
            ) : (
              <>
                {(['negative', 'positive'] as const).map((sentiment) => {
                  const group = placeComments.filter((c) => c.sentiment === sentiment);
                  if (group.length === 0) return null;
                  const photos = group.filter((c) => c.photoUrl).length;
                  return (
                    <CredibilityNote
                      key={sentiment}
                      locale={locale}
                      assessment={credibilityFromReports({
                        supportCount: Math.max(0, group.length - 1),
                        photoCount: photos,
                      })}
                    />
                  );
                })}
                {placeComments.map((pc) => (
                <View
                  key={pc.id}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: pc.sentiment === 'positive' ? colors.okBorder : colors.blockerBorder,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize(13), fontWeight: '700', color: pc.sentiment === 'positive' ? colors.okText : colors.blockerText }}>
                      {pc.sentiment === 'positive'
                        ? (locale === 'pl' ? 'Dostępne' : 'Accessible')
                        : (locale === 'pl' ? 'Bariera' : 'Barrier')}
                      {pc.category ? ` · ${getLocalizedCategoryName(pc.category, locale)}` : ''}
                    </Text>
                    <Text style={{ fontSize: fontSize(11.5), color: colors.muted }}>
                      {pc.createdAt?.slice(0, 10)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: fontSize(13.5), color: colors.text, fontWeight: '500' }}>
                    {pc.comment}
                  </Text>
                  <Text style={{ fontSize: fontSize(12), color: colors.muted }}>
                    {locale === 'pl' ? 'Zgłoszenie mieszkańca' : 'Resident report'}
                  </Text>
                  {pc.photoUrl ? (
                    <View style={{ height: 160, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 4 }}>
                      <Image source={{ uri: pc.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  ) : null}
                </View>
                ))}
              </>
            )}
          </View>
        </GovCard>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
});

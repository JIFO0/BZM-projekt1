import { Stack } from 'expo-router';
import { credibilityFromReports } from '@krakow-bez-barier/core';
import * as Linking from 'expo-linking';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import {
  NotePencil,
  MapTrifold,
  Globe,
  ListChecks,
  Warning,
  CheckCircle,
  Camera,
  Image as ImageIcon,
  Trash,
  EnvelopeSimple,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { CredibilityNote } from '@/components/CredibilityNote';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { pickPhotoAsync } from '@/services/photo';
import {
  uploadPhotoToServer,
  createServerHazard,
  fetchServerHazards,
  type ServerRouteHazard,
} from '@/services/api';
import { triggerGentleHaptic } from '@/services/haptics';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export default function ReportCorrectionScreen() {
  const {
    locale,
    activeRouteReport,
    colors,
    fontSize,
    isHighContrast,
    increasedSpacing,
    dyslexicFont,
  } = useSession();

  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'hole' | 'obstacle' | 'flood' | 'surface' | 'other'>('obstacle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [serverHazards, setServerHazards] = useState<ServerRouteHazard[]>([]);

  const loadHazards = async () => {
    try {
      const list = await fetchServerHazards();
      setServerHazards(list);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    loadHazards();
  }, []);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert(
        locale === 'pl' ? 'Błąd' : locale === 'uk' ? 'Помилка' : 'Error',
        locale === 'pl'
          ? 'Podaj poprawny adres e-mail (jest wymagany do weryfikacji zgłoszenia).'
          : locale === 'uk'
            ? 'Введіть дійсну адресу електронної пошти.'
            : 'Please enter a valid email address (required for report verification).'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        locale === 'pl' ? 'Błąd' : locale === 'uk' ? 'Помилка' : 'Error',
        locale === 'pl'
          ? 'Wpisz treść uwagi lub przeszkody.'
          : locale === 'uk'
            ? 'Введіть опис зауваження або перешкоди.'
            : 'Please enter description of the barrier.'
      );
      return;
    }

    setIsSubmitting(true);
    let serverPhotoUrl: string | undefined;

    try {
      if (photoUri) {
        const uploadRes = await uploadPhotoToServer(photoUri, `hazard-${Date.now()}.jpg`);
        if (uploadRes) {
          serverPhotoUrl = uploadRes;
        }
      }

      let lat = 50.0619;
      let lon = 19.9373;
      if (activeRouteReport && activeRouteReport.findings.length > 0) {
        lat = activeRouteReport.findings[0]!.fact.subject.lat;
        lon = activeRouteReport.findings[0]!.fact.subject.lon;
      }

      await createServerHazard({
        description: description.trim(),
        category,
        email: trimmedEmail,
        position: { lat, lon },
        photoUrl: serverPhotoUrl,
      });

      await loadHazards();
      triggerGentleHaptic('report');

      setDescription('');
      setPhotoUri(null);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (e: any) {
      Alert.alert(
        locale === 'pl' ? 'Błąd serwera' : locale === 'uk' ? 'Помилка сервера' : 'Server error',
        e.message || 'Nie udało się zapisać zgłoszenia na serwerze.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
      Alert.alert(
        locale === 'pl' ? 'Błąd' : locale === 'uk' ? 'Помилка' : 'Error',
        locale === 'pl'
          ? `Nie można otworzyć linku: ${osmUrl}`
          : locale === 'uk'
            ? `Не вдалося відкрити посилання: ${osmUrl}`
            : `Cannot open link: ${osmUrl}`
      );
    }
  };

  const categories = [
    { id: 'obstacle' as const, label: locale === 'pl' ? 'Krawężnik / schody' : locale === 'uk' ? 'Бордюр / сходи' : 'Curb / steps' },
    { id: 'hole' as const, label: locale === 'pl' ? 'Wyrwa / dziura' : locale === 'uk' ? 'Вирва / яма' : 'Pothole / gap' },
    { id: 'surface' as const, label: locale === 'pl' ? 'Bruk / nawierzchnia' : locale === 'uk' ? 'Бруківка / покриття' : 'Surface / cobbles' },
    { id: 'flood' as const, label: locale === 'pl' ? 'Zalanie / kałuża' : locale === 'uk' ? 'Затоплення / калюжа' : 'Flooding / puddle' },
    { id: 'other' as const, label: locale === 'pl' ? 'Inna przeszkoda' : locale === 'uk' ? 'Інша перешкода' : 'Other barrier' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, title: t(locale, 'reportTitle') }} />
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

        {/* Required Email Field */}
        <GovCard variant="default">
          <View style={styles.cardHeaderRow}>
            <EnvelopeSimple size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.cardTitle, { color: colors.text, fontSize: fontSize(16) }]}
            >
              {locale === 'pl' ? 'Twój adres e-mail (wymagany)' : locale === 'uk' ? 'Ваша електронна пошта (обов’язково)' : 'Your email address (required)'}
            </Text>
          </View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={locale === 'pl' ? 'np. jan.kowalski@example.com' : 'e.g. john@example.com'}
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
                fontSize: fontSize(15),
                minHeight: 48,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          />
        </GovCard>

        {/* Hazard Submission Form */}
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

          {/* Category Chips */}
          <Text style={{ color: colors.text, fontSize: fontSize(13.5), fontWeight: '700', marginTop: 4 }}>
            {locale === 'pl' ? 'Kategoria przeszkody:' : locale === 'uk' ? 'Категорія перешкоди:' : 'Hazard category:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                onPress={() => setCategory(cat.id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: category === cat.id ? colors.accent : colors.background,
                  borderWidth: 1.5,
                  borderColor: category === cat.id ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize(12),
                    color: category === cat.id ? colors.accentText : colors.text,
                    fontWeight: '700',
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

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
                marginTop: 6,
              },
            ]}
          />

          {/* Photo attachment (public) */}
          <Text style={{ color: colors.text, fontSize: fontSize(13.5), fontWeight: '700', marginTop: 10 }}>
            {locale === 'pl' ? 'Dołącz zdjęcie przeszkody (widoczne dla wszystkich):' : locale === 'uk' ? 'Додати фото перешкоди:' : 'Attach hazard photo (public):'}
          </Text>

          <View style={styles.photoActionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const photo = await pickPhotoAsync('camera', locale);
                if (photo) setPhotoUri(photo);
              }}
              style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Camera size={16} weight="bold" color={colors.accent} />
              <Text style={[styles.photoBtnText, { color: colors.text, fontSize: fontSize(13) }]}>
                {locale === 'pl' ? 'Zrób zdjęcie (Aparat)' : locale === 'uk' ? 'Зробити фото' : 'Take photo'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const photo = await pickPhotoAsync('library', locale);
                if (photo) setPhotoUri(photo);
              }}
              style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <ImageIcon size={16} weight="bold" color={colors.accent} />
              <Text style={[styles.photoBtnText, { color: colors.text, fontSize: fontSize(13) }]}>
                {locale === 'pl' ? 'Wybierz z galerii' : locale === 'uk' ? 'Обрати з галереї' : 'From gallery'}
              </Text>
            </Pressable>
          </View>

          {photoUri ? (
            <View style={[styles.photoPreviewBox, { borderColor: colors.border }]}>
              <Image source={{ uri: photoUri }} style={styles.photoPreviewImg} resizeMode="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Usuń wybrane zdjęcie"
                onPress={() => setPhotoUri(null)}
                style={styles.removePhotoBtn}
              >
                <Trash size={14} color="#FFFFFF" weight="bold" />
              </Pressable>
            </View>
          ) : null}

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
            title={
              isSubmitting
                ? (locale === 'pl'
                  ? 'Wysyłanie na serwer...'
                  : locale === 'uk'
                    ? 'Надсилання на сервер...'
                    : 'Submitting to server...')
                : t(locale, 'reportSubmit')
            }
            icon={isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <PaperPlaneTilt size={18} color="#fff" weight="bold" />}
            variant="primary"
            disabled={isSubmitting}
            onPress={handleSubmit}
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

        {/* Server Hazards List */}
        <View style={styles.queueSection}>
          <View style={styles.cardHeaderRow}>
            <ListChecks size={20} color={colors.accent} weight="bold" />
            <Text
              accessibilityRole="header"
              style={[styles.queueTitle, { color: colors.text, fontSize: fontSize(17.5) }]}
            >
              {locale === 'pl' ? 'Zgłoszone przeszkody na serwerze:' : 'Reported obstacles on server:'} ({serverHazards.length})
            </Text>
          </View>

          {serverHazards.length === 0 ? (
            <GovCard variant="default">
              <Text style={[styles.body, { color: colors.muted, fontSize: fontSize(14) }]}>
                {locale === 'pl' ? 'Brak zgłoszonych przeszkód na serwerze.' : 'No reported obstacles on server.'}
              </Text>
            </GovCard>
          ) : (
            serverHazards.map((hazard) => (
              <GovCard key={hazard.id} variant="warning">
                <View style={styles.itemHeader}>
                  <View style={styles.statusBadgeRow}>
                    <Warning size={16} color={colors.warningText} weight="bold" />
                    <Text style={[styles.statusBadge, { color: colors.warningText, fontSize: fontSize(13) }]}>
                      {hazard.category ? `[${hazard.category.toUpperCase()}] ` : ''}
                      {hazard.status === 'confirmed'
                        ? (locale === 'pl' ? 'Zweryfikowana przeszkoda' : 'Confirmed hazard')
                        : hazard.status === 'resolved'
                          ? (locale === 'pl' ? 'Rozwiązana' : 'Resolved')
                          : (locale === 'pl' ? 'Zgłoszenie społeczne' : 'Community report')}
                    </Text>
                  </View>
                  <Text style={[styles.itemDate, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {hazard.createdAt.slice(0, 10)}
                  </Text>
                </View>
                <Text style={[styles.itemText, { color: colors.text, fontSize: fontSize(14) }]}>
                  {hazard.description}
                </Text>
                <CredibilityNote
                  locale={locale}
                  assessment={credibilityFromReports({
                    supportCount: hazard.stillHereCount ?? 0,
                    photoCount: hazard.photoUrl ? 1 : 0,
                  })}
                />
                {hazard.photoUrl ? (
                  <View style={[styles.reportPhotoContainer, { borderColor: colors.border }]}>
                    <Image source={{ uri: hazard.photoUrl }} style={styles.reportThumb} resizeMode="cover" />
                  </View>
                ) : null}
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
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  photoBtnText: {
    fontWeight: '700',
  },
  photoPreviewBox: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    height: 160,
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    padding: 6,
  },
  reportPhotoContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    height: 140,
  },
  reportThumb: {
    width: '100%',
    height: '100%',
  },
});

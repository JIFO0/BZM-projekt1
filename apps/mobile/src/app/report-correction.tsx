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

import {
  NotePencil,
  FloppyDisk,
  MapTrifold,
  Globe,
  ListChecks,
  Warning,
  CheckCircle,
  IdentificationCard,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Trash,
} from 'phosphor-react-native';
import { DebugModal } from '@/components/DebugModal';
import { CredibilityNote } from '@/components/CredibilityNote';
import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { GovFooter } from '@/components/GovFooter';
import { useState } from 'react';
import { KrakowHeader } from '@/components/KrakowHeader';
import { t } from '@/i18n/strings';
import { pickPhotoAsync } from '@/services/photo';
import { uploadPhotoToServer, createServerHazard } from '@/services/api';
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
    krakowCardUser,
    setKrakowCardModalVisible,
  } = useSession();

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleSubmitLocal = async () => {
    if (!description.trim()) {
      Alert.alert(
        locale === 'pl' ? 'Błąd' : locale === 'uk' ? 'Помилка' : 'Error',
        locale === 'pl'
          ? 'Wpisz treść uwagi lub przeszkody.'
          : locale === 'uk'
            ? 'Введіть опис зауваження або перешкоди.'
            : 'Please enter description of the issue or barrier.'
      );
      return;
    }

    setIsSubmitting(true);
    let serverPhotoUrl: string | undefined;

    try {
      if (photoUri) {
        const uploadRes = await uploadPhotoToServer(photoUri);
        if (uploadRes) {
          serverPhotoUrl = uploadRes;
        } else {
          serverPhotoUrl = photoUri;
        }
      }

      // Also create server hazard so it propagates to the community
      try {
        let lat = 50.0619;
        let lon = 19.9373;
        if (activeRouteReport && activeRouteReport.findings.length > 0) {
          lat = activeRouteReport.findings[0]!.fact.subject.lat;
          lon = activeRouteReport.findings[0]!.fact.subject.lon;
        }
        await createServerHazard({
          category: 'other',
          description: description.trim(),
          position: { lat, lon },
          photoUrl: serverPhotoUrl,
        });
      } catch {
        // Fallback gracefully
      }

      addLocalReport(description.trim(), {
        photoUrl: serverPhotoUrl,
      });

      setDescription('');
      setPhotoUri(null);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (e: any) {
      Alert.alert(locale === 'pl' ? 'Błąd' : 'Error', e.message || 'Nie udało się zapisać zgłoszenia.');
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

        {/* Karta Krakowska Resident Verification Banner */}
        {krakowCardUser ? (
          <GovCard variant="ok">
            <View style={styles.cardHeaderRow}>
              <ShieldCheck size={20} color={colors.okText} weight="fill" />
              <Text
                style={{
                  color: colors.okText,
                  fontWeight: '800',
                  fontSize: fontSize(14.5),
                }}
              >
                {t(locale, 'krakowCardVerifiedResident')}: {krakowCardUser.displayName}
              </Text>
            </View>
            <Text
              style={[
                styles.body,
                { color: colors.text, fontSize: fontSize(13), marginTop: 4 },
              ]}
            >
              {t(locale, 'krakowCardReportNoticeVerified')} (Karta: {krakowCardUser.cardNumber})
            </Text>
          </GovCard>
        ) : (
          <GovCard variant="default">
            <View style={styles.cardHeaderRow}>
              <IdentificationCard size={20} color={colors.accent} weight="bold" />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                  fontSize: fontSize(13.5),
                  flex: 1,
                }}
              >
                {t(locale, 'krakowCardReportNoticeAnon')}
              </Text>
            </View>
            <View style={{ marginTop: spacing.xs }}>
              <GovButton
                title={t(locale, 'krakowCardLoginBtn')}
                icon={<IdentificationCard size={16} color="#FFFFFF" weight="bold" />}
                variant="primary"
                onPress={() => setKrakowCardModalVisible(true)}
              />
            </View>
          </GovCard>
        )}

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

          {/* Photo attachment (public) */}
          <Text style={{ color: colors.text, fontSize: fontSize(13.5), fontWeight: '700', marginTop: 10 }}>
            {locale === 'pl' ? 'Dołącz zdjęcie przeszkody (widoczne dla wszystkich):' : 'Attach hazard photo (public):'}
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
                {locale === 'pl' ? 'Zrób zdjęcie (Aparat)' : 'Take photo'}
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
                {locale === 'pl' ? 'Wybierz z galerii' : 'From gallery'}
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
            title={isSubmitting ? (locale === 'pl' ? 'Wysyłanie...' : 'Submitting...') : t(locale, 'reportSubmit')}
            icon={isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <FloppyDisk size={18} color="#fff" weight="bold" />}
            variant="primary"
            disabled={isSubmitting}
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
                      {t(locale, 'localReportUnverified')}
                    </Text>
                  </View>
                  <Text style={[styles.itemDate, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {report.createdAt.slice(0, 10)}
                  </Text>
                </View>
                <Text style={[styles.itemText, { color: colors.text, fontSize: fontSize(14) }]}>
                  {report.description}
                </Text>
                <CredibilityNote
                  locale={locale}
                  assessment={credibilityFromReports({
                    supportCount: report.stillHereCount ?? 0,
                    photoCount: report.photoUrl ? 1 : 0,
                  })}
                />
                {report.photoUrl ? (
                  <View style={[styles.reportPhotoContainer, { borderColor: colors.border }]}>
                    <Image source={{ uri: report.photoUrl }} style={styles.reportThumb} resizeMode="cover" />
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

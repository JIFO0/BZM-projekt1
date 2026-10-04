import {
  ArrowCounterClockwise,
  CalendarBlank,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  Info,
  MapPin,
  Warning,
  WarningOctagon,
  X,
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GovCard } from '@/components/GovCard';
import { t } from '@/i18n/strings';
import { resolveBackendApiUrl, type ServerRouteHazard } from '@/services/api';
import { triggerGentleHaptic } from '@/services/haptics';
import type { LocalReport } from '@/state/session';
import { useSession } from '@/state/session';

export interface HazardDetailModalProps {
  visible: boolean;
  hazard: ServerRouteHazard | LocalReport | null;
  onClose: () => void;
  onVote: (hazardId: string, action: 'still_here' | 'fixed' | 'unset', voterEmail: string) => Promise<{ success: boolean; message?: string }>;
  isVoting?: boolean;
}

export function HazardDetailModal({
  visible,
  hazard,
  onClose,
  onVote,
  isVoting = false,
}: HazardDetailModalProps) {
  const { colors, fontSize, isHighContrast, locale, userAccount } = useSession();

  const [voterEmail, setVoterEmail] = useState<string>('');
  const [activeAction, setActiveAction] = useState<'still_here' | 'fixed' | 'unset' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'warning' | 'info'; message: string } | null>(null);
  const [showFullPhoto, setShowFullPhoto] = useState<boolean>(false);

  // Pre-fill email from account or previous session
  useEffect(() => {
    setVoterEmail((prev) => userAccount?.email || prev || 'mieszkaniec@krakow.pl');
    setFeedback(null);
    setActiveAction(null);
  }, [visible, userAccount?.email]);

  if (!hazard) return null;

  // Resolve photo URL (handle relative /uploads/... or absolute)
  const resolvePhoto = (rawUrl?: string): string | undefined => {
    if (!rawUrl) return undefined;
    if (rawUrl.startsWith('data:')) return rawUrl;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    const base = resolveBackendApiUrl();
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    return `${cleanBase}${cleanPath}`;
  };

  const photoUri = resolvePhoto(hazard.photoUrl);

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'obstacle':
        return t(locale, 'hazardCatObstacle');
      case 'hole':
        return t(locale, 'hazardCatHole');
      case 'surface':
        return t(locale, 'hazardCatSurface');
      case 'flood':
        return t(locale, 'hazardCatFlood');
      case 'other':
      default:
        return t(locale, 'hazardCatOther');
    }
  };

  const handleCastVote = async (action: 'still_here' | 'fixed' | 'unset') => {
    setFeedback(null);
    const trimmedEmail = voterEmail.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setFeedback({
        type: 'warning',
        message: t(locale, 'voteEmailRequired'),
      });
      triggerGentleHaptic('default');
      return;
    }

    setActiveAction(action);
    triggerGentleHaptic('default');

    try {
      const res = await onVote(hazard.id, action, trimmedEmail);
      if (res.success) {
        triggerGentleHaptic('location');
        if (action === 'still_here') {
          setFeedback({ type: 'ok', message: t(locale, 'voteSuccessStillHere') });
        } else if (action === 'fixed') {
          setFeedback({ type: 'ok', message: t(locale, 'voteSuccessFixed') });
        } else {
          setFeedback({ type: 'info', message: t(locale, 'voteSuccessUnset') });
        }
      } else {
        const isConflict = res.message && (res.message.includes('already') || res.message.includes('409'));
        setFeedback({
          type: isConflict ? 'info' : 'warning',
          message: isConflict ? t(locale, 'voteAlreadyCast') : (res.message || 'Wystąpił błąd podczas rejestracji głosu.'),
        });
      }
    } catch (err: any) {
      const isConflict = err.message && (err.message.includes('already') || err.message.includes('409'));
      setFeedback({
        type: isConflict ? 'info' : 'warning',
        message: isConflict ? t(locale, 'voteAlreadyCast') : (err.message || 'Nie udało się połączyć z serwerem.'),
      });
    } finally {
      setActiveAction(null);
    }
  };

  const stillCount = (hazard as any).stillHereCount ?? 0;
  const fixedCount = (hazard as any).fixedCount ?? 0;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'cancel')}
            onPress={onClose}
            style={styles.modalDismiss}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: isHighContrast ? 2.5 : 1.5,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.headerBadge, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                  <Warning size={16} weight="bold" color={colors.warningText} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.text, fontSize: fontSize(17) }]}>
                  {t(locale, 'hazardDetailTitle')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(locale, 'cancel')}
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: isHighContrast ? 2 : 1,
                  },
                ]}
              >
                <X size={18} weight="bold" color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Category chip & Date row */}
              <View style={styles.metaRow}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
                  <Text style={[styles.categoryBadgeText, { color: colors.accent, fontSize: fontSize(12) }]}>
                    {getCategoryLabel(hazard.category)}
                  </Text>
                </View>

                {hazard.createdAt ? (
                  <View style={styles.dateWrap}>
                    <CalendarBlank size={13} color={colors.muted} />
                    <Text style={[styles.dateText, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                      {hazard.createdAt.slice(0, 10)}
                    </Text>
                  </View>
                ) : null}

                {hazard.position ? (
                  <View style={styles.coordsWrap}>
                    <MapPin size={13} color={colors.muted} />
                    <Text style={[styles.coordsText, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                      {hazard.position.lat.toFixed(5)}, {hazard.position.lon.toFixed(5)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Hazard Title / Description */}
              <View style={[styles.descCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.descText, { color: colors.text, fontSize: fontSize(15.5) }]}>
                  {hazard.description || t(locale, 'pointOnMap')}
                </Text>
              </View>

              {/* Photo Evidence (if attached) */}
              {photoUri ? (
                <View style={styles.photoSection}>
                  <Text style={[styles.fieldLabel, { color: colors.muted, fontSize: fontSize(12) }]}>
                    Zdjęcie przeszkody (zgłoszenie mieszkańców):
                  </Text>
                  <Pressable
                    accessibilityRole="image"
                    accessibilityLabel="Powiększ zdjęcie zgłoszenia"
                    onPress={() => setShowFullPhoto(true)}
                    style={[
                      styles.photoWrapper,
                      {
                        borderColor: colors.border,
                        borderWidth: isHighContrast ? 2 : 1,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.hazardPhoto}
                      resizeMode="cover"
                    />
                    <View style={[styles.photoZoomBadge, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]}>
                      <Eye size={13} weight="bold" color="#FFF" />
                      <Text style={styles.photoZoomText}>Dotknij, aby powiększyć</Text>
                    </View>
                  </Pressable>
                </View>
              ) : null}

              {/* Current Community Confirmations Stats */}
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: colors.warningBg,
                      borderColor: colors.warningBorder,
                      borderWidth: isHighContrast ? 2 : 1,
                    },
                  ]}
                >
                  <Warning size={15} weight="bold" color={colors.warningText} />
                  <Text style={[styles.statNum, { color: colors.warningText, fontSize: fontSize(14) }]}>
                    {stillCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.warningText, fontSize: fontSize(11) }]}>
                    {t(locale, 'btnStillHere')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: colors.okBg,
                      borderColor: colors.okBorder,
                      borderWidth: isHighContrast ? 2 : 1,
                    },
                  ]}
                >
                  <CheckCircle size={15} weight="bold" color={colors.okText} />
                  <Text style={[styles.statNum, { color: colors.okText, fontSize: fontSize(14) }]}>
                    {fixedCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.okText, fontSize: fontSize(11) }]}>
                    {t(locale, 'btnFixed')}
                  </Text>
                </View>
              </View>

              {/* Voting / Verification Section */}
              <View
                style={[
                  styles.votingCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: isHighContrast ? colors.accent : colors.border,
                    borderWidth: isHighContrast ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.votingHeader}>
                  <Text style={[styles.votingTitle, { color: colors.text, fontSize: fontSize(14.5) }]}>
                    Zweryfikuj tę przeszkodę
                  </Text>
                  <Text style={[styles.votingSubtitle, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                    {t(locale, 'voterEmailNotice')}
                  </Text>
                </View>

                {/* Voter Email Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <EnvelopeSimple size={14} color={colors.accent} weight="bold" />
                    <Text style={[styles.fieldLabel, { color: colors.text, fontSize: fontSize(12.5) }]}>
                      {t(locale, 'voterEmailLabel')}
                    </Text>
                  </View>
                  <TextInput
                    value={voterEmail}
                    onChangeText={setVoterEmail}
                    placeholder={t(locale, 'voterEmailPlaceholder')}
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.emailInput,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        fontSize: fontSize(13.5),
                        borderWidth: isHighContrast ? 2 : 1,
                      },
                    ]}
                  />
                </View>

                {/* Feedback message banner */}
                {feedback ? (
                  <GovCard variant={feedback.type === 'ok' ? 'ok' : feedback.type === 'warning' ? 'warning' : 'accent'}>
                    <View style={styles.feedbackRow}>
                      {feedback.type === 'ok' ? (
                        <Check size={16} weight="bold" color={colors.okText} />
                      ) : feedback.type === 'warning' ? (
                        <WarningOctagon size={16} weight="bold" color={colors.warningText} />
                      ) : (
                        <Info size={16} weight="bold" color={colors.accent} />
                      )}
                      <Text
                        style={[
                          styles.feedbackText,
                          {
                            color: feedback.type === 'ok' ? colors.okText : feedback.type === 'warning' ? colors.warningText : colors.text,
                            fontSize: fontSize(12.5),
                          },
                        ]}
                      >
                        {feedback.message}
                      </Text>
                    </View>
                  </GovCard>
                ) : null}

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsCol}>
                  <View style={styles.actionButtonsRow}>
                    {/* Still Here Button */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t(locale, 'btnStillHere')} (${stillCount})`}
                      disabled={isVoting}
                      onPress={() => handleCastVote('still_here')}
                      style={[
                        styles.actionBtn,
                        styles.stillHereBtn,
                        {
                          backgroundColor: colors.warningBg,
                          borderColor: colors.warningBorder,
                          borderWidth: isHighContrast ? 2.5 : 1.5,
                        },
                      ]}
                    >
                      {isVoting && activeAction === 'still_here' ? (
                        <ActivityIndicator size="small" color={colors.warningText} />
                      ) : (
                        <>
                          <Warning size={17} weight="bold" color={colors.warningText} />
                          <Text style={[styles.actionBtnText, { color: colors.warningText, fontSize: fontSize(13) }]}>
                            {t(locale, 'btnStillHere')}
                          </Text>
                          {stillCount > 0 ? (
                            <View style={[styles.countBadge, { backgroundColor: colors.warningBorder }]}>
                              <Text style={[styles.countBadgeText, { color: colors.warningText }]}>
                                {stillCount}
                              </Text>
                            </View>
                          ) : null}
                        </>
                      )}
                    </Pressable>

                    {/* Fixed Button */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t(locale, 'btnFixed')} (${fixedCount})`}
                      disabled={isVoting}
                      onPress={() => handleCastVote('fixed')}
                      style={[
                        styles.actionBtn,
                        styles.fixedBtn,
                        {
                          backgroundColor: colors.okBg,
                          borderColor: colors.okBorder,
                          borderWidth: isHighContrast ? 2.5 : 1.5,
                        },
                      ]}
                    >
                      {isVoting && activeAction === 'fixed' ? (
                        <ActivityIndicator size="small" color={colors.okText} />
                      ) : (
                        <>
                          <CheckCircle size={17} weight="bold" color={colors.okText} />
                          <Text style={[styles.actionBtnText, { color: colors.okText, fontSize: fontSize(13) }]}>
                            {t(locale, 'btnFixed')}
                          </Text>
                          {fixedCount > 0 ? (
                            <View style={[styles.countBadge, { backgroundColor: colors.okBorder }]}>
                              <Text style={[styles.countBadgeText, { color: colors.okText }]}>
                                {fixedCount}
                              </Text>
                            </View>
                          ) : null}
                        </>
                      )}
                    </Pressable>
                  </View>

                  {/* Undo Vote Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t(locale, 'btnUndoVote')}
                    disabled={isVoting}
                    onPress={() => handleCastVote('unset')}
                    style={[
                      styles.undoBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderWidth: isHighContrast ? 2 : 1,
                      },
                    ]}
                  >
                    {isVoting && activeAction === 'unset' ? (
                      <ActivityIndicator size="small" color={colors.muted} />
                    ) : (
                      <>
                        <ArrowCounterClockwise size={14} weight="bold" color={colors.muted} />
                        <Text style={[styles.undoBtnText, { color: colors.muted, fontSize: fontSize(12) }]}>
                          {t(locale, 'btnUndoVote')}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Full-screen Photo Preview Modal */}
      {photoUri ? (
        <Modal
          visible={showFullPhoto}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFullPhoto(false)}
        >
          <View style={styles.photoModalBackdrop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zamknij podgląd zdjęcia"
              onPress={() => setShowFullPhoto(false)}
              style={styles.photoModalClose}
            >
              <X size={22} color="#FFF" weight="bold" />
            </Pressable>
            <Image
              source={{ uri: photoUri }}
              style={styles.photoModalImg}
              resizeMode="contain"
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
    maxHeight: '88%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 12,
    paddingBottom: 36,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontWeight: '700',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontWeight: '600',
  },
  coordsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  descCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  descText: {
    lineHeight: 22,
    fontWeight: '600',
  },
  photoSection: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '700',
  },
  photoWrapper: {
    height: 190,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  hazardPhoto: {
    width: '100%',
    height: '100%',
  },
  photoZoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  photoZoomText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statNum: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontWeight: '700',
  },
  votingCard: {
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  votingHeader: {
    gap: 2,
  },
  votingTitle: {
    fontWeight: '800',
  },
  votingSubtitle: {
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 42,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 17,
  },
  actionButtonsCol: {
    gap: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  stillHereBtn: {},
  fixedBtn: {},
  actionBtnText: {
    fontWeight: '800',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  undoBtn: {
    minHeight: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  undoBtnText: {
    fontWeight: '700',
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  photoModalImg: {
    width: '94%',
    height: '80%',
  },
});

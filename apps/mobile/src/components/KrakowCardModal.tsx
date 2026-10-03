import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CheckCircle,
  IdentificationCard,
  Info,
  ShieldCheck,
  SignOut,
  Sparkle,
  UserCheck,
  X,
} from 'phosphor-react-native';
import { useState } from 'react';

import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export function KrakowCardModal() {
  const {
    locale,
    colors,
    isHighContrast,
    fontSize,
    increasedSpacing,
    krakowCardUser,
    krakowCardModalVisible,
    setKrakowCardModalVisible,
    loginWithKrakowCard,
    logoutKrakowCard,
  } = useSession();

  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const handleFillSample = () => {
    setIdentifier('9210 5821 9043 1184');
    setDisplayName('Jan Kowalski');
    setPassword('krakow2026!');
  };

  const handleLogin = () => {
    loginWithKrakowCard({
      identifier: identifier.trim() || '9210 5821 9043 1184',
      name: displayName.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  const handleLogout = () => {
    logoutKrakowCard();
    setIdentifier('');
    setDisplayName('');
    setPassword('');
  };

  const closeModal = () => {
    setKrakowCardModalVisible(false);
  };

  const minTouch = increasedSpacing ? spacing.touchExpanded : spacing.touch;

  return (
    <Modal
      visible={krakowCardModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: isHighContrast ? colors.focus : colors.border,
              borderWidth: isHighContrast ? 3 : 1.5,
              padding: increasedSpacing ? 24 : 18,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <KrakowCoatOfArms size="small" showTitle={false} />
              <View style={styles.headerTitles}>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      fontSize: fontSize(18),
                      fontWeight: '800',
                    },
                  ]}
                >
                  {krakowCardUser
                    ? t(locale, 'krakowCardLoggedInTitle')
                    : t(locale, 'krakowCardLoginTitle')}
                </Text>
                <Text
                  style={[
                    styles.subTitle,
                    {
                      color: colors.muted,
                      fontSize: fontSize(12),
                    },
                  ]}
                >
                  {t(locale, 'krakowCardSubtitle')}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'krakowCardClose')}
              onPress={closeModal}
              style={[
                styles.closeButton,
                {
                  borderColor: colors.border,
                  backgroundColor: isHighContrast ? colors.background : 'rgba(0,0,0,0.05)',
                  minWidth: minTouch,
                  minHeight: minTouch,
                },
              ]}
            >
              <X size={20} color={colors.text} weight="bold" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { gap: increasedSpacing ? 18 : spacing.stack },
            ]}
          >
            {krakowCardUser ? (
              /* VIEW WHEN LOGGED IN */
              <>
                {/* Visual Digital Krakow Card */}
                <View
                  style={[
                    styles.digitalCard,
                    {
                      backgroundColor: isHighContrast ? colors.background : '#005CA9',
                      borderColor: isHighContrast ? colors.focus : '#38BDF8',
                      borderWidth: isHighContrast ? 3 : 2,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`Karta Krakowska mieszkańca ${krakowCardUser.displayName}, numer ${krakowCardUser.cardNumber}, status aktywny.`}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardBrand}>
                      <KrakowCoatOfArms size="small" showTitle={false} />
                      <View>
                        <Text style={[styles.cardCityName, { fontSize: fontSize(10.5) }]}>
                          MIASTO KRAKÓW
                        </Text>
                        <Text style={[styles.cardTitleText, { fontSize: fontSize(14) }]}>
                          KARTA KRAKOWSKA
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardStatusChip}>
                      <ShieldCheck size={14} color="#22C55E" weight="fill" />
                      <Text style={[styles.cardStatusText, { fontSize: fontSize(10) }]}>
                        AKTYWNA
                      </Text>
                    </View>
                  </View>

                  {/* Card User Info */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardLabel, { fontSize: fontSize(9.5) }]}>
                      POSIADACZ KARTY
                    </Text>
                    <Text style={[styles.cardOwnerName, { fontSize: fontSize(17) }]}>
                      {krakowCardUser.displayName.toUpperCase()}
                    </Text>

                    <View style={styles.cardMetaRow}>
                      <View>
                        <Text style={[styles.cardLabel, { fontSize: fontSize(9.5) }]}>
                          NUMER KARTY
                        </Text>
                        <Text style={[styles.cardNumberText, { fontSize: fontSize(13.5) }]}>
                          {krakowCardUser.cardNumber}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.cardLabel, { fontSize: fontSize(9.5) }]}>
                          {t(locale, 'krakowCardValidUntil').toUpperCase()}
                        </Text>
                        <Text style={[styles.cardValidText, { fontSize: fontSize(13) }]}>
                          {krakowCardUser.validUntil}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Mock Barcode */}
                  <View style={styles.cardFooter}>
                    <View style={styles.barcodeLines}>
                      {[1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1].map(
                        (w, i) => (
                          <View
                            key={i}
                            style={[
                              styles.barcodeBar,
                              {
                                width: w,
                                backgroundColor: isHighContrast ? colors.text : '#FFFFFF',
                              },
                            ]}
                          />
                        ),
                      )}
                    </View>
                    <Text style={[styles.barcodeCode, { fontSize: fontSize(9) }]}>
                      KK-{krakowCardUser.cardNumber.replace(/\s+/g, '')}
                    </Text>
                  </View>
                </View>

                {/* Verified Resident Information */}
                <GovCard variant="ok">
                  <View style={styles.verifiedRow}>
                    <CheckCircle size={22} color={colors.okText} weight="bold" />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.verifiedTitle,
                          { color: colors.okText, fontSize: fontSize(14.5) },
                        ]}
                      >
                        {t(locale, 'krakowCardVerifiedResident')}
                      </Text>
                      <Text
                        style={[
                          styles.verifiedDesc,
                          { color: colors.text, fontSize: fontSize(12.5) },
                        ]}
                      >
                        {t(locale, 'krakowCardReportNoticeVerified')}
                      </Text>
                    </View>
                  </View>
                </GovCard>

                {/* Benefits List */}
                <GovCard variant="default">
                  <Text
                    accessibilityRole="header"
                    style={[
                      styles.benefitsHeader,
                      { color: colors.text, fontSize: fontSize(14) },
                    ]}
                  >
                    {t(locale, 'krakowCardBenefitsTitle')}
                  </Text>
                  <View style={styles.benefitItem}>
                    <Sparkle size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'krakowCardBenefit1')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Sparkle size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'krakowCardBenefit2')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Sparkle size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'krakowCardBenefit3')}
                    </Text>
                  </View>
                </GovCard>

                {/* Logout Button */}
                <GovButton
                  title={t(locale, 'krakowCardLogout')}
                  icon={<SignOut size={18} color={colors.warningText} weight="bold" />}
                  variant="outline"
                  onPress={handleLogout}
                />
              </>
            ) : (
              /* VIEW WHEN NOT LOGGED IN */
              <>
                {/* Educational Info Card */}
                <GovCard variant="accent">
                  <View style={styles.infoCardHeader}>
                    <IdentificationCard size={22} color={colors.accent} weight="bold" />
                    <Text
                      accessibilityRole="header"
                      style={[styles.infoCardTitle, { color: colors.text, fontSize: fontSize(14.5) }]}
                    >
                      {t(locale, 'krakowCard')} • Kraków Bez Barier
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.infoCardBody,
                      { color: colors.text, fontSize: fontSize(13), lineHeight: fontSize(19) },
                    ]}
                  >
                    {t(locale, 'krakowCardLoginDesc')}
                  </Text>
                </GovCard>

                {/* Mockup Notice */}
                <GovCard variant="default">
                  <View style={styles.mockupNoticeRow}>
                    <Info size={18} color={colors.accent} weight="bold" />
                    <Text
                      style={[
                        styles.mockupNoticeText,
                        { color: colors.muted, fontSize: fontSize(12), lineHeight: fontSize(17) },
                      ]}
                    >
                      {t(locale, 'krakowCardMockupNotice')}
                    </Text>
                  </View>
                </GovCard>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                  {/* Field 1: Identifier */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSize(13) },
                      ]}
                    >
                      {t(locale, 'krakowCardIdentifierLabel')}
                    </Text>
                    <TextInput
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder={t(locale, 'krakowCardIdentifierPlaceholder')}
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          fontSize: fontSize(14),
                          borderWidth: isHighContrast ? 2.5 : 1.5,
                        },
                      ]}
                    />
                  </View>

                  {/* Field 2: Name */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSize(13) },
                      ]}
                    >
                      {t(locale, 'krakowCardNameLabel')}
                    </Text>
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder={t(locale, 'krakowCardNamePlaceholder')}
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          fontSize: fontSize(14),
                          borderWidth: isHighContrast ? 2.5 : 1.5,
                        },
                      ]}
                    />
                  </View>

                  {/* Field 3: Password */}
                  <View style={styles.inputGroup}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSize(13) },
                      ]}
                    >
                      {t(locale, 'krakowCardPasswordLabel')}
                    </Text>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t(locale, 'krakowCardPasswordPlaceholder')}
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          fontSize: fontSize(14),
                          borderWidth: isHighContrast ? 2.5 : 1.5,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Helper preset button */}
                <GovButton
                  title={t(locale, 'krakowCardQuickDemoBtn')}
                  icon={<UserCheck size={18} color={colors.accent} weight="bold" />}
                  variant="outline"
                  onPress={handleFillSample}
                />

                {/* Submit login button */}
                <GovButton
                  title={t(locale, 'krakowCardLoginBtn')}
                  icon={<IdentificationCard size={18} color="#FFFFFF" weight="bold" />}
                  variant="primary"
                  onPress={handleLogin}
                />
              </>
            )}

            {/* Close Button */}
            <GovButton
              title={t(locale, 'krakowCardClose')}
              variant="outline"
              onPress={closeModal}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    lineHeight: 22,
  },
  subTitle: {
    marginTop: 2,
  },
  closeButton: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  digitalCard: {
    borderRadius: 14,
    padding: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCityName: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  cardStatusText: {
    color: '#22C55E',
    fontWeight: '800',
  },
  cardBody: {
    marginVertical: 4,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardOwnerName: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardValidText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 18,
  },
  barcodeBar: {
    height: '100%',
    borderRadius: 0.5,
  },
  barcodeCode: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  verifiedTitle: {
    fontWeight: '800',
    marginBottom: 2,
  },
  verifiedDesc: {
    lineHeight: 18,
  },
  benefitsHeader: {
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  benefitText: {
    flex: 1,
    lineHeight: 18,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontWeight: '800',
  },
  infoCardBody: {
    marginTop: 2,
  },
  mockupNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mockupNoticeText: {
    flex: 1,
  },
  formContainer: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CheckCircle,
  Envelope,
  LockKey,
  ShieldCheck,
  SignIn,
  SignOut,
  User,
  UserCheck,
  UserCircle,
  X,
} from 'phosphor-react-native';
import { useState } from 'react';

import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

export function UserAccountModal() {
  const {
    locale,
    colors,
    isHighContrast,
    fontSize,
    increasedSpacing,
    userAccount,
    userModalVisible,
    setUserModalVisible,
    loginUser,
    logoutUser,
  } = useSession();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const handleFillSample = () => {
    setEmail('jan.kowalski@example.com');
    setDisplayName('Jan Kowalski');
    setPassword('haslo123');
  };

  const handleLogin = () => {
    loginUser({
      email: email.trim() || undefined,
      name: displayName.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  const handleLogout = () => {
    logoutUser();
    setEmail('');
    setDisplayName('');
    setPassword('');
  };

  const closeModal = () => {
    setUserModalVisible(false);
  };

  const minTouch = increasedSpacing ? spacing.touchExpanded : spacing.touch;

  return (
    <Modal
      visible={userModalVisible}
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
              <View
                style={[
                  styles.headerIconWrapper,
                  {
                    backgroundColor: userAccount
                      ? (isHighContrast ? colors.accent : colors.okBg)
                      : (isHighContrast ? colors.background : colors.badgeBg),
                    borderColor: userAccount ? colors.okBorder : colors.accent,
                  },
                ]}
              >
                <User
                  size={24}
                  color={userAccount ? (isHighContrast ? colors.accentText : colors.okText) : colors.accent}
                  weight="bold"
                />
              </View>
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
                  {userAccount
                    ? t(locale, 'userAccountLoggedInTitle')
                    : t(locale, 'userAccountLoginTitle')}
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
                  {t(locale, 'userAccountSubtitle')}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'userAccountClose')}
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
            {/* Prominent Privacy Information Notice (Zero server data stored) */}
            <GovCard variant="ok">
              <View style={styles.privacyRow}>
                <ShieldCheck size={22} color={colors.okText} weight="bold" />
                <View style={{ flex: 1 }}>
                  <Text
                    accessibilityRole="header"
                    style={[
                      styles.privacyTitle,
                      { color: colors.okText, fontSize: fontSize(14.5) },
                    ]}
                  >
                    {locale === 'pl'
                      ? 'Żadne dane nie będą zapisywane na serwerze'
                      : locale === 'uk'
                        ? 'Жодні дані не зберігатимуться на сервері'
                        : 'No user data will be stored on the server'}
                  </Text>
                  <Text
                    style={[
                      styles.privacyDesc,
                      { color: colors.text, fontSize: fontSize(12.5) },
                    ]}
                  >
                    {locale === 'pl'
                      ? 'Aplikacja działa w trybie demonstracyjnym (mockup). Możesz zalogować się lub utworzyć konto dowolnym adresem e-mail i hasłem. Wszystkie dane pozostają wyłącznie w pamięci Twojego urządzenia.'
                      : locale === 'uk'
                        ? 'Це демонстраційний макет (mockup). Ви можете увійти з будь-яким email та паролем. Усі дані обробляються виключно локально.'
                        : 'This app runs as a demonstration mockup. You can sign in or create an account with any email and password. All data remains strictly local to your device.'}
                  </Text>
                </View>
              </View>
            </GovCard>

            {userAccount ? (
              /* VIEW WHEN LOGGED IN */
              <>
                {/* Visual User Profile Card */}
                <View
                  style={[
                    styles.profileCard,
                    {
                      backgroundColor: isHighContrast ? colors.background : colors.surface,
                      borderColor: isHighContrast ? colors.focus : colors.accent,
                      borderWidth: isHighContrast ? 3 : 1.5,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`Zalogowano jako ${userAccount.displayName}, adres ${userAccount.email}`}
                >
                  <View style={styles.profileCardHeader}>
                    <UserCircle size={44} color={colors.accent} weight="duotone" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.profileName, { color: colors.text, fontSize: fontSize(16) }]}>
                        {userAccount.displayName}
                      </Text>
                      <View style={styles.emailRow}>
                        <Envelope size={14} color={colors.muted} weight="bold" />
                        <Text style={[styles.profileEmail, { color: colors.muted, fontSize: fontSize(13) }]}>
                          {userAccount.email}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}>
                      <CheckCircle size={13} color={colors.okText} weight="fill" />
                      <Text style={[styles.statusChipText, { color: colors.okText, fontSize: fontSize(10.5) }]}>
                        MOCKUP
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Account Details & Benefits */}
                <GovCard variant="default">
                  <Text
                    accessibilityRole="header"
                    style={[
                      styles.benefitsHeader,
                      { color: colors.text, fontSize: fontSize(14) },
                    ]}
                  >
                    {t(locale, 'userAccountBenefitsTitle')}
                  </Text>
                  <View style={styles.benefitItem}>
                    <ShieldCheck size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'userAccountBenefit1')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <CheckCircle size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'userAccountBenefit2')}
                    </Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <UserCheck size={16} color={colors.accent} weight="bold" />
                    <Text
                      style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12.5) }]}
                    >
                      {t(locale, 'userAccountBenefit3')}
                    </Text>
                  </View>
                </GovCard>

                {/* Logout Button */}
                <GovButton
                  title={t(locale, 'userAccountLogout')}
                  icon={<SignOut size={18} color={colors.warningText} weight="bold" />}
                  variant="outline"
                  onPress={handleLogout}
                />
              </>
            ) : (
              /* VIEW WHEN NOT LOGGED IN */
              <>
                {/* Form Fields */}
                <View style={styles.formContainer}>
                  {/* Field 1: Email */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <Envelope size={15} color={colors.accent} weight="bold" />
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.text, fontSize: fontSize(13) },
                        ]}
                      >
                        {t(locale, 'userAccountEmailLabel')}
                      </Text>
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t(locale, 'userAccountEmailPlaceholder')}
                      placeholderTextColor={colors.muted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
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

                  {/* Field 2: Name (optional) */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelRow}>
                      <User size={15} color={colors.accent} weight="bold" />
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.text, fontSize: fontSize(13) },
                        ]}
                      >
                        {t(locale, 'userAccountNameLabel')}
                      </Text>
                    </View>
                    <TextInput
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder={t(locale, 'userAccountNamePlaceholder')}
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
                    <View style={styles.inputLabelRow}>
                      <LockKey size={15} color={colors.accent} weight="bold" />
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.text, fontSize: fontSize(13) },
                        ]}
                      >
                        {t(locale, 'userAccountPasswordLabel')}
                      </Text>
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t(locale, 'userAccountPasswordPlaceholder')}
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
                  title={t(locale, 'userAccountQuickDemoBtn')}
                  icon={<UserCheck size={18} color={colors.accent} weight="bold" />}
                  variant="outline"
                  onPress={handleFillSample}
                />

                {/* Submit login button */}
                <GovButton
                  title={t(locale, 'userAccountLoginBtn')}
                  icon={<SignIn size={18} color="#FFFFFF" weight="bold" />}
                  variant="primary"
                  onPress={handleLogin}
                />
              </>
            )}

            {/* Close Button */}
            <GovButton
              title={t(locale, 'userAccountClose')}
              variant="outline"
              onPress={closeModal}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Backwards compatibility export
export { UserAccountModal as KrakowCardModal };

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
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
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
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  privacyTitle: {
    fontWeight: '800',
    marginBottom: 2,
  },
  privacyDesc: {
    lineHeight: 18,
  },
  profileCard: {
    borderRadius: 14,
    padding: spacing.md,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileName: {
    fontWeight: '800',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  profileEmail: {
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChipText: {
    fontWeight: '800',
    letterSpacing: 0.5,
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
  formContainer: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

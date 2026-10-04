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
  Check,
  CheckCircle,
  Envelope,
  Gear,
  LockKey,
  PathIcon as Path,
  PersonArmsSpread,
  Prohibit,
  ShieldCheck,
  SignIn,
  SignOut,
  Translate,
  User,
  UserCheck,
  UserCircle,
  Warning,
  X,
} from 'phosphor-react-native';
import { useState } from 'react';

import { GovButton } from '@/components/GovButton';
import { GovCard } from '@/components/GovCard';
import { t, type Locale } from '@/i18n/strings';
import { useSession, type BarrierViewMode } from '@/state/session';
import { spacing } from '@/theme/tokens';

export function SettingsModal() {
  const {
    locale,
    setLocale,
    colors,
    isHighContrast,
    fontSize,
    increasedSpacing,
    barrierViewMode,
    setBarrierViewMode,
    userAccount,
    loginUser,
    logoutUser,
    settingsModalVisible,
    setSettingsModalVisible,
    setAccessibilityModalVisible,
  } = useSession();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const handleFillSample = () => {
    setEmail('jan.kowalski@krakow.pl');
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
    setSettingsModalVisible(false);
  };

  const openAccessibility = () => {
    setSettingsModalVisible(false);
    setTimeout(() => {
      setAccessibilityModalVisible(true);
    }, 150);
  };

  const minTouch = increasedSpacing ? spacing.touchExpanded : spacing.touch;

  const barrierOptions: {
    id: BarrierViewMode;
    title: string;
    hint: string;
    icon: (selected: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'all',
      title: t(locale, 'settingsBarrierAllTitle'),
      hint: t(locale, 'settingsBarrierAllHint'),
      icon: (selected) => (
        <Path
          size={20}
          weight="bold"
          color={selected ? (isHighContrast ? colors.accentText : '#FFFFFF') : colors.accent}
        />
      ),
    },
    {
      id: 'route',
      title: t(locale, 'settingsBarrierRouteTitle'),
      hint: t(locale, 'settingsBarrierRouteHint'),
      icon: (selected) => (
        <Warning
          size={20}
          weight="bold"
          color={selected ? (isHighContrast ? colors.accentText : '#FFFFFF') : colors.warningBorder}
        />
      ),
    },
    {
      id: 'none',
      title: t(locale, 'settingsBarrierNoneTitle'),
      hint: t(locale, 'settingsBarrierNoneHint'),
      icon: (selected) => (
        <Prohibit
          size={20}
          weight="bold"
          color={selected ? (isHighContrast ? colors.accentText : '#FFFFFF') : colors.muted}
        />
      ),
    },
  ];

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  ];

  return (
    <Modal
      visible={settingsModalVisible}
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
                    backgroundColor: isHighContrast ? colors.accent : colors.badgeBg,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Gear
                  size={24}
                  color={isHighContrast ? colors.accentText : colors.accent}
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
                  {t(locale, 'settingsTitle')}
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
                  {t(locale, 'settingsSubtitle')}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(locale, 'close')}
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
              { gap: increasedSpacing ? 20 : 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. SEKCJA: WIDOK BARIER NA MAPIE */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize(15) }]}
                >
                  {t(locale, 'settingsBarrierSection')}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: colors.muted, fontSize: fontSize(12) }]}>
                {t(locale, 'settingsBarrierDesc')}
              </Text>

              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t(locale, 'settingsBarrierSection')}
                style={styles.barrierOptionsList}
              >
                {barrierOptions.map((opt) => {
                  const isSelected = barrierViewMode === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${opt.title}. ${opt.hint}`}
                      onPress={() => setBarrierViewMode(opt.id)}
                      style={[
                        styles.barrierOptionCard,
                        {
                          minHeight: minTouch,
                          borderColor: isSelected
                            ? (isHighContrast ? colors.focus : colors.accent)
                            : colors.border,
                          borderWidth: isSelected ? (isHighContrast ? 3 : 2) : 1,
                          backgroundColor: isSelected
                            ? (isHighContrast ? colors.accent : colors.badgeBg)
                            : (isHighContrast ? colors.background : colors.surface),
                        },
                      ]}
                    >
                      <View style={styles.barrierOptionLeft}>
                        <View
                          style={[
                            styles.barrierIconBox,
                            {
                              backgroundColor: isSelected
                                ? (isHighContrast ? colors.background : colors.accent)
                                : (isHighContrast ? colors.surface : 'rgba(0,0,0,0.04)'),
                            },
                          ]}
                        >
                          {opt.icon(isSelected)}
                        </View>
                        <View style={styles.barrierTextCol}>
                          <Text
                            style={[
                              styles.barrierOptionTitle,
                              {
                                color: isSelected
                                  ? (isHighContrast ? colors.accentText : colors.text)
                                  : colors.text,
                                fontSize: fontSize(13.5),
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {opt.title}
                          </Text>
                          <Text
                            style={[
                              styles.barrierOptionHint,
                              {
                                color: isSelected
                                  ? (isHighContrast ? colors.accentText : colors.muted)
                                  : colors.muted,
                                fontSize: fontSize(11.5),
                              },
                            ]}
                          >
                            {opt.hint}
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <View
                          style={[
                            styles.checkBadge,
                            {
                              backgroundColor: isHighContrast ? colors.background : colors.accent,
                            },
                          ]}
                        >
                          <Check
                            size={14}
                            weight="bold"
                            color={isHighContrast ? colors.accent : '#FFFFFF'}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. SEKCJA: WYBÓR JĘZYKA */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Translate size={18} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize(15) }]}
                >
                  {t(locale, 'settingsLanguageSection')}
                </Text>
              </View>

              <View style={styles.languageRow}>
                {languages.map((lang) => {
                  const isSelected = locale === lang.code;
                  return (
                    <Pressable
                      key={lang.code}
                      accessibilityRole="button"
                      accessibilityLabel={`${lang.label} (${lang.code.toUpperCase()})`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setLocale(lang.code)}
                      style={[
                        styles.languageBtn,
                        {
                          minHeight: minTouch,
                          borderColor: isSelected
                            ? (isHighContrast ? colors.focus : colors.accent)
                            : colors.border,
                          borderWidth: isSelected ? 2.5 : 1,
                          backgroundColor: isSelected
                            ? (isHighContrast ? colors.accent : colors.badgeBg)
                            : (isHighContrast ? colors.background : colors.surface),
                        },
                      ]}
                    >
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.languageLabel,
                          {
                            color: isSelected
                              ? (isHighContrast ? colors.accentText : colors.accent)
                              : colors.text,
                            fontSize: fontSize(13),
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 3. SEKCJA: KONTO UŻYTKOWNIKA I KARTA KRAKOWSKA */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <User size={18} weight="bold" color={colors.accent} />
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, { color: colors.text, fontSize: fontSize(15) }]}
                >
                  {t(locale, 'settingsAccountSection')}
                </Text>
              </View>

              {userAccount ? (
                /* VIEW WHEN LOGGED IN */
                <View style={{ gap: 12 }}>
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
                      <UserCircle size={40} color={colors.accent} weight="duotone" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.profileName, { color: colors.text, fontSize: fontSize(15) }]}>
                          {userAccount.displayName}
                        </Text>
                        <View style={styles.emailRow}>
                          <Envelope size={13} color={colors.muted} weight="bold" />
                          <Text style={[styles.profileEmail, { color: colors.muted, fontSize: fontSize(12) }]}>
                            {userAccount.email}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: colors.okBg, borderColor: colors.okBorder }]}>
                        <CheckCircle size={12} color={colors.okText} weight="fill" />
                        <Text style={[styles.statusChipText, { color: colors.okText, fontSize: fontSize(10) }]}>
                          MIESZKANIEC
                        </Text>
                      </View>
                    </View>
                  </View>

                  <GovCard variant="default">
                    <Text
                      accessibilityRole="header"
                      style={[styles.benefitsHeader, { color: colors.text, fontSize: fontSize(13.5) }]}
                    >
                      {t(locale, 'userAccountBenefitsTitle')}
                    </Text>
                    <View style={styles.benefitItem}>
                      <ShieldCheck size={15} color={colors.accent} weight="bold" />
                      <Text style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12) }]}>
                        {t(locale, 'userAccountBenefit1')}
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <CheckCircle size={15} color={colors.accent} weight="bold" />
                      <Text style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12) }]}>
                        {t(locale, 'userAccountBenefit2')}
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <UserCheck size={15} color={colors.accent} weight="bold" />
                      <Text style={[styles.benefitText, { color: colors.text, fontSize: fontSize(12) }]}>
                        {t(locale, 'userAccountBenefit3')}
                      </Text>
                    </View>
                  </GovCard>

                  <GovButton
                    title={t(locale, 'userAccountLogout')}
                    icon={<SignOut size={16} color={colors.warningText} weight="bold" />}
                    variant="outline"
                    onPress={handleLogout}
                    style={{ borderColor: colors.warningBorder }}
                  />
                </View>
              ) : (
                /* VIEW WHEN NOT LOGGED IN */
                <View style={{ gap: 10 }}>
                  <Text style={[styles.loginLead, { color: colors.muted, fontSize: fontSize(12) }]}>
                    {t(locale, 'userAccountLoginDesc')}
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSize(12) }]}>
                      {t(locale, 'userAccountEmailLabel')}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: colors.border,
                          backgroundColor: isHighContrast ? colors.background : colors.surface,
                        },
                      ]}
                    >
                      <Envelope size={16} color={colors.muted} />
                      <TextInput
                        style={[styles.input, { color: colors.text, fontSize: fontSize(13) }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t(locale, 'userAccountEmailPlaceholder')}
                        placeholderTextColor={colors.muted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSize(12) }]}>
                      {t(locale, 'userAccountNameLabel')}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: colors.border,
                          backgroundColor: isHighContrast ? colors.background : colors.surface,
                        },
                      ]}
                    >
                      <User size={16} color={colors.muted} />
                      <TextInput
                        style={[styles.input, { color: colors.text, fontSize: fontSize(13) }]}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder={t(locale, 'userAccountNamePlaceholder')}
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSize(12) }]}>
                      {t(locale, 'userAccountPasswordLabel')}
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          borderColor: colors.border,
                          backgroundColor: isHighContrast ? colors.background : colors.surface,
                        },
                      ]}
                    >
                      <LockKey size={16} color={colors.muted} />
                      <TextInput
                        style={[styles.input, { color: colors.text, fontSize: fontSize(13) }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t(locale, 'userAccountPasswordPlaceholder')}
                        placeholderTextColor={colors.muted}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.loginActions}>
                    <GovButton
                      title={t(locale, 'userAccountLoginBtn')}
                      icon={<SignIn size={17} color={colors.accentText} weight="bold" />}
                      variant="primary"
                      onPress={handleLogin}
                    />

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t(locale, 'userAccountQuickDemoBtn')}
                      onPress={handleFillSample}
                      style={[
                        styles.sampleBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: isHighContrast ? colors.background : 'rgba(0,0,0,0.03)',
                        },
                      ]}
                    >
                      <Text style={[styles.sampleBtnText, { color: colors.accent, fontSize: fontSize(12) }]}>
                        {t(locale, 'userAccountQuickDemoBtn')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* 4. SEKCJA: SKRÓT DO CENTRUM DOSTĘPNOŚCI */}
            <View style={styles.sectionContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(locale, 'settingsA11yShortcut')}
                onPress={openAccessibility}
                style={[
                  styles.a11yShortcutCard,
                  {
                    borderColor: isHighContrast ? colors.focus : '#38BDF8',
                    backgroundColor: isHighContrast ? colors.background : colors.badgeBg,
                    minHeight: minTouch,
                  },
                ]}
              >
                <View style={styles.a11yShortcutLeft}>
                  <PersonArmsSpread size={22} color={colors.accent} weight="bold" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.a11yShortcutTitle, { color: colors.text, fontSize: fontSize(13.5) }]}>
                      {t(locale, 'settingsA11yShortcut')}
                    </Text>
                    <Text style={[styles.a11yShortcutDesc, { color: colors.muted, fontSize: fontSize(11.5) }]}>
                      Kontrast WCAG 2.2 AAA, rozmiar czcionki, linijka czytania, krój dla dyslektyków
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    letterSpacing: -0.3,
  },
  subTitle: {
    marginTop: 2,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
  },
  sectionContainer: {
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionDesc: {
    marginBottom: 10,
    lineHeight: 16,
  },
  barrierOptionsList: {
    gap: 8,
  },
  barrierOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
  },
  barrierOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  barrierIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barrierTextCol: {
    flex: 1,
  },
  barrierOptionTitle: {
    marginBottom: 2,
  },
  barrierOptionHint: {
    lineHeight: 15,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  languageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageLabel: {
    letterSpacing: -0.2,
  },
  profileCard: {
    borderRadius: 12,
    padding: 12,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileName: {
    fontWeight: '800',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
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
    borderRadius: 6,
    borderWidth: 1,
  },
  statusChipText: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  benefitsHeader: {
    fontWeight: '700',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  benefitText: {
    fontWeight: '500',
    flex: 1,
  },
  loginLead: {
    marginBottom: 6,
    lineHeight: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  loginActions: {
    gap: 8,
    marginTop: 6,
  },
  sampleBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleBtnText: {
    fontWeight: '700',
  },
  a11yShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
  },
  a11yShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  a11yShortcutTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  a11yShortcutDesc: {
    lineHeight: 15,
  },
});

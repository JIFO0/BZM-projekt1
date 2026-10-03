import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { locale } = useSession();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: t(locale, 'searchTitle') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.body, { color: colors.text }]}>{t(locale, 'searchLead')}</Text>
        <Field label={t(locale, 'from')} placeholder={t(locale, 'fromPlaceholder')} colors={colors} />
        <Field label={t(locale, 'to')} placeholder={t(locale, 'toPlaceholder')} colors={colors} />
        <View
          accessibilityRole="text"
          style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.body, { color: colors.text }]}>{t(locale, 'notReady')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  colors,
}: {
  label: string;
  placeholder: string;
  colors: typeof lightColors;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={false}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, minHeight: spacing.touch },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.stack },
  body: { fontSize: 16, lineHeight: 24 },
  field: { gap: 6 },
  label: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  notice: { borderWidth: 2, borderRadius: 12, padding: 12 },
});

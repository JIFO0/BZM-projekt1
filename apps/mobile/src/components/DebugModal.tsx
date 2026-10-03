import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { darkColors, lightColors, spacing } from '@/theme/tokens';

interface DebugModalProps {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
}

export function DebugModal({ visible, onClose, locale }: DebugModalProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const { debugState, setDebugState } = useSession();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{t(locale, 'debugPanel')}</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            Symulacja stanów awaryjnych i brzegowych wymaganych przez regulamin HackYeah (R7, R8, R12):
          </Text>

          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t(locale, 'simulateOverpassFail')}
            onPress={() =>
              setDebugState((prev) => ({
                ...prev,
                simulateOverpassDown: !prev.simulateOverpassDown,
              }))
            }
            style={[
              styles.row,
              {
                borderColor: debugState.simulateOverpassDown ? colors.blockerBorder : colors.border,
                backgroundColor: debugState.simulateOverpassDown ? colors.blockerBg : colors.background,
                minHeight: spacing.touch,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>
              {debugState.simulateOverpassDown ? '☒ ' : '☐ '}
              {t(locale, 'simulateOverpassFail')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t(locale, 'simulateMapyFail')}
            onPress={() =>
              setDebugState((prev) => ({
                ...prev,
                simulateMapyDown: !prev.simulateMapyDown,
              }))
            }
            style={[
              styles.row,
              {
                borderColor: debugState.simulateMapyDown ? colors.warningBorder : colors.border,
                backgroundColor: debugState.simulateMapyDown ? colors.warningBg : colors.background,
                minHeight: spacing.touch,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>
              {debugState.simulateMapyDown ? '☒ ' : '☐ '}
              {t(locale, 'simulateMapyFail')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={t(locale, 'simulateOffline')}
            onPress={() =>
              setDebugState((prev) => ({
                ...prev,
                simulateOffline: !prev.simulateOffline,
              }))
            }
            style={[
              styles.row,
              {
                borderColor: debugState.simulateOffline ? colors.accent : colors.border,
                backgroundColor: debugState.simulateOffline ? colors.infoBg : colors.background,
                minHeight: spacing.touch,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text }]}>
              {debugState.simulateOffline ? '☒ ' : '☐ '}
              {t(locale, 'simulateOffline')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'resetSimulation')}
            onPress={() =>
              setDebugState(() => ({
                simulateOverpassDown: false,
                simulateMapyDown: false,
                simulateOffline: false,
              }))
            }
            style={[styles.resetButton, { borderColor: colors.border, minHeight: spacing.touch }]}
          >
            <Text style={[styles.resetText, { color: colors.text }]}>
              {t(locale, 'resetSimulation')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'close')}
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.accent, minHeight: spacing.touch }]}
          >
            <Text style={[styles.closeText, { color: colors.accentText }]}>
              {t(locale, 'close')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

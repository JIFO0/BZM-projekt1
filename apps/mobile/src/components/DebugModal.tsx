import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { t, type Locale } from '@/i18n/strings';
import { useSession } from '@/state/session';
import { spacing } from '@/theme/tokens';

interface DebugModalProps {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
}

export function DebugModal({ visible, onClose, locale }: DebugModalProps) {
  const { colors, fontSize, isHighContrast, debugState, setDebugState } = useSession();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: isHighContrast ? 2.5 : 1.5,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text, fontSize: fontSize(18) }]}>
            🛠️ {t(locale, 'debugPanel')}
          </Text>
          <Text style={[styles.desc, { color: colors.muted, fontSize: fontSize(13) }]}>
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
                borderWidth: isHighContrast ? 2 : 1.5,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text, fontSize: fontSize(14) }]}>
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
                borderWidth: isHighContrast ? 2 : 1.5,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text, fontSize: fontSize(14) }]}>
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
                borderWidth: isHighContrast ? 2 : 1.5,
              },
            ]}
          >
            <Text style={[styles.rowText, { color: colors.text, fontSize: fontSize(14) }]}>
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
            style={[
              styles.resetButton,
              {
                borderColor: colors.border,
                minHeight: spacing.touch,
                borderWidth: isHighContrast ? 2 : 1.5,
              },
            ]}
          >
            <Text style={[styles.resetText, { color: colors.text, fontSize: fontSize(13.5) }]}>
              {t(locale, 'resetSimulation')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(locale, 'close')}
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.accent,
                minHeight: spacing.touch,
              },
            ]}
          >
            <Text style={[styles.closeText, { color: colors.accentText, fontSize: fontSize(14) }]}>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
  desc: {
    lineHeight: 18,
  },
  row: {
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  rowText: {
    fontWeight: '600',
  },
  resetButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  resetText: {
    fontWeight: '700',
  },
  closeButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  closeText: {
    fontWeight: '800',
  },
});

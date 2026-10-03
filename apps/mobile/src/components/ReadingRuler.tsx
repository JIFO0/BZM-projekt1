import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/state/session';

/**
 * 📏 ReadingRuler - Linijka / Prowadnica ułatwiająca czytanie tekstu linijka po linijce.
 * Narzędzie wspierające osoby z dysleksją, ADHD, trudnościami w koncentracji i zaburzeniami wzroku.
 */
export function ReadingRuler() {
  const { readingRuler, setReadingRuler, readingRulerY, setReadingRulerY, colors, isHighContrast } =
    useSession();

  if (!readingRuler) return null;

  const moveUp = () => setReadingRulerY(Math.max(80, readingRulerY - 60));
  const moveDown = () => setReadingRulerY(Math.min(700, readingRulerY + 60));

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFillObject}
      accessibilityRole="none"
    >
      <View
        style={[
          styles.rulerStrip,
          {
            top: readingRulerY,
            backgroundColor: isHighContrast ? 'rgba(255, 255, 0, 0.25)' : 'rgba(0, 92, 169, 0.22)',
            borderColor: isHighContrast ? '#FFFF00' : colors.accent,
          },
        ]}
      >
        <View style={styles.controlsRow}>
          <Text style={[styles.rulerLabel, { color: colors.text }]}>
            📏 Linijka czytania
          </Text>
          <View style={styles.btnGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Przesuń linijkę czytania w górę"
              onPress={moveUp}
              style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>▲ Góra</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Przesuń linijkę czytania w dół"
              onPress={moveDown}
              style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>▼ Dół</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Wyłącz linijkę czytania"
              onPress={() => setReadingRuler(false)}
              style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>✕ Schowaj</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rulerStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 54,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulerLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

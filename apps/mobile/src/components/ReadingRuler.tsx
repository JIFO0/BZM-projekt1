import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown, CaretUp, X } from 'phosphor-react-native';

import { useSession } from '@/state/session';

/**
 * ReadingRuler - Linijka oraz Maska czytania
 * Pomaga w skupieniu wzroku i śledzeniu tekstu wiersz po wierszu.
 * Zero emotikon - wyłącznie Phosphor icons.
 */
export function ReadingRuler() {
  const {
    readingRuler,
    setReadingRuler,
    readingRulerY,
    setReadingRulerY,
    readingMask,
    setReadingMask,
    readingMaskY,
    setReadingMaskY,
    colors,
    isHighContrast,
  } = useSession();

  const screenHeight = Dimensions.get('window').height;

  const moveRulerUp = () => setReadingRulerY(Math.max(90, readingRulerY - 50));
  const moveRulerDown = () => setReadingRulerY(Math.min(screenHeight - 120, readingRulerY + 50));

  const moveMaskUp = () => setReadingMaskY(Math.max(120, readingMaskY - 50));
  const moveMaskDown = () => setReadingMaskY(Math.min(screenHeight - 140, readingMaskY + 50));

  if (!readingRuler && !readingMask) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      {/* 1. Reading Mask (Dims top and bottom) */}
      {readingMask ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          {/* Top dim */}
          <View
            style={[
              styles.maskDim,
              {
                top: 0,
                height: readingMaskY,
                backgroundColor: isHighContrast ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.70)',
              },
            ]}
          />
          {/* Active reading slot */}
          <View
            style={[
              styles.maskSlot,
              {
                top: readingMaskY,
                borderColor: isHighContrast ? '#FFFF00' : colors.accent,
              },
            ]}
          >
            <View style={styles.maskControls}>
              <Text style={[styles.rulerLabel, { color: colors.text }]}>Maska skupienia</Text>
              <View style={styles.btnGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Przesuń maskę w górę"
                  onPress={moveMaskUp}
                  style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <CaretUp size={14} weight="bold" color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Przesuń maskę w dół"
                  onPress={moveMaskDown}
                  style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <CaretDown size={14} weight="bold" color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Wyłącz maskę czytania"
                  onPress={() => setReadingMask(false)}
                  style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <X size={14} weight="bold" color={colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
          {/* Bottom dim */}
          <View
            style={[
              styles.maskDim,
              {
                top: readingMaskY + 70,
                bottom: 0,
                backgroundColor: isHighContrast ? 'rgba(0,0,0,0.85)' : 'rgba(15, 23, 42, 0.70)',
              },
            ]}
          />
        </View>
      ) : null}

      {/* 2. Reading Ruler Strip */}
      {readingRuler ? (
        <View
          style={[
            styles.rulerStrip,
            {
              top: readingRulerY,
              backgroundColor: isHighContrast ? 'rgba(255, 255, 0, 0.22)' : 'rgba(0, 92, 169, 0.18)',
              borderColor: isHighContrast ? '#FFFF00' : colors.accent,
            },
          ]}
        >
          <View style={styles.controlsRow}>
            <Text style={[styles.rulerLabel, { color: colors.text }]}>Linijka czytania</Text>
            <View style={styles.btnGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Przesuń linijkę w górę"
                onPress={moveRulerUp}
                style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <CaretUp size={14} weight="bold" color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>Góra</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Przesuń linijkę w dół"
                onPress={moveRulerDown}
                style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <CaretDown size={14} weight="bold" color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>Dół</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Wyłącz linijkę czytania"
                onPress={() => setReadingRuler(false)}
                style={[styles.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <X size={14} weight="bold" color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>Zamknij</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rulerStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  maskDim: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9998,
  },
  maskSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 70,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    zIndex: 9999,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  maskControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulerLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

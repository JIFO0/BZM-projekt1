import { StyleSheet, Text, View } from 'react-native';
import { LockSimple, ShieldCheck } from 'phosphor-react-native';

import { KrakowCoatOfArms } from '@/components/KrakowCoatOfArms';
import { t } from '@/i18n/strings';
import { useSession } from '@/state/session';

export function GovFooter() {
  const { locale, colors, isHighContrast, fontSize } = useSession();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t(locale, 'footerA11yLabel')}
      style={[
        styles.footer,
        {
          backgroundColor: isHighContrast ? colors.surface : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <KrakowCoatOfArms size="small" showTitle={true} />
        <Text
          style={[
            styles.footerLead,
            {
              color: colors.text,
              fontSize: fontSize(12),
            },
          ]}
        >
          {t(locale, 'krakowMunicipalFooter')}
        </Text>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: isHighContrast ? colors.background : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ShieldCheck size={13} weight="bold" color={colors.accent} />
            <Text style={[styles.tagText, { color: colors.muted, fontSize: fontSize(11) }]}>
              {t(locale, 'wcagBadge')}
            </Text>
          </View>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: isHighContrast ? colors.background : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <LockSimple size={13} weight="bold" color={colors.accent} />
            <Text style={[styles.tagText, { color: colors.muted, fontSize: fontSize(11) }]}>
              {t(locale, 'privacyTag')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  content: {
    gap: 12,
  },
  footerLead: {
    lineHeight: 18,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontWeight: '700',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

export type DashboardHighlight = {
  key: string;
  label: string;
  value: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type DashboardHighlightsProps = {
  highlights: DashboardHighlight[];
  isWideLayout: boolean;
};

export function DashboardHighlights({
  highlights,
  isWideLayout,
}: DashboardHighlightsProps) {
  return (
    <View
      style={[
        styles.dashboardStatsGrid,
        isWideLayout && styles.dashboardStatsGridWide,
      ]}
    >
      {highlights.map((highlight) => (
        <View key={highlight.key} style={styles.dashboardHighlightCard}>
          <View style={styles.dashboardHighlightTopRow}>
            <View style={styles.dashboardHighlightIconWrap}>
              <Ionicons name={highlight.icon} size={16} color="#ab1e24" />
            </View>
            <Text style={styles.dashboardHighlightLabel}>{highlight.label}</Text>
          </View>
          <Text style={styles.dashboardHighlightValue}>{highlight.value}</Text>
          <Text style={styles.dashboardHighlightMeta}>{highlight.meta}</Text>
        </View>
      ))}
    </View>
  );
}

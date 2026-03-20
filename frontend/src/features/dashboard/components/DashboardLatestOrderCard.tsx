import { Ionicons } from '@expo/vector-icons';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import { buildOrderBonUrl, type OrderSummary } from '../../../services/ordersApi';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

type DashboardLatestOrderCardProps = {
  latestOrder: OrderSummary | null;
  orderError: string | null;
  orderLoading: boolean;
  orderPreviewLoading: boolean;
  orderPreviewUrl: string | null;
  onOpenPreview: () => void;
  text: AppText;
};

export function DashboardLatestOrderCard({
  latestOrder,
  orderError,
  orderLoading,
  orderPreviewLoading,
  orderPreviewUrl,
  onOpenPreview,
  text,
}: DashboardLatestOrderCardProps) {
  return (
    <View style={styles.quickBlock}>
      <Text style={styles.quickBlockTitle}>
        {text.dashboard.quickLatestOrderTitle}
      </Text>
      {orderLoading ? (
        <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
      ) : null}
      {orderError ? <Text style={styles.errorText}>{orderError}</Text> : null}
      {!orderLoading && !orderError && !latestOrder ? (
        <Text style={styles.subtitle}>{text.dashboard.quickNoOrder}</Text>
      ) : null}
      {latestOrder ? (
        <View style={styles.quickRowCard}>
          <View style={styles.quickMetaInlineRow}>
            <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
              {text.orders.orderNumberLabel}
            </Text>
            <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
              {text.orders.deliveryDateLabel}
            </Text>
            <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
              {text.orders.supplierLabel}
            </Text>
            <Text style={[styles.quickMetaHeaderText, styles.quickInlineCell]}>
              {text.orders.summaryItems}
            </Text>
            {Platform.OS === 'web' ? (
              <View style={styles.quickEyeSpacer} />
            ) : null}
          </View>

          <View style={styles.quickMetaInlineRow}>
            <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
              {latestOrder.number}
            </Text>
            <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
              {latestOrder.deliveryDate}
            </Text>
            <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
              {latestOrder.supplierName}
            </Text>
            <Text style={[styles.quickMetaValueText, styles.quickInlineCell]}>
              {latestOrder.totalItems}
            </Text>

            {Platform.OS === 'web' ? (
              <Pressable
                style={[
                  styles.eyePreviewButton,
                  (!orderPreviewUrl || orderPreviewLoading) &&
                    styles.buttonDisabled,
                ]}
                disabled={!orderPreviewUrl || orderPreviewLoading}
                onPress={onOpenPreview}
              >
                <Ionicons name="eye-outline" size={20} color="#7f1b21" />
              </Pressable>
            ) : null}
          </View>

          {Platform.OS === 'web' ? null : (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                void Linking.openURL(buildOrderBonUrl(latestOrder.id));
              }}
            >
              <Text style={styles.secondaryButtonText}>
                {text.orders.downloadBonButton}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

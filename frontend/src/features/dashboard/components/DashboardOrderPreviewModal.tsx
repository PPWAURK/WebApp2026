import { Modal, Platform, Pressable, Text, View } from 'react-native';
import type { AppText } from '../../../locales/translations';
import type { OrderSummary } from '../../../services/ordersApi';
import { canEmbedWebDocument } from '../lib/dashboardShared';
import { styles } from '../../../components/SessionCard/SessionCard.styles';

type DashboardOrderPreviewModalProps = {
  latestOrder: OrderSummary | null;
  onClose: () => void;
  orderPreviewUrl: string | null;
  text: AppText;
  visible: boolean;
};

export function DashboardOrderPreviewModal({
  latestOrder,
  onClose,
  orderPreviewUrl,
  text,
  visible,
}: DashboardOrderPreviewModalProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.previewModalBackdrop}>
        <View style={styles.previewModalCard}>
          <View style={styles.previewModalHeader}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickLatestOrderTitle}
            </Text>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>
                {text.dashboard.quickPreviewCloseButton}
              </Text>
            </Pressable>
          </View>

          {orderPreviewUrl && canEmbedWebDocument(orderPreviewUrl) ? (
            <iframe
              src={orderPreviewUrl}
              style={styles.orderPreviewFrame as never}
              title={
                latestOrder ? `order-preview-${latestOrder.id}` : 'order-preview'
              }
            />
          ) : (
            <Text style={styles.subtitle}>
              {text.dashboard.quickPreviewUnavailable}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { styles } from '../../../components/SessionCard/SessionCard.styles';
import type { AppText } from '../../../locales/translations';
import type { OrderReturnSummary } from '../../../services/ordersApi';

type DashboardReturnPhotosModalProps = {
  entry: OrderReturnSummary | null;
  onClose: () => void;
  text: AppText;
  visible: boolean;
};

function buildItemLabel(item: OrderReturnSummary['items'][number]) {
  return item.nameFr.trim() || item.nameZh.trim() || '-';
}

function collectPhotos(entry: OrderReturnSummary | null) {
  if (!entry) {
    return [];
  }

  return entry.items.flatMap((item) =>
    item.photos.map((photo) => ({
      key: `${item.nameFr}-${item.nameZh}-${photo.documentId}`,
      fileUrl: photo.fileUrl,
      originalName: photo.originalName,
      productLabel: buildItemLabel(item),
    })),
  );
}

export function DashboardReturnPhotosModal({
  entry,
  onClose,
  text,
  visible,
}: DashboardReturnPhotosModalProps) {
  const photos = collectPhotos(entry);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.previewModalBackdrop}>
        <View style={styles.returnPhotoModalCard}>
          <View style={styles.previewModalHeader}>
            <View style={styles.returnPhotoModalHeaderCopy}>
              <Text style={styles.quickBlockTitle}>
                {text.dashboard.returnSummaryPhotosTitle}
              </Text>
              {entry ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {entry.orderNumber} • {entry.supplierName}
                </Text>
              ) : null}
            </View>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>
                {text.dashboard.quickPreviewCloseButton}
              </Text>
            </Pressable>
          </View>

          {photos.length === 0 ? (
            <Text style={styles.subtitle}>
              {text.dashboard.returnSummaryPhotosEmpty}
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={styles.returnPhotoModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.returnPhotoGrid}>
                {photos.map((photo) => (
                  <View key={photo.key} style={styles.returnPhotoCard}>
                    <Image
                      source={{ uri: photo.fileUrl }}
                      style={styles.returnPhotoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.returnPhotoCardCopy}>
                      <Text
                        style={styles.returnPhotoCardTitle}
                        numberOfLines={1}
                      >
                        {photo.productLabel}
                      </Text>
                      <Text style={styles.returnPhotoCardMeta} numberOfLines={2}>
                        {photo.originalName}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

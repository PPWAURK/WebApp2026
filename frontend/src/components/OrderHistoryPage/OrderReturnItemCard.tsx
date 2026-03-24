import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import type { OrderReturnDraftItem } from '../../services/ordersApi';
import type { ReturnPhotoDraft } from './orderReturn.types';
import { styles } from './OrderReturnModal.styles';

export type EditableReturnItem = OrderReturnDraftItem & {
  quantityText: string;
  photos: ReturnPhotoDraft[];
};

type OrderReturnItemCardProps = {
  item: EditableReturnItem;
  onAddPhoto: (
    purchaseOrderItemId: number,
    source: 'camera' | 'library',
  ) => Promise<void>;
  onRemoveItem: (purchaseOrderItemId: number) => void;
  onRemovePhoto: (purchaseOrderItemId: number, photoId: string) => void;
  onUpdateQuantity: (purchaseOrderItemId: number, value: string) => void;
  submitting: boolean;
  text: AppText;
};

function buildItemLabel(item: OrderReturnDraftItem) {
  const nameFr = item.nameFr.trim();
  const nameZh = item.nameZh.trim();

  if (nameFr && nameZh && nameFr !== nameZh) {
    return {
      title: nameZh,
      subtitle: nameFr,
    };
  }

  return {
    title: nameZh || nameFr || `${item.productId}`,
    subtitle: item.category || item.unit,
  };
}

export function OrderReturnItemCard({
  item,
  onAddPhoto,
  onRemoveItem,
  onRemovePhoto,
  onUpdateQuantity,
  submitting,
  text,
}: OrderReturnItemCardProps) {
  const label = buildItemLabel(item);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemCopy}>
          <Text style={styles.itemTitle}>{label.title}</Text>
          <Text style={styles.itemSubtitle}>{label.subtitle}</Text>
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => onRemoveItem(item.purchaseOrderItemId)}
          disabled={submitting}
        >
          <Text style={styles.removeButtonText}>
            {text.orders.returnRemoveItemButton}
          </Text>
        </Pressable>
      </View>

      <View style={styles.itemMetaRow}>
        <View style={styles.itemMetaPill}>
          <Text style={styles.itemMetaText}>
            {text.orders.returnOrderedQuantityLabel}: {item.orderedQuantity}
          </Text>
        </View>
        <View style={styles.itemMetaPill}>
          <Text style={styles.itemMetaText}>
            {text.orders.returnReturnedQuantityLabel}: {item.returnedQuantity}
          </Text>
        </View>
        <View style={styles.itemMetaPill}>
          <Text style={styles.itemMetaText}>
            {text.orders.returnRemainingQuantityLabel}: {item.remainingQuantity}
          </Text>
        </View>
      </View>

      <View style={styles.quantityRow}>
        <Text style={styles.fieldLabel}>{text.orders.quantityLabel}</Text>
        <TextInput
          style={[styles.input, styles.quantityInput]}
          keyboardType="number-pad"
          value={item.quantityText}
          onChangeText={(value) =>
            onUpdateQuantity(item.purchaseOrderItemId, value)
          }
        />
      </View>

      <View style={styles.photoSection}>
        <View style={styles.photoSectionHeader}>
          <Text style={styles.fieldLabel}>{text.orders.returnPhotosLabel}</Text>
          <Text style={styles.photoSectionMeta}>
            {text.orders.returnPhotosOptional}
          </Text>
        </View>

        <View style={styles.photoActionRow}>
          {Platform.OS !== 'web' ? (
            <Pressable
              style={[
                styles.photoActionButton,
                submitting && styles.photoActionButtonDisabled,
              ]}
              onPress={() => {
                void onAddPhoto(item.purchaseOrderItemId, 'camera');
              }}
              disabled={submitting}
            >
              <Ionicons name="camera-outline" size={16} color="#ab1e24" />
              <Text style={styles.photoActionButtonText}>
                {text.orders.returnPhotoCameraButton}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.photoActionButton,
              submitting && styles.photoActionButtonDisabled,
            ]}
            onPress={() => {
              void onAddPhoto(item.purchaseOrderItemId, 'library');
            }}
            disabled={submitting}
          >
            <Ionicons name="images-outline" size={16} color="#ab1e24" />
            <Text style={styles.photoActionButtonText}>
              {text.orders.returnPhotoLibraryButton}
            </Text>
          </Pressable>
        </View>

        {item.photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {item.photos.map((photo) => (
              <View key={photo.id} style={styles.photoPreviewCard}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoPreviewImage}
                  resizeMode="cover"
                />
                <View style={styles.photoPreviewFooter}>
                  <Text style={styles.photoPreviewName} numberOfLines={1}>
                    {photo.name}
                  </Text>
                  <Pressable
                    style={styles.photoRemoveButton}
                    onPress={() =>
                      onRemovePhoto(item.purchaseOrderItemId, photo.id)
                    }
                    disabled={submitting}
                  >
                    <Text style={styles.photoRemoveButtonText}>
                      {text.orders.returnPhotoRemoveButton}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.photoEmptyText}>
            {text.orders.returnPhotosEmpty}
          </Text>
        )}
      </View>
    </View>
  );
}

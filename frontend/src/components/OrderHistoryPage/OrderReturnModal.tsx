import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { OrderReturnDraft } from '../../services/ordersApi';
import {
  OrderReturnItemCard,
  type EditableReturnItem,
} from './OrderReturnItemCard';
import {
  captureReturnPhoto,
  selectReturnPhotoFromLibrary,
} from './orderReturnPhotoPicker';
import type {
  ReturnPhotoDraft,
  SubmitOrderReturnPayload,
} from './orderReturn.types';
import { styles } from './OrderReturnModal.styles';

type OrderReturnModalProps = {
  draft: OrderReturnDraft | null;
  onClose: () => void;
  onSubmit: (payload: SubmitOrderReturnPayload) => Promise<void>;
  submitting: boolean;
  text: AppText;
  visible: boolean;
};

function resolvePhotoErrorMessage(error: unknown, text: AppText) {
  if (
    error instanceof Error &&
    error.message === 'RETURN_PHOTO_CAMERA_PERMISSION_DENIED'
  ) {
    return text.orders.returnPhotoCameraPermissionError;
  }

  if (
    error instanceof Error &&
    error.message === 'RETURN_PHOTO_LIBRARY_PERMISSION_DENIED'
  ) {
    return text.orders.returnPhotoLibraryPermissionError;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return text.orders.returnPhotoPickerError;
}

export function OrderReturnModal({
  draft,
  onClose,
  onSubmit,
  submitting,
  text,
  visible,
}: OrderReturnModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<EditableReturnItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !draft) {
      setReason('');
      setNotes('');
      setItems([]);
      setFormError(null);
      return;
    }

    setReason('');
    setNotes('');
    setFormError(null);
    setItems(
      draft.items.map((item) => ({
        ...item,
        quantityText: String(item.remainingQuantity),
        photos: [],
      })),
    );
  }, [draft, visible]);

  const selectedProductCount = items.length;
  const selectedQuantity = items.reduce((sum, item) => {
    const parsed = Number.parseInt(item.quantityText, 10);
    return sum + (Number.isInteger(parsed) ? parsed : 0);
  }, 0);

  function updateQuantity(purchaseOrderItemId: number, value: string) {
    const normalizedValue = value.replace(/[^0-9]/g, '');
    setFormError(null);
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.purchaseOrderItemId === purchaseOrderItemId
          ? { ...item, quantityText: normalizedValue }
          : item,
      ),
    );
  }

  function removeItem(purchaseOrderItemId: number) {
    setFormError(null);
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.purchaseOrderItemId !== purchaseOrderItemId,
      ),
    );
  }

  function removePhoto(purchaseOrderItemId: number, photoId: string) {
    setFormError(null);
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.purchaseOrderItemId === purchaseOrderItemId
          ? {
              ...item,
              photos: item.photos.filter((photo) => photo.id !== photoId),
            }
          : item,
      ),
    );
  }

  async function addPhoto(
    purchaseOrderItemId: number,
    source: 'camera' | 'library',
  ) {
    if (submitting) {
      return;
    }

    setFormError(null);

    try {
      const photo =
        source === 'camera'
          ? await captureReturnPhoto()
          : await selectReturnPhotoFromLibrary();

      if (!photo) {
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.purchaseOrderItemId === purchaseOrderItemId
            ? {
                ...item,
                photos: [...item.photos, photo],
              }
            : item,
        ),
      );
    } catch (error) {
      setFormError(resolvePhotoErrorMessage(error, text));
    }
  }

  async function handleSubmit() {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setFormError(text.orders.returnValidationReason);
      return;
    }

    if (items.length === 0) {
      setFormError(text.orders.returnValidationItems);
      return;
    }

    const payloadItems: SubmitOrderReturnPayload['items'] = [];

    for (const item of items) {
      const quantity = Number.parseInt(item.quantityText, 10);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > item.remainingQuantity
      ) {
        setFormError(text.orders.returnQuantityInvalid);
        return;
      }

      payloadItems.push({
        purchaseOrderItemId: item.purchaseOrderItemId,
        quantity,
        photos: item.photos,
      });
    }

    setFormError(null);

    try {
      await onSubmit({
        orderId: draft?.orderId ?? 0,
        reason: trimmedReason,
        notes: notes.trim() || undefined,
        items: payloadItems,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : text.orders.returnSubmitError;
      setFormError(message);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{text.orders.returnTitle}</Text>
              <Text style={styles.subtitle}>{text.orders.returnSubtitle}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                {text.orders.returnCancelButton}
              </Text>
            </Pressable>
          </View>

          {draft ? (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.heroCard}>
                <Text style={styles.title}>{draft.orderNumber}</Text>
                <View style={styles.heroMetaRow}>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>
                      {text.orders.supplierLabel}: {draft.supplierName}
                    </Text>
                  </View>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>
                      {text.orders.deliveryDateLabel}: {draft.deliveryDate}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    {text.orders.returnReasonLabel}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={text.orders.returnReasonPlaceholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={reason}
                    onChangeText={(value) => {
                      setFormError(null);
                      setReason(value);
                    }}
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    {text.orders.returnNotesLabel}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder={text.orders.returnNotesPlaceholder}
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    value={notes}
                    onChangeText={(value) => {
                      setFormError(null);
                      setNotes(value);
                    }}
                  />
                </View>
              </View>

              <View style={styles.summaryStrip}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    {text.orders.summaryItems}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {selectedProductCount}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>
                    {text.orders.returnTotalItemsLabel}
                  </Text>
                  <Text style={styles.summaryValue}>{selectedQuantity}</Text>
                </View>
              </View>

              {items.length > 0 ? (
                <View style={styles.itemList}>
                  {items.map((item) => (
                    <OrderReturnItemCard
                      key={`return-item-${item.purchaseOrderItemId}`}
                      item={item}
                      onAddPhoto={addPhoto}
                      onRemoveItem={removeItem}
                      onRemovePhoto={removePhoto}
                      onUpdateQuantity={updateQuantity}
                      submitting={submitting}
                      text={text}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {text.orders.returnValidationItems}
                  </Text>
                </View>
              )}

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}

              <View style={styles.footer}>
                <Pressable
                  style={[styles.footerButton, styles.secondaryButton]}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryButtonText}>
                    {text.orders.returnCancelButton}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.footerButton,
                    styles.primaryButton,
                    (submitting || items.length === 0) &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  disabled={submitting || items.length === 0}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting
                      ? text.orders.submittingReturn
                      : text.orders.returnSubmitButton}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

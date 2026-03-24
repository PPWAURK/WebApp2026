import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import type {
  CreateOrderReturnPayload,
  OrderReturnDraft,
  OrderReturnDraftItem,
} from '../../services/ordersApi';
import { styles } from './OrderReturnModal.styles';

type EditableReturnItem = OrderReturnDraftItem & {
  quantityText: string;
};

type OrderReturnModalProps = {
  draft: OrderReturnDraft | null;
  onClose: () => void;
  onSubmit: (payload: CreateOrderReturnPayload) => Promise<void>;
  submitting: boolean;
  text: AppText;
  visible: boolean;
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

    const payloadItems: CreateOrderReturnPayload['items'] = [];

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
                    placeholderTextColor="#aa777b"
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
                    placeholderTextColor="#aa777b"
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
                  {items.map((item) => {
                    const label = buildItemLabel(item);

                    return (
                      <View
                        key={`return-item-${item.purchaseOrderItemId}`}
                        style={styles.itemCard}
                      >
                        <View style={styles.itemHeader}>
                          <View style={styles.itemCopy}>
                            <Text style={styles.itemTitle}>{label.title}</Text>
                            <Text style={styles.itemSubtitle}>
                              {label.subtitle}
                            </Text>
                          </View>
                          <Pressable
                            style={styles.removeButton}
                            onPress={() => removeItem(item.purchaseOrderItemId)}
                          >
                            <Text style={styles.removeButtonText}>
                              {text.orders.returnRemoveItemButton}
                            </Text>
                          </Pressable>
                        </View>

                        <View style={styles.itemMetaRow}>
                          <View style={styles.itemMetaPill}>
                            <Text style={styles.itemMetaText}>
                              {text.orders.returnOrderedQuantityLabel}:{' '}
                              {item.orderedQuantity}
                            </Text>
                          </View>
                          <View style={styles.itemMetaPill}>
                            <Text style={styles.itemMetaText}>
                              {text.orders.returnReturnedQuantityLabel}:{' '}
                              {item.returnedQuantity}
                            </Text>
                          </View>
                          <View style={styles.itemMetaPill}>
                            <Text style={styles.itemMetaText}>
                              {text.orders.returnRemainingQuantityLabel}:{' '}
                              {item.remainingQuantity}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.quantityRow}>
                          <Text style={styles.fieldLabel}>
                            {text.orders.quantityLabel}
                          </Text>
                          <TextInput
                            style={[styles.input, styles.quantityInput]}
                            keyboardType="number-pad"
                            value={item.quantityText}
                            onChangeText={(value) =>
                              updateQuantity(item.purchaseOrderItemId, value)
                            }
                          />
                        </View>
                      </View>
                    );
                  })}
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

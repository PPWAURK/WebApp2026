import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type {
  OrderReturnSummary,
  OrderSummary,
} from '../../services/ordersApi';
import {
  buildReturnProductsLabel,
  formatAmount,
  formatReturnTimestamp,
} from './orderHistory.shared';
import { styles } from './OrderHistoryPage.styles';

type OrderHistoryOrderCardProps = {
  text: AppText;
  order: OrderSummary;
  returnsForOrder: OrderReturnSummary[];
  deletingOrderId: number | null;
  returnDraftLoadingOrderId: number | null;
  onDownloadOrderBon: (order: {
    id: number;
    bonUrl: string;
    number?: string;
  }) => void;
  onOpenReturnDraft: (order: OrderSummary) => void;
  onDeleteOrder: (order: OrderSummary) => void;
};

export function OrderHistoryOrderCard({
  text,
  order,
  returnsForOrder,
  deletingOrderId,
  returnDraftLoadingOrderId,
  onDownloadOrderBon,
  onOpenReturnDraft,
  onDeleteOrder,
}: OrderHistoryOrderCardProps) {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View style={styles.orderCardCopy}>
          <Text style={styles.orderNumber}>{order.number}</Text>
          <Text style={styles.orderAddress} numberOfLines={2}>
            {order.deliveryAddress}
          </Text>
        </View>
        <View style={styles.orderAmountPill}>
          <Text style={styles.orderAmountLabel}>
            {text.orders.summaryAmount}
          </Text>
          <Text style={styles.orderAmountValue}>
            {formatAmount(order.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.orderMetaGrid}>
        <View style={styles.orderMetaItem}>
          <Text style={styles.orderMetaLabel}>
            {text.orders.deliveryAddressLabel}
          </Text>
          <Text style={styles.orderMetaValue} numberOfLines={2}>
            {order.deliveryAddress}
          </Text>
        </View>
        <View style={styles.orderMetaItemSmall}>
          <Text style={styles.orderMetaLabel}>{text.orders.summaryItems}</Text>
          <Text style={styles.orderMetaValue}>{order.totalItems}</Text>
        </View>
        <View style={styles.orderMetaItemSmall}>
          <Text style={styles.orderMetaLabel}>
            {text.orders.deliveryDateLabel}
          </Text>
          <Text style={styles.orderMetaValue}>{order.deliveryDate}</Text>
        </View>
      </View>

      {returnsForOrder.length > 0 ? (
        <View style={styles.returnHistorySection}>
          <View style={styles.returnHistoryHeader}>
            <Text style={styles.returnHistoryTitle}>
              {text.orders.returnHistorySectionTitle}
            </Text>
            <View style={styles.returnHistoryCountPill}>
              <Text style={styles.returnHistoryCountText}>
                {returnsForOrder.length}
              </Text>
            </View>
          </View>

          {returnsForOrder.map((orderReturn) => (
            <View
              key={`order-return-${orderReturn.id}`}
              style={styles.returnHistoryCard}
            >
              <View style={styles.returnHistoryMetaRow}>
                <Text style={styles.returnHistoryMeta}>
                  {formatReturnTimestamp(orderReturn.createdAt)}
                </Text>
                <View style={styles.returnHistoryItemsPill}>
                  <Text style={styles.returnHistoryItemsPillText}>
                    {orderReturn.totalItems}
                  </Text>
                </View>
              </View>

              <View style={styles.returnHistoryField}>
                <Text style={styles.returnHistoryFieldLabel}>
                  {text.orders.returnReasonLabel}
                </Text>
                <Text style={styles.returnHistoryFieldValue}>
                  {orderReturn.reason}
                </Text>
              </View>

              <View style={styles.returnHistoryField}>
                <Text style={styles.returnHistoryFieldLabel}>
                  {text.orders.returnHistoryProductsLabel}
                </Text>
                <Text style={styles.returnHistoryFieldValue}>
                  {buildReturnProductsLabel(orderReturn)}
                </Text>
              </View>

              {orderReturn.notes ? (
                <View style={styles.returnHistoryField}>
                  <Text style={styles.returnHistoryFieldLabel}>
                    {text.orders.returnNotesLabel}
                  </Text>
                  <Text style={styles.returnHistoryFieldValue}>
                    {orderReturn.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.orderActionsRow}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => onDownloadOrderBon(order)}
        >
          <Ionicons
            name="download-outline"
            size={16}
            color={COLORS.textOnDark}
          />
          <Text style={styles.primaryButtonText}>
            {text.orders.downloadBonButton}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButton,
            returnDraftLoadingOrderId !== null && styles.disabledButton,
          ]}
          onPress={() => onOpenReturnDraft(order)}
          disabled={returnDraftLoadingOrderId !== null}
        >
          <Ionicons
            name="return-up-back-outline"
            size={16}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.secondaryButtonText}>
            {returnDraftLoadingOrderId === order.id
              ? text.orders.creatingReturnDraft
              : text.orders.createReturnButton}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryButton,
            deletingOrderId === order.id && styles.disabledButton,
          ]}
          onPress={() => onDeleteOrder(order)}
          disabled={deletingOrderId === order.id}
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.secondaryButtonText}>
            {deletingOrderId === order.id
              ? text.orders.deletingHistoryButton
              : text.orders.deleteHistoryButton}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

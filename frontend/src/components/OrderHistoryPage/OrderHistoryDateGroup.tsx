import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type {
  OrderReturnSummary,
  OrderSummary,
} from '../../services/ordersApi';
import { formatAmount } from './orderHistory.shared';
import { OrderHistoryOrderCard } from './OrderHistoryOrderCard';
import { styles } from './OrderHistoryPage.styles';

type OrderHistoryDateGroupProps = {
  text: AppText;
  date: string;
  dateOrders: OrderSummary[];
  isOpen: boolean;
  returnsByOrderId: Map<number, OrderReturnSummary[]>;
  deletingOrderId: number | null;
  deletingReturnId: number | null;
  returnDraftLoadingOrderId: number | null;
  onToggle: (date: string) => void;
  onDownloadOrderBon: (order: {
    id: number;
    bonUrl: string;
    number?: string;
  }) => void;
  onOpenReturnDraft: (order: OrderSummary) => void;
  onDeleteOrder: (order: OrderSummary) => void;
  onDeleteReturn: (orderReturn: OrderReturnSummary) => void;
};

export function OrderHistoryDateGroup({
  text,
  date,
  dateOrders,
  isOpen,
  returnsByOrderId,
  deletingOrderId,
  deletingReturnId,
  returnDraftLoadingOrderId,
  onToggle,
  onDownloadOrderBon,
  onOpenReturnDraft,
  onDeleteOrder,
  onDeleteReturn,
}: OrderHistoryDateGroupProps) {
  const totalItems = dateOrders.reduce(
    (sum, order) => sum + order.totalItems,
    0,
  );
  const totalAmount = dateOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );

  return (
    <View style={[styles.dateSection, isOpen && styles.dateSectionOpen]}>
      <Pressable style={styles.dateHeaderButton} onPress={() => onToggle(date)}>
        <View style={styles.dateHeaderMain}>
          <View style={styles.dateIconWrap}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.brandPrimary}
            />
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>{date}</Text>
            <View style={styles.dateMetaRow}>
              <View style={styles.dateMetaPill}>
                <Ionicons
                  name="receipt-outline"
                  size={13}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.dateMetaText}>{dateOrders.length}</Text>
              </View>
              <View style={styles.dateMetaPill}>
                <Ionicons
                  name="cube-outline"
                  size={13}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.dateMetaText}>{totalItems}</Text>
              </View>
              <View style={styles.dateMetaPill}>
                <Ionicons
                  name="cash-outline"
                  size={13}
                  color={COLORS.brandPrimary}
                />
                <Text style={styles.dateMetaText}>
                  {formatAmount(totalAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={COLORS.textMuted}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.ordersGrid}>
          {dateOrders.map((order) => (
            <OrderHistoryOrderCard
              key={order.id}
              text={text}
              order={order}
              returnsForOrder={returnsByOrderId.get(order.id) ?? []}
              deletingOrderId={deletingOrderId}
              deletingReturnId={deletingReturnId}
              returnDraftLoadingOrderId={returnDraftLoadingOrderId}
              onDownloadOrderBon={onDownloadOrderBon}
              onOpenReturnDraft={onOpenReturnDraft}
              onDeleteOrder={onDeleteOrder}
              onDeleteReturn={onDeleteReturn}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

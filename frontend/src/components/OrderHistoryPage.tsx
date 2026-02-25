import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../locales/translations';
import type { OrderSummary } from '../services/ordersApi';
import { styles } from '../styles/appStyles';

type OrderHistoryPageProps = {
  text: AppText;
  orders: OrderSummary[];
  isLoading: boolean;
  onRefresh: () => void;
  onDownloadOrderBon: (order: { id: number; bonUrl: string; number?: string }) => void;
};

export function OrderHistoryPage({
  text,
  orders,
  isLoading,
  onRefresh,
  onDownloadOrderBon,
}: OrderHistoryPageProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{text.orders.historyTitle}</Text>
      <Text style={styles.subtitle}>{text.orders.historySubtitle}</Text>

      <Pressable style={styles.secondaryButton} onPress={onRefresh}>
        <Text style={styles.secondaryButtonText}>{text.orders.refreshHistoryButton}</Text>
      </Pressable>

      {isLoading ? <Text style={styles.docEmpty}>{text.orders.loading}</Text> : null}

      {!isLoading && orders.length === 0 ? (
        <Text style={styles.docEmpty}>{text.orders.historyEmpty}</Text>
      ) : null}

      <View style={styles.listBlock}>
        {orders.map((order) => (
          <View key={order.id} style={styles.docItem}>
            <Text style={styles.docItemTitle}>{order.number}</Text>
            <Text style={styles.docItemMeta}>
              {text.orders.deliveryDateLabel}: {order.deliveryDate}
            </Text>
            <Text style={styles.docItemMeta}>
              {text.orders.deliveryAddressLabel}: {order.deliveryAddress}
            </Text>
            <Text style={styles.docItemMeta}>
              {text.orders.summaryAmount}: {order.totalAmount.toFixed(2)}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => onDownloadOrderBon(order)}
            >
              <Text style={styles.secondaryButtonText}>{text.orders.downloadBonButton}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

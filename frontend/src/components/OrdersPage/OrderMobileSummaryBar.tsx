import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { formatAmount } from './ordersPage.shared';
import { styles } from './OrdersPage.styles';

type OrderMobileSummaryBarProps = {
  text: AppText;
  totalAmount: number;
  totalItems: number;
  onSubmitOrder: () => void;
};

export function OrderMobileSummaryBar({
  text,
  totalAmount,
  totalItems,
  onSubmitOrder,
}: OrderMobileSummaryBarProps) {
  const isDisabled = totalItems === 0;

  return (
    <View style={styles.mobileSummaryBar}>
      <View style={styles.mobileSummaryMetrics}>
        <View style={styles.mobileSummaryMetric}>
          <Text style={styles.mobileSummaryLabel}>
            {text.orders.summaryItems}
          </Text>
          <Text style={styles.mobileSummaryValue}>{totalItems}</Text>
        </View>
        <View style={styles.mobileSummaryMetric}>
          <Text style={styles.mobileSummaryLabel}>
            {text.orders.summaryAmount}
          </Text>
          <Text style={styles.mobileSummaryValue}>
            {formatAmount(totalAmount)}
          </Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.mobileSummaryButton,
          isDisabled && styles.buttonDisabled,
        ]}
        disabled={isDisabled}
        onPress={onSubmitOrder}
        accessibilityRole="button"
        accessibilityLabel={text.orders.submitButton}
        accessibilityState={{ disabled: isDisabled }}
      >
        <Text style={styles.primaryButtonText}>{text.orders.submitButton}</Text>
      </Pressable>
    </View>
  );
}

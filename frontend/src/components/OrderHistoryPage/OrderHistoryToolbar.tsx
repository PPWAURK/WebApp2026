import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import {
  PERIODS,
  SORTS,
  type PeriodKey,
  type SortKey,
  type SupplierOrderGroup,
} from './orderHistory.shared';
import { styles } from './OrderHistoryPage.styles';

type OrderHistoryToolbarProps = {
  text: AppText;
  groupedOrders: SupplierOrderGroup[];
  selectedSupplierKey: string | null;
  search: string;
  period: PeriodKey;
  sortBy: SortKey;
  isMediumScreen: boolean;
  onSelectSupplier: (supplierKey: string) => void;
  onChangeSearch: (value: string) => void;
  onChangePeriod: (period: PeriodKey) => void;
  onChangeSort: (sort: SortKey) => void;
};

export function OrderHistoryToolbar({
  text,
  groupedOrders,
  selectedSupplierKey,
  search,
  period,
  sortBy,
  isMediumScreen,
  onSelectSupplier,
  onChangeSearch,
  onChangePeriod,
  onChangeSort,
}: OrderHistoryToolbarProps) {
  if (groupedOrders.length === 0) {
    return null;
  }

  return (
    <View style={styles.toolbarCard}>
      <View style={styles.toolSection}>
        <Text style={styles.toolSectionTitle}>
          {text.orders.supplierTabsTitle}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRail}
        >
          {groupedOrders.map((supplierGroup) => {
            const isActive = supplierGroup.supplierKey === selectedSupplierKey;

            return (
              <Pressable
                key={`supplier-${supplierGroup.supplierKey}`}
                style={[
                  styles.supplierChip,
                  isActive && styles.supplierChipActive,
                ]}
                onPress={() => onSelectSupplier(supplierGroup.supplierKey)}
              >
                <Text
                  style={[
                    styles.supplierChipText,
                    isActive && styles.supplierChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {supplierGroup.supplierName}
                </Text>
                <View
                  style={[
                    styles.supplierChipCount,
                    isActive && styles.supplierChipCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.supplierChipCountText,
                      isActive && styles.supplierChipCountTextActive,
                    ]}
                  >
                    {supplierGroup.orders.length}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View
        style={[styles.toolbarGrid, isMediumScreen && styles.toolbarGridWide]}
      >
        <View style={[styles.toolSection, styles.searchSection]}>
          <View style={styles.searchShell}>
            <Ionicons
              name="search-outline"
              size={18}
              color={COLORS.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={text.orders.searchHistoryPlaceholder}
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={onChangeSearch}
            />
          </View>
        </View>

        <View style={[styles.toolSection, styles.toolSectionWide]}>
          <Text style={styles.toolSectionTitle}>
            {text.orders.periodTabsTitle}
          </Text>
          <View style={styles.filterWrap}>
            {PERIODS.map((periodOption) => {
              const isActive = periodOption.key === period;

              return (
                <Pressable
                  key={`period-${periodOption.key}`}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => onChangePeriod(periodOption.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {text.orders[periodOption.textKey]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.toolSection, styles.toolSectionWide]}>
          <Text style={styles.toolSectionTitle}>
            {text.orders.sortTabsTitle}
          </Text>
          <View style={styles.filterWrap}>
            {SORTS.map((sortOption) => {
              const isActive = sortOption.key === sortBy;

              return (
                <Pressable
                  key={`sort-${sortOption.key}`}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => onChangeSort(sortOption.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {text.orders[sortOption.textKey]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

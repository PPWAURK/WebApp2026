import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { Restaurant } from '../../types/auth';
import {
  PERIODS,
  SORTS,
  type PeriodKey,
  type SortKey,
  type SupplierOrderGroup,
} from './orderHistory.shared';
import { styles } from './OrderHistoryPage.styles';

function ChipLayout({
  wrap,
  children,
}: {
  wrap: boolean;
  children: ReactNode;
}) {
  if (wrap) {
    return <View style={styles.chipWrap}>{children}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRail}
    >
      {children}
    </ScrollView>
  );
}

type OrderHistoryToolbarProps = {
  text: AppText;
  groupedOrders: SupplierOrderGroup[];
  restaurantOptions: Restaurant[];
  selectedRestaurantId: number | null;
  allRestaurantsLabel: string;
  canSelectAllRestaurants: boolean;
  selectedSupplierKey: string | null;
  search: string;
  period: PeriodKey;
  sortBy: SortKey;
  isMediumScreen: boolean;
  onSelectRestaurant: (restaurantId: number | null) => void;
  onSelectSupplier: (supplierKey: string) => void;
  onChangeSearch: (value: string) => void;
  onChangePeriod: (period: PeriodKey) => void;
  onChangeSort: (sort: SortKey) => void;
};

export function OrderHistoryToolbar({
  text,
  groupedOrders,
  restaurantOptions,
  selectedRestaurantId,
  allRestaurantsLabel,
  canSelectAllRestaurants,
  selectedSupplierKey,
  search,
  period,
  sortBy,
  isMediumScreen,
  onSelectRestaurant,
  onSelectSupplier,
  onChangeSearch,
  onChangePeriod,
  onChangeSort,
}: OrderHistoryToolbarProps) {
  const showRestaurantFilters =
    restaurantOptions.length > 1 ||
    (restaurantOptions.length > 0 && canSelectAllRestaurants);

  if (groupedOrders.length === 0 && !showRestaurantFilters) {
    return null;
  }

  return (
    <View style={styles.toolbarCard}>
      {showRestaurantFilters ? (
        <View style={styles.toolSection}>
          <Text style={styles.toolSectionTitle}>
            {text.orders.restaurantFilterTitle}
          </Text>
          <ChipLayout wrap={!isMediumScreen}>
            {canSelectAllRestaurants ? (
              <Pressable
                style={[
                  styles.supplierChip,
                  selectedRestaurantId === null && styles.supplierChipActive,
                ]}
                onPress={() => onSelectRestaurant(null)}
                accessibilityRole="button"
                accessibilityLabel={allRestaurantsLabel}
                accessibilityState={{ selected: selectedRestaurantId === null }}
              >
                <Text
                  style={[
                    styles.supplierChipText,
                    selectedRestaurantId === null &&
                      styles.supplierChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {allRestaurantsLabel}
                </Text>
              </Pressable>
            ) : null}

            {restaurantOptions.map((restaurant) => {
              const isActive = restaurant.id === selectedRestaurantId;

              return (
                <Pressable
                  key={`restaurant-${restaurant.id}`}
                  style={[
                    styles.supplierChip,
                    isActive && styles.supplierChipActive,
                  ]}
                  onPress={() => onSelectRestaurant(restaurant.id)}
                  accessibilityRole="button"
                  accessibilityLabel={restaurant.name}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.supplierChipText,
                      isActive && styles.supplierChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {restaurant.name}
                  </Text>
                </Pressable>
              );
            })}
          </ChipLayout>
        </View>
      ) : null}

      {groupedOrders.length > 0 ? (
        <View style={styles.toolSection}>
          <Text style={styles.toolSectionTitle}>
            {text.orders.supplierTabsTitle}
          </Text>
          <ChipLayout wrap={!isMediumScreen}>
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
                  accessibilityRole="button"
                  accessibilityLabel={supplierGroup.supplierName}
                  accessibilityState={{ selected: isActive }}
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
          </ChipLayout>
        </View>
      ) : null}

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
              accessibilityLabel={text.orders.searchHistoryPlaceholder}
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
                  accessibilityRole="button"
                  accessibilityLabel={text.orders[periodOption.textKey]}
                  accessibilityState={{ selected: isActive }}
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
                    !isMediumScreen && styles.sortFilterChipCompact,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => onChangeSort(sortOption.key)}
                  accessibilityRole="button"
                  accessibilityLabel={text.orders[sortOption.textKey]}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !isMediumScreen && styles.sortFilterChipTextCompact,
                      isActive && styles.filterChipTextActive,
                    ]}
                    numberOfLines={isMediumScreen ? 1 : 2}
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

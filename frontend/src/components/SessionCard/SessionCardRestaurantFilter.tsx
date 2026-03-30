import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type {
  RestaurantFilterValue,
  RestaurantOption,
} from './SessionCard.types';

type SessionCardRestaurantFilterProps = {
  compact?: boolean;
  isOpen: boolean;
  onSelect: (value: RestaurantFilterValue) => void;
  onToggle: () => void;
  options: RestaurantOption[];
  selectedLabel: string;
  selectedValue: RestaurantFilterValue;
  text: AppText;
};

export function SessionCardRestaurantFilter({
  compact = false,
  isOpen,
  onSelect,
  onToggle,
  options,
  selectedLabel,
  selectedValue,
  text,
}: SessionCardRestaurantFilterProps) {
  const filterOptions: Array<{
    key: string;
    label: string;
    value: RestaurantFilterValue;
  }> = [
    {
      key: 'ALL',
      label: text.dashboard.quickRestaurantFilterAll,
      value: 'ALL',
    },
    {
      key: 'NONE',
      label: text.dashboard.quickRestaurantFilterUnassigned,
      value: 'NONE',
    },
    ...options.map((restaurant) => ({
      key: `${restaurant.id}`,
      label: restaurant.name,
      value: restaurant.id,
    })),
  ];

  return (
    <View
      style={[
        styles.restaurantFilterBlock,
        compact && styles.restaurantFilterBlockCompact,
      ]}
    >
      {!compact ? (
        <Text style={styles.quickSectionTitle}>
          {text.dashboard.quickRestaurantFilterTitle}
        </Text>
      ) : null}

      <View style={styles.restaurantFilterSelectWrap}>
        <Pressable
          style={[
            styles.restaurantFilterSelectTrigger,
            compact && styles.restaurantFilterSelectTriggerCompact,
          ]}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${text.dashboard.quickRestaurantFilterTitle} ${selectedLabel}`}
          accessibilityState={{ expanded: isOpen }}
        >
          <Text
            style={[
              styles.restaurantFilterSelectText,
              compact && styles.restaurantFilterSelectTextCompact,
            ]}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
          <Text style={styles.restaurantFilterSelectChevron}>
            {isOpen ? '▲' : '▼'}
          </Text>
        </Pressable>

        {isOpen ? (
          <View
            style={[
              styles.restaurantFilterSelectList,
              compact && styles.restaurantFilterSelectListCompact,
            ]}
          >
            {filterOptions.map((option, index) => {
              const isActive = selectedValue === option.value;

              return (
                <Pressable
                  key={`restaurant-filter-option-${option.key}`}
                  style={[
                    styles.restaurantFilterSelectItem,
                    compact && styles.restaurantFilterSelectItemCompact,
                    isActive && styles.restaurantFilterSelectItemActive,
                    index === filterOptions.length - 1 &&
                      styles.restaurantFilterSelectItemLast,
                  ]}
                  onPress={() => onSelect(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.restaurantFilterSelectItemText,
                      compact && styles.restaurantFilterSelectItemTextCompact,
                      isActive && styles.restaurantFilterSelectItemTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

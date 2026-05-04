import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { SupplierItem } from '../../services/suppliersApi';
import type { Language } from '../../types/language';
import {
  formatProductCategoryLabel,
  type ProductCategory,
} from './ordersPage.shared';
import { styles } from './OrdersPage.styles';

type OrderFilterPanelMode = 'suppliers' | 'filters' | 'mobile';

type SelectedCategoryId = number | 'ALL';

type OrderFilterPanelProps = {
  productCategories: ProductCategory[];
  language: Language;
  loading: boolean;
  mode: OrderFilterPanelMode;
  productSearch: string;
  selectedCategoryId: SelectedCategoryId;
  selectedSupplierId: number | 'ALL';
  selectedSupplierName: string;
  supplierProductCountById: Map<number, number>;
  suppliers: SupplierItem[];
  text: AppText;
  onProductSearchChange: (next: string) => void;
  onSelectedCategoryChange: (next: SelectedCategoryId) => void;
  onSelectSupplier: (supplierId: number) => void;
};

export function OrderFilterPanel({
  productCategories,
  language,
  loading,
  mode,
  productSearch,
  selectedCategoryId,
  selectedSupplierId,
  selectedSupplierName,
  supplierProductCountById,
  suppliers,
  text,
  onProductSearchChange,
  onSelectedCategoryChange,
  onSelectSupplier,
}: OrderFilterPanelProps) {
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const selectedSupplier = useMemo(
    () =>
      suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null,
    [selectedSupplierId, suppliers],
  );
  const selectedSupplierProductCount = selectedSupplier
    ? (supplierProductCountById.get(selectedSupplier.id) ?? 0)
    : 0;

  if (mode === 'suppliers') {
    return renderSupplierPanel({
      isSupplierDropdownOpen,
      loading,
      selectedSupplierId,
      selectedSupplierName,
      selectedSupplierProductCount,
      supplierProductCountById,
      suppliers,
      text,
      onDropdownOpenChange: setIsSupplierDropdownOpen,
      onSelectSupplier,
    });
  }

  if (mode === 'filters') {
    return renderSearchAndFilterPanel({
      productCategories,
      language,
      productSearch,
      selectedCategoryId,
      text,
      onProductSearchChange,
      onSelectedCategoryChange,
    });
  }

  return (
    <View style={[styles.surfaceCard, styles.mobileFilterPanel]}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.supplierLabel}</Text>
          <Text style={styles.surfaceTitle} numberOfLines={1}>
            {selectedSupplierName}
          </Text>
        </View>
      </View>

      {renderSupplierDropdown({
        isMobile: true,
        isOpen: isSupplierDropdownOpen,
        loading,
        selectedSupplierId,
        selectedSupplierName,
        selectedSupplierProductCount,
        supplierProductCountById,
        suppliers,
        text,
        onOpenChange: setIsSupplierDropdownOpen,
        onSelectSupplier: (supplierId) => {
          onSelectSupplier(supplierId);
          setIsSupplierDropdownOpen(false);
        },
      })}

      {renderSearchInput({
        productSearch,
        text,
        onProductSearchChange,
      })}

      {renderMobileFilterScroller({
        productCategories,
        language,
        selectedCategoryId,
        text,
        onSelectedCategoryChange,
      })}
    </View>
  );
}

function renderSupplierPanel({
  isSupplierDropdownOpen,
  loading,
  selectedSupplierId,
  selectedSupplierName,
  selectedSupplierProductCount,
  supplierProductCountById,
  suppliers,
  text,
  onDropdownOpenChange,
  onSelectSupplier,
}: Pick<
  OrderFilterPanelProps,
  | 'loading'
  | 'selectedSupplierId'
  | 'selectedSupplierName'
  | 'supplierProductCountById'
  | 'suppliers'
  | 'text'
  | 'onSelectSupplier'
> & {
  isSupplierDropdownOpen: boolean;
  selectedSupplierProductCount: number;
  onDropdownOpenChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.supplierLabel}</Text>
          <Text style={styles.surfaceTitle}>{selectedSupplierName}</Text>
          <Text style={styles.surfaceSubtitle}>
            {suppliers.length > 0
              ? `${suppliers.length} ${text.orders.supplierLabel.toLowerCase()}`
              : text.orders.empty}
          </Text>
        </View>
      </View>

      {renderSupplierDropdown({
        isMobile: false,
        isOpen: isSupplierDropdownOpen,
        loading,
        selectedSupplierId,
        selectedSupplierName,
        selectedSupplierProductCount,
        supplierProductCountById,
        suppliers,
        text,
        onOpenChange: onDropdownOpenChange,
        onSelectSupplier: (supplierId) => {
          onSelectSupplier(supplierId);
          onDropdownOpenChange(false);
        },
      })}
    </View>
  );
}

function renderSearchAndFilterPanel({
  productCategories,
  language,
  productSearch,
  selectedCategoryId,
  text,
  onProductSearchChange,
  onSelectedCategoryChange,
}: Pick<
  OrderFilterPanelProps,
  | 'productCategories'
  | 'language'
  | 'productSearch'
  | 'selectedCategoryId'
  | 'text'
  | 'onProductSearchChange'
  | 'onSelectedCategoryChange'
>) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{text.orders.filterLabel}</Text>
          <Text style={styles.surfaceTitle}>{text.orders.filterLabel}</Text>
          <Text style={styles.surfaceSubtitle}>
            {text.orders.searchProductsPlaceholder}
          </Text>
        </View>
      </View>

      {renderSearchInput({
        productSearch,
        text,
        onProductSearchChange,
      })}

      <Text style={styles.surfaceEyebrow}>{text.orders.categoryLabel}</Text>
      <View style={styles.categoryWrap}>
        {renderCategoryChip({
          isSelected: selectedCategoryId === 'ALL',
          label: text.orders.allCategories,
          onPress: () => onSelectedCategoryChange('ALL'),
        })}

        {productCategories.map((category) =>
          renderCategoryChip({
            isSelected: selectedCategoryId === category.id,
            key: String(category.id),
            label: formatProductCategoryLabel(category, language),
            onPress: () => onSelectedCategoryChange(category.id),
          }),
        )}
      </View>
    </View>
  );
}

function renderSupplierDropdown({
  isMobile,
  isOpen,
  loading,
  selectedSupplierId,
  selectedSupplierName,
  selectedSupplierProductCount,
  supplierProductCountById,
  suppliers,
  text,
  onOpenChange,
  onSelectSupplier,
}: Pick<
  OrderFilterPanelProps,
  | 'loading'
  | 'selectedSupplierId'
  | 'selectedSupplierName'
  | 'supplierProductCountById'
  | 'suppliers'
  | 'text'
  | 'onSelectSupplier'
> & {
  isMobile: boolean;
  isOpen: boolean;
  selectedSupplierProductCount: number;
  onOpenChange: (next: boolean) => void;
}) {
  if (loading) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.docEmpty}>{text.orders.loading}</Text>
      </View>
    );
  }

  if (suppliers.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.docEmpty}>{text.orders.empty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.supplierDropdownWrap}>
      <Pressable
        style={[
          styles.supplierDropdownButton,
          isMobile && styles.mobileSupplierDropdownButton,
          isOpen && styles.supplierDropdownButtonActive,
        ]}
        onPress={() => onOpenChange(!isOpen)}
        accessibilityRole="button"
        accessibilityLabel={selectedSupplierName}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.supplierDropdownButtonTextBlock}>
          <Text style={styles.supplierDropdownLabel}>
            {text.orders.supplierLabel}
          </Text>
          <Text style={styles.supplierDropdownValue} numberOfLines={1}>
            {selectedSupplierName}
          </Text>
        </View>

        <View style={styles.supplierDropdownMeta}>
          <Text style={styles.supplierDropdownCount}>
            {selectedSupplierProductCount}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#ab1e24"
          />
        </View>
      </Pressable>

      {isOpen ? (
        <View style={styles.supplierDropdownMenu}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {suppliers.map((supplier) =>
              renderSupplierOption({
                isSelected: selectedSupplierId === supplier.id,
                productCount: supplierProductCountById.get(supplier.id) ?? 0,
                supplier,
                onSelectSupplier,
              }),
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function renderMobileFilterScroller({
  productCategories,
  language,
  selectedCategoryId,
  text,
  onSelectedCategoryChange,
}: Pick<
  OrderFilterPanelProps,
  | 'productCategories'
  | 'language'
  | 'selectedCategoryId'
  | 'text'
  | 'onSelectedCategoryChange'
>) {
  return (
    <View>
      <Text style={styles.surfaceEyebrow}>{text.orders.categoryLabel}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileChipScrollerContent}
      >
        {renderCategoryChip({
          isMobile: true,
          isSelected: selectedCategoryId === 'ALL',
          label: text.orders.allCategories,
          onPress: () => onSelectedCategoryChange('ALL'),
        })}

        {productCategories.map((category) =>
          renderCategoryChip({
            isMobile: true,
            isSelected: selectedCategoryId === category.id,
            key: String(category.id),
            label: formatProductCategoryLabel(category, language),
            onPress: () => onSelectedCategoryChange(category.id),
          }),
        )}
      </ScrollView>
    </View>
  );
}

function renderSearchInput({
  productSearch,
  text,
  onProductSearchChange,
}: Pick<
  OrderFilterPanelProps,
  'productSearch' | 'text' | 'onProductSearchChange'
>) {
  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color="#8d5a5f" />
        <TextInput
          style={styles.searchInput}
          value={productSearch}
          onChangeText={onProductSearchChange}
          placeholder={text.orders.searchProductsPlaceholder}
          placeholderTextColor="#aa777b"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function renderSupplierOption({
  isSelected,
  productCount,
  supplier,
  onSelectSupplier,
}: {
  isSelected: boolean;
  productCount: number;
  supplier: SupplierItem;
  onSelectSupplier: (supplierId: number) => void;
}) {
  return (
    <Pressable
      key={supplier.id}
      style={[
        styles.supplierDropdownOption,
        isSelected && styles.supplierDropdownOptionActive,
      ]}
      onPress={() => onSelectSupplier(supplier.id)}
      accessibilityRole="button"
      accessibilityLabel={supplier.name}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.supplierDropdownOptionRow}>
        <Text
          style={[
            styles.supplierDropdownOptionText,
            isSelected && styles.supplierDropdownOptionTextActive,
          ]}
          numberOfLines={1}
        >
          {supplier.name}
        </Text>
        <Text
          style={[
            styles.supplierDropdownOptionCount,
            isSelected && styles.supplierDropdownOptionCountActive,
          ]}
        >
          {productCount}
        </Text>
      </View>
    </Pressable>
  );
}

function renderCategoryChip({
  isMobile = false,
  isSelected,
  key,
  label,
  onPress,
}: {
  isMobile?: boolean;
  isSelected: boolean;
  key?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      key={key ?? label}
      style={[
        styles.categoryChip,
        isMobile && styles.mobileCategoryChip,
        isSelected && styles.categoryChipActive,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

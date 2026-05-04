import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { ProductCategoryItem } from '../../services/productsApi';
import type { Language } from '../../types/language';
import { styles } from './SupplierManagementPage.styles';

type ProductCategorySelectProps = {
  text: AppText;
  language: Language;
  categories: ProductCategoryItem[];
  selectedCategoryId: number | null;
  disabled?: boolean;
  onSelectCategory: (categoryId: number) => void;
};

export function ProductCategorySelect({
  text,
  language,
  categories,
  selectedCategoryId,
  disabled = false,
  onSelectCategory,
}: ProductCategorySelectProps) {
  return (
    <View style={styles.categorySelectBlock}>
      <Text style={styles.fieldLabel}>
        {text.supplierManagement.fields.category}
      </Text>
      {categories.length === 0 ? (
        <Text style={styles.docEmpty}>
          {text.supplierManagement.productCategoriesEmpty}
        </Text>
      ) : (
        <View style={styles.categoryChipGrid}>
          {categories.map((category) => {
            const isSelected = selectedCategoryId === category.id;
            const label = language === 'zh' ? category.nameZh : category.nameFr;

            return (
              <Pressable
                key={category.id}
                style={[
                  styles.categorySelectChip,
                  isSelected && styles.categorySelectChipActive,
                  disabled && styles.buttonDisabled,
                ]}
                disabled={disabled}
                onPress={() => onSelectCategory(category.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
              >
                <Text
                  style={[
                    styles.categorySelectChipText,
                    isSelected && styles.categorySelectChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

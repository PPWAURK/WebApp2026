import { Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { ProductCategoryItem } from '../../services/productsApi';
import type { Language } from '../../types/language';
import type { SupplierItem } from '../../services/suppliersApi';
import { styles } from './SupplierManagementPage.styles';

type ProductCategoryManagementCardProps = {
  text: AppText;
  language: Language;
  selectedSupplier: SupplierItem | null;
  categories: ProductCategoryItem[];
  selectedCategoryId: number | null;
  newCategoryNameZh: string;
  newCategoryNameFr: string;
  editCategoryNameZh: string;
  editCategoryNameFr: string;
  updatingCategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
  onChangeNewCategoryNameZh: (value: string) => void;
  onChangeNewCategoryNameFr: (value: string) => void;
  onChangeEditCategoryNameZh: (value: string) => void;
  onChangeEditCategoryNameFr: (value: string) => void;
  onCreateCategory: () => void;
  onSaveCategory: () => void;
  onMoveCategory: (categoryId: number, direction: 'up' | 'down') => void;
  onDeleteCategory: (categoryId: number) => void;
};

export function ProductCategoryManagementCard({
  text,
  language,
  selectedSupplier,
  categories,
  selectedCategoryId,
  newCategoryNameZh,
  newCategoryNameFr,
  editCategoryNameZh,
  editCategoryNameFr,
  updatingCategoryId,
  onSelectCategory,
  onChangeNewCategoryNameZh,
  onChangeNewCategoryNameFr,
  onChangeEditCategoryNameZh,
  onChangeEditCategoryNameFr,
  onCreateCategory,
  onSaveCategory,
  onMoveCategory,
  onDeleteCategory,
}: ProductCategoryManagementCardProps) {
  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>
            {text.supplierManagement.productCategoriesTitle}
          </Text>
          <Text style={styles.surfaceTitle}>
            {text.supplierManagement.productCategoriesTitle}
          </Text>
          <Text style={styles.surfaceSubtitle}>
            {selectedSupplier
              ? selectedSupplier.name
              : text.supplierManagement.selectSupplierFirst}
          </Text>
        </View>
      </View>

      {!selectedSupplier ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>
            {text.supplierManagement.selectSupplierFirst}
          </Text>
        </View>
      ) : null}

      <View style={styles.categoryList}>
        {categories.map((category, index) => {
          const isSelected = selectedCategoryId === category.id;
          const label = language === 'zh' ? category.nameZh : category.nameFr;
          const isUpdating = updatingCategoryId === category.id;

          return (
            <Pressable
              key={category.id}
              style={[
                styles.categoryManagementRow,
                isSelected && styles.categoryManagementRowActive,
              ]}
              onPress={() => onSelectCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryManagementTitle,
                  isSelected && styles.categorySelectChipTextActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              <View style={styles.categoryManagementActions}>
                <Pressable
                  style={[
                    styles.categorySmallButton,
                    (index === 0 || isUpdating) && styles.buttonDisabled,
                  ]}
                  disabled={index === 0 || isUpdating}
                  onPress={() => onMoveCategory(category.id, 'up')}
                >
                  <Text style={styles.categorySmallButtonText}>↑</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.categorySmallButton,
                    (index === categories.length - 1 || isUpdating) &&
                      styles.buttonDisabled,
                  ]}
                  disabled={index === categories.length - 1 || isUpdating}
                  onPress={() => onMoveCategory(category.id, 'down')}
                >
                  <Text style={styles.categorySmallButtonText}>↓</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.categoryDeleteButton,
                    isUpdating && styles.buttonDisabled,
                  ]}
                  disabled={isUpdating}
                  onPress={() => onDeleteCategory(category.id)}
                >
                  <Text style={styles.categoryDeleteButtonText}>
                    {text.supplierManagement.deleteCategoryButton}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedCategory ? (
        <View style={styles.categoryEditBlock}>
          <Text style={styles.fieldLabel}>
            {text.supplierManagement.editCategoryButton}
          </Text>
          <TextInput
            style={styles.input}
            value={editCategoryNameZh}
            onChangeText={onChangeEditCategoryNameZh}
            placeholder={text.supplierManagement.categoryNameZhPlaceholder}
          />
          <TextInput
            style={styles.input}
            value={editCategoryNameFr}
            onChangeText={onChangeEditCategoryNameFr}
            placeholder={text.supplierManagement.categoryNameFrPlaceholder}
          />
          <Pressable
            style={[
              styles.secondaryButton,
              updatingCategoryId === selectedCategory.id &&
                styles.buttonDisabled,
            ]}
            disabled={updatingCategoryId === selectedCategory.id}
            onPress={onSaveCategory}
          >
            <Text style={styles.secondaryButtonText}>
              {text.supplierManagement.saveCategoryButton}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.categoryEditBlock}>
        <Text style={styles.fieldLabel}>
          {text.supplierManagement.createCategoryButton}
        </Text>
        <TextInput
          style={styles.input}
          value={newCategoryNameZh}
          onChangeText={onChangeNewCategoryNameZh}
          placeholder={text.supplierManagement.categoryNameZhPlaceholder}
        />
        <TextInput
          style={styles.input}
          value={newCategoryNameFr}
          onChangeText={onChangeNewCategoryNameFr}
          placeholder={text.supplierManagement.categoryNameFrPlaceholder}
        />
        <Pressable
          style={[
            styles.primaryButton,
            !selectedSupplier && styles.buttonDisabled,
          ]}
          disabled={!selectedSupplier}
          onPress={onCreateCategory}
        >
          <Text style={styles.primaryButtonText}>
            {text.supplierManagement.createCategoryButton}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

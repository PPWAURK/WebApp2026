import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { ProductCategoryItem } from '../../services/productsApi';
import type { SupplierItem } from '../../services/suppliersApi';
import type { Language } from '../../types/language';
import { FieldInput } from './FieldInput';
import { ProductCategorySelect } from './ProductCategorySelect';
import { styles } from './SupplierManagementPage.styles';

type ProductCreateCardProps = {
  text: AppText;
  language: Language;
  selectedSupplier: SupplierItem | null;
  selectedSupplierId: number | null;
  productCategories: ProductCategoryItem[];
  selectedCategoryId: number | null;
  isMediumScreen: boolean;
  isCreatingProduct: boolean;
  newProductReference: string;
  newProductNameZh: string;
  newProductNameFr: string;
  newProductSpecification: string;
  newProductUnit: string;
  newProductPriceHt: string;
  newProductSpecification2: string;
  newProductUnit2: string;
  newProductPriceHt2: string;
  newProductSpecification3: string;
  newProductUnit3: string;
  newProductPriceHt3: string;
  onChangeReference: (value: string) => void;
  onSelectCategory: (categoryId: number) => void;
  onChangeNameZh: (value: string) => void;
  onChangeNameFr: (value: string) => void;
  onChangeSpecification: (value: string) => void;
  onChangeUnit: (value: string) => void;
  onChangePriceHt: (value: string) => void;
  onChangeSpecification2: (value: string) => void;
  onChangeUnit2: (value: string) => void;
  onChangePriceHt2: (value: string) => void;
  onChangeSpecification3: (value: string) => void;
  onChangeUnit3: (value: string) => void;
  onChangePriceHt3: (value: string) => void;
  onCreateProduct: () => void;
};

export function ProductCreateCard({
  text,
  language,
  selectedSupplier,
  selectedSupplierId,
  productCategories,
  selectedCategoryId,
  isMediumScreen,
  isCreatingProduct,
  newProductReference,
  newProductNameZh,
  newProductNameFr,
  newProductSpecification,
  newProductUnit,
  newProductPriceHt,
  newProductSpecification2,
  newProductUnit2,
  newProductPriceHt2,
  newProductSpecification3,
  newProductUnit3,
  newProductPriceHt3,
  onChangeReference,
  onSelectCategory,
  onChangeNameZh,
  onChangeNameFr,
  onChangeSpecification,
  onChangeUnit,
  onChangePriceHt,
  onChangeSpecification2,
  onChangeUnit2,
  onChangePriceHt2,
  onChangeSpecification3,
  onChangeUnit3,
  onChangePriceHt3,
  onCreateProduct,
}: ProductCreateCardProps) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>
            {text.supplierManagement.newProductLabel}
          </Text>
          <Text style={styles.surfaceTitle}>
            {text.supplierManagement.createProductButton}
          </Text>
          <Text style={styles.surfaceSubtitle}>
            {selectedSupplier
              ? selectedSupplier.name
              : text.supplierManagement.selectSupplierFirst}
          </Text>
        </View>
        {selectedSupplier ? (
          <Text style={styles.surfacePill} numberOfLines={1}>
            {selectedSupplier.name}
          </Text>
        ) : null}
      </View>

      {!selectedSupplierId ? (
        <View style={styles.emptyCard}>
          <Text style={styles.docEmpty}>
            {text.supplierManagement.selectSupplierFirst}
          </Text>
        </View>
      ) : null}

      <View style={[styles.fieldGrid, isMediumScreen && styles.fieldGridWide]}>
        <FieldInput
          label={text.supplierManagement.fields.reference}
          value={newProductReference}
          onChangeText={onChangeReference}
          isMediumScreen={isMediumScreen}
        />
        <ProductCategorySelect
          text={text}
          language={language}
          categories={productCategories}
          selectedCategoryId={selectedCategoryId}
          disabled={!selectedSupplierId}
          onSelectCategory={onSelectCategory}
        />
        <FieldInput
          label={text.supplierManagement.fields.nameZh}
          value={newProductNameZh}
          onChangeText={onChangeNameZh}
          isMediumScreen={isMediumScreen}
          fullWidth
        />
        <FieldInput
          label={text.supplierManagement.fields.nameFr}
          value={newProductNameFr}
          onChangeText={onChangeNameFr}
          isMediumScreen={isMediumScreen}
          fullWidth
        />
        <FieldInput
          label={text.supplierManagement.fields.specification}
          value={newProductSpecification}
          onChangeText={onChangeSpecification}
          isMediumScreen={isMediumScreen}
          fullWidth
        />
        <FieldInput
          label={text.supplierManagement.fields.unit}
          value={newProductUnit}
          onChangeText={onChangeUnit}
          isMediumScreen={isMediumScreen}
        />
        <FieldInput
          label={text.supplierManagement.fields.priceHt}
          value={newProductPriceHt}
          onChangeText={onChangePriceHt}
          isMediumScreen={isMediumScreen}
          keyboardType="decimal-pad"
        />
        <FieldInput
          label={`${text.supplierManagement.fields.specification} 2`}
          value={newProductSpecification2}
          onChangeText={onChangeSpecification2}
          isMediumScreen={isMediumScreen}
          fullWidth
        />
        <FieldInput
          label={`${text.supplierManagement.fields.unit} 2`}
          value={newProductUnit2}
          onChangeText={onChangeUnit2}
          isMediumScreen={isMediumScreen}
        />
        <FieldInput
          label={`${text.supplierManagement.fields.priceHt} 2`}
          value={newProductPriceHt2}
          onChangeText={onChangePriceHt2}
          isMediumScreen={isMediumScreen}
          keyboardType="decimal-pad"
        />
        <FieldInput
          label={`${text.supplierManagement.fields.specification} 3`}
          value={newProductSpecification3}
          onChangeText={onChangeSpecification3}
          isMediumScreen={isMediumScreen}
          fullWidth
        />
        <FieldInput
          label={`${text.supplierManagement.fields.unit} 3`}
          value={newProductUnit3}
          onChangeText={onChangeUnit3}
          isMediumScreen={isMediumScreen}
        />
        <FieldInput
          label={`${text.supplierManagement.fields.priceHt} 3`}
          value={newProductPriceHt3}
          onChangeText={onChangePriceHt3}
          isMediumScreen={isMediumScreen}
          keyboardType="decimal-pad"
        />
      </View>

      <Pressable
        style={[
          styles.primaryButton,
          (!selectedSupplierId || isCreatingProduct) && styles.buttonDisabled,
        ]}
        disabled={!selectedSupplierId || isCreatingProduct}
        onPress={onCreateProduct}
      >
        <Text style={styles.primaryButtonText}>
          {isCreatingProduct
            ? text.supplierManagement.creatingProduct
            : text.supplierManagement.createProductButton}
        </Text>
      </Pressable>
    </View>
  );
}

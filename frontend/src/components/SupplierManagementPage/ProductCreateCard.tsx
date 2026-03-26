import { Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { SupplierItem } from '../../services/suppliersApi';
import { FieldInput } from './FieldInput';
import { styles } from './SupplierManagementPage.styles';

type ProductCreateCardProps = {
  text: AppText;
  selectedSupplier: SupplierItem | null;
  selectedSupplierId: number | null;
  isMediumScreen: boolean;
  isCreatingProduct: boolean;
  newProductReference: string;
  newProductCategory: string;
  newProductNameZh: string;
  newProductNameFr: string;
  newProductSpecification: string;
  newProductUnit: string;
  newProductPriceHt: string;
  onChangeReference: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeNameZh: (value: string) => void;
  onChangeNameFr: (value: string) => void;
  onChangeSpecification: (value: string) => void;
  onChangeUnit: (value: string) => void;
  onChangePriceHt: (value: string) => void;
  onCreateProduct: () => void;
};

export function ProductCreateCard({
  text,
  selectedSupplier,
  selectedSupplierId,
  isMediumScreen,
  isCreatingProduct,
  newProductReference,
  newProductCategory,
  newProductNameZh,
  newProductNameFr,
  newProductSpecification,
  newProductUnit,
  newProductPriceHt,
  onChangeReference,
  onChangeCategory,
  onChangeNameZh,
  onChangeNameFr,
  onChangeSpecification,
  onChangeUnit,
  onChangePriceHt,
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
        <FieldInput
          label={text.supplierManagement.fields.category}
          value={newProductCategory}
          onChangeText={onChangeCategory}
          isMediumScreen={isMediumScreen}
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

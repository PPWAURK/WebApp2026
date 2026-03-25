import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { ProductItem } from '../../services/productsApi';
import type { SupplierItem } from '../../services/suppliersApi';
import { FieldInput } from './FieldInput';
import { styles } from './SupplierManagementPage.styles';

type ProductEditorModalProps = {
  text: AppText;
  visible: boolean;
  selectedProduct: ProductItem | null;
  selectedSupplier: SupplierItem | null;
  isMediumScreen: boolean;
  isSavingProduct: boolean;
  isUploadingImage: boolean;
  editCategory: string;
  editNameZh: string;
  editNameFr: string;
  editSpecification: string;
  editPriceHt: string;
  editImage: string;
  onChangeCategory: (value: string) => void;
  onChangeNameZh: (value: string) => void;
  onChangeNameFr: (value: string) => void;
  onChangeSpecification: (value: string) => void;
  onChangePriceHt: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onUploadImage: () => void;
};

export function ProductEditorModal({
  text,
  visible,
  selectedProduct,
  selectedSupplier,
  isMediumScreen,
  isSavingProduct,
  isUploadingImage,
  editCategory,
  editNameZh,
  editNameFr,
  editSpecification,
  editPriceHt,
  editImage,
  onChangeCategory,
  onChangeNameZh,
  onChangeNameFr,
  onChangeSpecification,
  onChangePriceHt,
  onClose,
  onSave,
  onUploadImage,
}: ProductEditorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.docBlockTitle}>
                {text.supplierManagement.editProductTitle}
              </Text>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>
                  {text.supplierManagement.closeEditor}
                </Text>
              </Pressable>
            </View>

            {selectedProduct ? (
              <>
                <View
                  style={[
                    styles.modalPreviewCard,
                    isMediumScreen && styles.modalPreviewCardWide,
                  ]}
                >
                  {editImage ? (
                    <View style={styles.modalPreviewImageWrap}>
                      <Image
                        source={{ uri: editImage }}
                        style={styles.productImagePreview}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={styles.modalPreviewImagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color={COLORS.brandPrimary}
                      />
                    </View>
                  )}

                  <View style={styles.modalPreviewCopy}>
                    <Text style={styles.modalPreviewTitle}>
                      {selectedProduct.nameFr ?? selectedProduct.nameZh}
                    </Text>
                    <View style={styles.modalPreviewChipRow}>
                      <View style={styles.modalPreviewChip}>
                        <Text style={styles.modalPreviewChipText}>
                          {selectedSupplier?.name ??
                            text.supplierManagement.suppliersLabel}
                        </Text>
                      </View>
                      <View style={styles.modalPreviewChip}>
                        <Text style={styles.modalPreviewChipText}>
                          {selectedProduct.category}
                        </Text>
                      </View>
                      {selectedProduct.reference ? (
                        <View style={styles.modalPreviewChip}>
                          <Text style={styles.modalPreviewChipText}>
                            {selectedProduct.reference}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.fieldGrid,
                    isMediumScreen && styles.fieldGridWide,
                  ]}
                >
                  <FieldInput
                    label={text.supplierManagement.fields.nameZh}
                    value={editNameZh}
                    onChangeText={onChangeNameZh}
                    isMediumScreen={isMediumScreen}
                    fullWidth
                  />
                  <FieldInput
                    label={text.supplierManagement.fields.nameFr}
                    value={editNameFr}
                    onChangeText={onChangeNameFr}
                    isMediumScreen={isMediumScreen}
                    fullWidth
                  />
                  <FieldInput
                    label={text.supplierManagement.fields.specification}
                    value={editSpecification}
                    onChangeText={onChangeSpecification}
                    isMediumScreen={isMediumScreen}
                    fullWidth
                  />
                  <FieldInput
                    label={text.supplierManagement.fields.category}
                    value={editCategory}
                    onChangeText={onChangeCategory}
                    isMediumScreen={isMediumScreen}
                  />
                  <FieldInput
                    label={text.supplierManagement.fields.priceHt}
                    value={editPriceHt}
                    onChangeText={onChangePriceHt}
                    isMediumScreen={isMediumScreen}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.imageManagerCard}>
                  <Text style={styles.fieldLabel}>
                    {text.supplierManagement.fields.image}
                  </Text>
                  <Text
                    style={styles.docItemLink}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {editImage || text.supplierManagement.noImage}
                  </Text>

                  <View
                    style={[
                      styles.actionRail,
                      !isMediumScreen && styles.actionRailStack,
                    ]}
                  >
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        styles.actionButtonFlex,
                        isUploadingImage && styles.buttonDisabled,
                      ]}
                      disabled={isUploadingImage}
                      onPress={onUploadImage}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {isUploadingImage
                          ? text.supplierManagement.uploadingImage
                          : text.supplierManagement.uploadImageButton}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.primaryButton,
                        styles.actionButtonFlex,
                        isSavingProduct && styles.buttonDisabled,
                      ]}
                      disabled={isSavingProduct}
                      onPress={onSave}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isSavingProduct
                          ? text.supplierManagement.savingProduct
                          : text.supplierManagement.saveProductButton}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

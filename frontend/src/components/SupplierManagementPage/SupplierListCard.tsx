import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { SupplierItem } from '../../services/suppliersApi';
import { styles } from './SupplierManagementPage.styles';

type SupplierListCardProps = {
  text: AppText;
  suppliers: SupplierItem[];
  selectedSupplierId: number | null;
  selectedSupplier: SupplierItem | null;
  supplierProductCountById: Map<number, number>;
  newSupplierName: string;
  isCreatingSupplier: boolean;
  isReorderingSuppliers: boolean;
  deletingSupplierId: number | null;
  canMoveSelectedSupplierUp: boolean;
  canMoveSelectedSupplierDown: boolean;
  isMediumScreen: boolean;
  onSelectSupplier: (supplierId: number) => void;
  onChangeNewSupplierName: (value: string) => void;
  onCreateSupplier: () => void;
  onMoveSupplier: (direction: -1 | 1) => void;
  onDeleteSupplier: (supplier: SupplierItem) => void;
};

export function SupplierListCard({
  text,
  suppliers,
  selectedSupplierId,
  selectedSupplier,
  supplierProductCountById,
  newSupplierName,
  isCreatingSupplier,
  isReorderingSuppliers,
  deletingSupplierId,
  canMoveSelectedSupplierUp,
  canMoveSelectedSupplierDown,
  isMediumScreen,
  onSelectSupplier,
  onChangeNewSupplierName,
  onCreateSupplier,
  onMoveSupplier,
  onDeleteSupplier,
}: SupplierListCardProps) {
  return (
    <View style={styles.surfaceCard}>
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>
            {text.supplierManagement.suppliersLabel}
          </Text>
          <Text style={styles.surfaceTitle}>
            {selectedSupplier?.name ?? text.supplierManagement.suppliersLabel}
          </Text>
          <Text style={styles.surfaceSubtitle}>
            {text.supplierManagement.supplierOrderHint}
          </Text>
        </View>
        <Text style={styles.surfacePill}>{suppliers.length}</Text>
      </View>

      <View
        style={[
          styles.inlineCreateRow,
          !isMediumScreen && styles.inlineCreateRowStack,
        ]}
      >
        <View style={styles.inlineInputWrap}>
          <Text style={styles.fieldLabel}>
            {text.supplierManagement.newSupplierLabel}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={text.supplierManagement.newSupplierPlaceholder}
            placeholderTextColor={COLORS.placeholder}
            value={newSupplierName}
            onChangeText={onChangeNewSupplierName}
          />
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            styles.inlineButton,
            isCreatingSupplier && styles.buttonDisabled,
          ]}
          disabled={isCreatingSupplier}
          onPress={onCreateSupplier}
        >
          <Text style={styles.primaryButtonText}>
            {isCreatingSupplier
              ? text.supplierManagement.creatingSupplier
              : text.supplierManagement.createSupplierButton}
          </Text>
        </Pressable>
      </View>

      <View style={styles.supplierCards}>
        {suppliers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.docEmpty}>
              {text.supplierManagement.loading}
            </Text>
          </View>
        ) : (
          suppliers.map((supplier, index) => {
            const isActive = selectedSupplierId === supplier.id;

            return (
              <Pressable
                key={supplier.id}
                style={[
                  styles.supplierCard,
                  isActive && styles.supplierCardActive,
                ]}
                onPress={() => onSelectSupplier(supplier.id)}
              >
                <View style={styles.supplierCardTitleRow}>
                  <Text
                    style={[
                      styles.supplierCardTitle,
                      isActive && styles.supplierCardTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {supplier.name}
                  </Text>
                  <Text
                    style={[
                      styles.supplierCardIndex,
                      isActive && styles.supplierCardIndexActive,
                    ]}
                  >
                    #{index + 1}
                  </Text>
                </View>

                <View style={styles.supplierCardMetaRow}>
                  <Text
                    style={[
                      styles.supplierCardMeta,
                      isActive && styles.supplierCardMetaActive,
                    ]}
                  >
                    {text.supplierManagement.productsLabel}
                  </Text>
                  <Text
                    style={[
                      styles.supplierCardCount,
                      isActive && styles.supplierCardCountActive,
                    ]}
                  >
                    {supplierProductCountById.get(supplier.id) ?? 0}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={styles.surfaceDivider} />

      <View
        style={[styles.actionRail, !isMediumScreen && styles.actionRailStack]}
      >
        <Pressable
          style={[
            styles.secondaryButton,
            styles.actionButtonFlex,
            (!canMoveSelectedSupplierUp || isReorderingSuppliers) &&
              styles.buttonDisabled,
          ]}
          disabled={!canMoveSelectedSupplierUp || isReorderingSuppliers}
          onPress={() => {
            void onMoveSupplier(-1);
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {text.supplierManagement.moveSupplierUpButton}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.secondaryButton,
            styles.actionButtonFlex,
            (!canMoveSelectedSupplierDown || isReorderingSuppliers) &&
              styles.buttonDisabled,
          ]}
          disabled={!canMoveSelectedSupplierDown || isReorderingSuppliers}
          onPress={() => {
            void onMoveSupplier(1);
          }}
        >
          <Text style={styles.secondaryButtonText}>
            {text.supplierManagement.moveSupplierDownButton}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.dangerButton,
            styles.actionButtonFlex,
            (!selectedSupplier ||
              deletingSupplierId !== null ||
              isReorderingSuppliers) &&
              styles.buttonDisabled,
          ]}
          disabled={
            !selectedSupplier ||
            deletingSupplierId !== null ||
            isReorderingSuppliers
          }
          onPress={() => {
            if (selectedSupplier) {
              void onDeleteSupplier(selectedSupplier);
            }
          }}
        >
          <Text style={styles.dangerButtonText}>
            {deletingSupplierId !== null
              ? text.supplierManagement.deletingSupplier
              : text.supplierManagement.deleteSupplierButton}
          </Text>
        </Pressable>
      </View>

      {isReorderingSuppliers ? (
        <Text style={styles.helperText}>
          {text.supplierManagement.reorderingSupplier}
        </Text>
      ) : null}
    </View>
  );
}

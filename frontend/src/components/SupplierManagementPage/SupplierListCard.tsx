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
  orderNoticeDraft: string;
  isOrderNoticeDirty: boolean;
  isCreatingSupplier: boolean;
  isReorderingSuppliers: boolean;
  isUpdatingSupplierOrderSettings: boolean;
  deletingSupplierId: number | null;
  canMoveSelectedSupplierUp: boolean;
  canMoveSelectedSupplierDown: boolean;
  isMediumScreen: boolean;
  onSelectSupplier: (supplierId: number) => void;
  onChangeNewSupplierName: (value: string) => void;
  onChangeOrderNoticeDraft: (value: string) => void;
  onCreateSupplier: () => void;
  onToggleSupplierOrderTemplate: (nextValue: boolean) => void;
  onSaveSupplierOrderNotice: () => void;
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
  orderNoticeDraft,
  isOrderNoticeDirty,
  isCreatingSupplier,
  isReorderingSuppliers,
  isUpdatingSupplierOrderSettings,
  deletingSupplierId,
  canMoveSelectedSupplierUp,
  canMoveSelectedSupplierDown,
  isMediumScreen,
  onSelectSupplier,
  onChangeNewSupplierName,
  onChangeOrderNoticeDraft,
  onCreateSupplier,
  onToggleSupplierOrderTemplate,
  onSaveSupplierOrderNotice,
  onMoveSupplier,
  onDeleteSupplier,
}: SupplierListCardProps) {
  const orderTemplateEnabled =
    selectedSupplier?.includeAllProductsInOrder ?? false;

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

      <View style={styles.settingBlock}>
        <View style={styles.settingHeader}>
          <View style={styles.settingHeaderCopy}>
            <Text style={styles.fieldLabel}>
              {text.supplierManagement.orderTemplateTitle}
            </Text>
            <Text style={styles.helperText}>
              {text.supplierManagement.orderTemplateHint}
            </Text>
          </View>
          {selectedSupplier ? (
            <Text style={styles.surfacePill}>
              {isUpdatingSupplierOrderSettings
                ? text.supplierManagement.savingSupplierOrderSettings
                : selectedSupplier.name}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.toggleCard,
            orderTemplateEnabled && styles.toggleCardActive,
            (!selectedSupplier || isUpdatingSupplierOrderSettings) &&
              styles.buttonDisabled,
          ]}
          disabled={!selectedSupplier || isUpdatingSupplierOrderSettings}
          onPress={() => {
            onToggleSupplierOrderTemplate(!orderTemplateEnabled);
          }}
          accessibilityRole="switch"
          accessibilityLabel={
            text.supplierManagement.includeAllProductsInOrderLabel
          }
          accessibilityState={{
            checked: orderTemplateEnabled,
            disabled: !selectedSupplier || isUpdatingSupplierOrderSettings,
          }}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>
              {text.supplierManagement.includeAllProductsInOrderLabel}
            </Text>
            <Text style={styles.toggleDescription}>
              {text.supplierManagement.includeAllProductsInOrderHint}
            </Text>
          </View>

          <View
            style={[
              styles.toggleTrack,
              orderTemplateEnabled && styles.toggleTrackActive,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                orderTemplateEnabled && styles.toggleThumbActive,
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.noticeEditor}>
          <View style={styles.noticeEditorHeader}>
            <View style={styles.settingHeaderCopy}>
              <Text style={styles.fieldLabel}>
                {text.supplierManagement.orderNoticeTitle}
              </Text>
              <Text style={styles.helperText}>
                {text.supplierManagement.orderNoticeHint}
              </Text>
            </View>
            <Text style={styles.noticeCounter}>
              {orderNoticeDraft.length}/500
            </Text>
          </View>

          <TextInput
            style={[styles.input, styles.noticeInput]}
            placeholder={text.supplierManagement.orderNoticePlaceholder}
            placeholderTextColor={COLORS.placeholder}
            value={orderNoticeDraft}
            onChangeText={onChangeOrderNoticeDraft}
            editable={
              Boolean(selectedSupplier) && !isUpdatingSupplierOrderSettings
            }
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <Pressable
            style={[
              styles.primaryButton,
              (!selectedSupplier ||
                !isOrderNoticeDirty ||
                isUpdatingSupplierOrderSettings) &&
                styles.buttonDisabled,
            ]}
            disabled={
              !selectedSupplier ||
              !isOrderNoticeDirty ||
              isUpdatingSupplierOrderSettings
            }
            onPress={onSaveSupplierOrderNotice}
          >
            <Text style={styles.primaryButtonText}>
              {isUpdatingSupplierOrderSettings
                ? text.supplierManagement.savingSupplierOrderSettings
                : text.supplierManagement.saveOrderNoticeButton}
            </Text>
          </Pressable>
        </View>
      </View>

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

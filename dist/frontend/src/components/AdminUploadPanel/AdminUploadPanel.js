"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadPanel = AdminUploadPanel;
const DocumentPicker = __importStar(require("expo-document-picker"));
const react_1 = require("react");
const react_native_1 = require("react-native");
const documentTaxonomy_1 = require("../../constants/documentTaxonomy");
const uploadsApi_1 = require("../../services/uploadsApi");
const ConfirmDialog_1 = require("../ConfirmDialog");
const AdminUploadPanel_styles_1 = require("./AdminUploadPanel.styles");
const PICKER_TYPES = [
    'image/*',
    'video/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];
function getScopeKey(module, section) {
    return `${module}:${section}`;
}
function AdminUploadPanel({ accessToken, text }) {
    const moduleOptions = (0, documentTaxonomy_1.getModuleOptions)(text);
    const sectionsByModule = (0, documentTaxonomy_1.getSectionsByModule)(text);
    const [selectedModule, setSelectedModule] = (0, react_1.useState)('TRAINING');
    const [selectedSection, setSelectedSection] = (0, react_1.useState)('RECIPE_TRAINING');
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastUpload, setLastUpload] = (0, react_1.useState)(null);
    const [libraryItems, setLibraryItems] = (0, react_1.useState)([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = (0, react_1.useState)(false);
    const [libraryError, setLibraryError] = (0, react_1.useState)(null);
    const [isDeletingId, setIsDeletingId] = (0, react_1.useState)(null);
    const [confirmDialogVisible, setConfirmDialogVisible] = (0, react_1.useState)(false);
    const [categoryInput, setCategoryInput] = (0, react_1.useState)('');
    const [selectedCustomCategory, setSelectedCustomCategory] = (0, react_1.useState)(null);
    const [customCategoriesByScope, setCustomCategoriesByScope] = (0, react_1.useState)({});
    const confirmDeleteResolverRef = (0, react_1.useRef)(null);
    const availableSections = sectionsByModule[selectedModule];
    const scopeKey = getScopeKey(selectedModule, selectedSection);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoadingLibrary(true);
        setLibraryError(null);
        void (0, uploadsApi_1.fetchLibraryFiles)(accessToken, {
            module: selectedModule,
            section: selectedSection,
            customCategory: selectedCustomCategory ?? undefined,
        })
            .then((items) => {
            if (isActive) {
                setLibraryItems(items);
                const categoriesFromServer = Array.from(new Set(items
                    .map((item) => item.customCategory?.trim() ?? '')
                    .filter((value) => value.length > 0))).sort((left, right) => left.localeCompare(right));
                setCustomCategoriesByScope((current) => {
                    const existing = current[scopeKey] ?? [];
                    return {
                        ...current,
                        [scopeKey]: Array.from(new Set([...existing, ...categoriesFromServer])).sort((left, right) => left.localeCompare(right)),
                    };
                });
            }
        })
            .catch(() => {
            if (isActive) {
                setLibraryItems([]);
                setLibraryError(text.upload.loadExistingError);
            }
        })
            .finally(() => {
            if (isActive) {
                setIsLoadingLibrary(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [
        accessToken,
        scopeKey,
        selectedCustomCategory,
        selectedModule,
        selectedSection,
        text.upload.loadExistingError,
    ]);
    const customCategoryOptions = (0, react_1.useMemo)(() => customCategoriesByScope[scopeKey] ?? [], [customCategoriesByScope, scopeKey]);
    (0, react_1.useEffect)(() => {
        if (selectedCustomCategory &&
            !customCategoryOptions.includes(selectedCustomCategory)) {
            setSelectedCustomCategory(null);
        }
    }, [customCategoryOptions, selectedCustomCategory]);
    function onSelectModule(nextModule) {
        setSelectedModule(nextModule);
        const firstSection = sectionsByModule[nextModule][0];
        if (firstSection) {
            setSelectedSection(firstSection.key);
        }
        setSelectedCustomCategory(null);
        setCategoryInput('');
    }
    function onSelectSection(nextSection) {
        setSelectedSection(nextSection);
        setSelectedCustomCategory(null);
        setCategoryInput('');
    }
    function addCustomCategory() {
        const normalized = categoryInput.trim();
        if (!normalized) {
            return;
        }
        if (normalized.length > 80) {
            setError(text.upload.categoryTooLong);
            return;
        }
        if (customCategoryOptions.includes(normalized)) {
            setError(text.upload.categoryExists);
            return;
        }
        setCustomCategoriesByScope((current) => {
            const existing = current[scopeKey] ?? [];
            return {
                ...current,
                [scopeKey]: [...existing, normalized].sort((left, right) => left.localeCompare(right)),
            };
        });
        setSelectedCustomCategory(normalized);
        setCategoryInput('');
        setError(null);
    }
    async function handlePickAndUpload() {
        setError(null);
        setLastUpload(null);
        const result = await DocumentPicker.getDocumentAsync({
            multiple: false,
            type: PICKER_TYPES,
            copyToCacheDirectory: true,
        });
        if (result.canceled) {
            return;
        }
        const asset = result.assets[0];
        if (!asset) {
            return;
        }
        setIsUploading(true);
        try {
            const uploadResponse = await (0, uploadsApi_1.uploadSingleFile)(accessToken, {
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType ?? undefined,
                file: asset.file,
            }, {
                module: selectedModule,
                section: selectedSection,
                customCategory: selectedCustomCategory,
            });
            setLastUpload(uploadResponse);
            setLibraryItems((current) => [
                {
                    ...uploadResponse,
                    uploadedAt: new Date().toISOString(),
                    uploadedByUserId: null,
                },
                ...current,
            ]);
            if (uploadResponse.customCategory) {
                setCustomCategoriesByScope((current) => {
                    const existing = current[scopeKey] ?? [];
                    if (existing.includes(uploadResponse.customCategory ?? '')) {
                        return current;
                    }
                    return {
                        ...current,
                        [scopeKey]: [...existing, uploadResponse.customCategory ?? ''].sort((left, right) => left.localeCompare(right)),
                    };
                });
            }
        }
        catch {
            setError(text.upload.error);
        }
        finally {
            setIsUploading(false);
        }
    }
    async function confirmDelete() {
        return new Promise((resolve) => {
            confirmDeleteResolverRef.current = resolve;
            setConfirmDialogVisible(true);
        });
    }
    function closeConfirmDelete(value) {
        if (confirmDeleteResolverRef.current) {
            confirmDeleteResolverRef.current(value);
            confirmDeleteResolverRef.current = null;
        }
        setConfirmDialogVisible(false);
    }
    async function handleDeleteLibraryItem(item) {
        const confirmed = await confirmDelete();
        if (!confirmed) {
            return;
        }
        setIsDeletingId(item.documentId);
        setLibraryError(null);
        try {
            await (0, uploadsApi_1.deleteLibraryFile)(accessToken, item.documentId);
            setLibraryItems((current) => current.filter((entry) => entry.documentId !== item.documentId));
        }
        catch {
            setLibraryError(text.upload.deleteError);
        }
        finally {
            setIsDeletingId(null);
        }
    }
    return (<react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadCard}>
      <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadTitle}>{text.upload.title}</react_native_1.Text>
      <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadSubtitle}>{text.upload.subtitle}</react_native_1.Text>

      <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadFieldTitle}>{text.upload.moduleLabel}</react_native_1.Text>
      <react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadChipWrap}>
        {moduleOptions.map((moduleOption) => (<react_native_1.Pressable key={moduleOption.key} style={[
                AdminUploadPanel_styles_1.styles.uploadChip,
                selectedModule === moduleOption.key && AdminUploadPanel_styles_1.styles.uploadChipActive,
            ]} onPress={() => onSelectModule(moduleOption.key)}>
            <react_native_1.Text style={[
                AdminUploadPanel_styles_1.styles.uploadChipText,
                selectedModule === moduleOption.key && AdminUploadPanel_styles_1.styles.uploadChipTextActive,
            ]}>
              {moduleOption.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadFieldTitle}>{text.upload.sectionLabel}</react_native_1.Text>
      <react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadChipWrap}>
        {availableSections.map((sectionOption) => (<react_native_1.Pressable key={sectionOption.key} style={[
                AdminUploadPanel_styles_1.styles.uploadChip,
                selectedSection === sectionOption.key && AdminUploadPanel_styles_1.styles.uploadChipActive,
            ]} onPress={() => onSelectSection(sectionOption.key)}>
            <react_native_1.Text style={[
                AdminUploadPanel_styles_1.styles.uploadChipText,
                selectedSection === sectionOption.key && AdminUploadPanel_styles_1.styles.uploadChipTextActive,
            ]}>
              {sectionOption.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadFieldTitle}>{text.upload.customCategoryLabel}</react_native_1.Text>
      <react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadChipWrap}>
        <react_native_1.Pressable style={[
            AdminUploadPanel_styles_1.styles.uploadChip,
            selectedCustomCategory === null && AdminUploadPanel_styles_1.styles.uploadChipActive,
        ]} onPress={() => setSelectedCustomCategory(null)}>
          <react_native_1.Text style={[
            AdminUploadPanel_styles_1.styles.uploadChipText,
            selectedCustomCategory === null && AdminUploadPanel_styles_1.styles.uploadChipTextActive,
        ]}>
            {text.upload.allCategories}
          </react_native_1.Text>
        </react_native_1.Pressable>

        {customCategoryOptions.map((categoryName) => (<react_native_1.Pressable key={`category-${scopeKey}-${categoryName}`} style={[
                AdminUploadPanel_styles_1.styles.uploadChip,
                selectedCustomCategory === categoryName && AdminUploadPanel_styles_1.styles.uploadChipActive,
            ]} onPress={() => setSelectedCustomCategory(categoryName)}>
            <react_native_1.Text style={[
                AdminUploadPanel_styles_1.styles.uploadChipText,
                selectedCustomCategory === categoryName && AdminUploadPanel_styles_1.styles.uploadChipTextActive,
            ]}>
              {categoryName}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      <react_native_1.View style={AdminUploadPanel_styles_1.styles.categoryInputRow}>
        <react_native_1.TextInput style={AdminUploadPanel_styles_1.styles.categoryInput} value={categoryInput} onChangeText={setCategoryInput} placeholder={text.upload.customCategoryPlaceholder} placeholderTextColor="#a98a8d" autoCorrect={false} autoCapitalize="none" maxLength={80}/>
        <react_native_1.Pressable style={AdminUploadPanel_styles_1.styles.categoryAddButton} onPress={addCustomCategory}>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.secondaryButtonText}>{text.upload.addCategoryButton}</react_native_1.Text>
        </react_native_1.Pressable>
      </react_native_1.View>

      <react_native_1.Pressable style={[AdminUploadPanel_styles_1.styles.primaryButton, isUploading && AdminUploadPanel_styles_1.styles.buttonDisabled]} disabled={isUploading} onPress={() => {
            void handlePickAndUpload();
        }}>
        <react_native_1.Text style={AdminUploadPanel_styles_1.styles.primaryButtonText}>
          {isUploading ? text.upload.uploading : text.upload.cta}
        </react_native_1.Text>
      </react_native_1.Pressable>

      {error ? <react_native_1.Text style={AdminUploadPanel_styles_1.styles.error}>{error}</react_native_1.Text> : null}

      {lastUpload ? (<react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadResultBox}>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultText}>
            {text.upload.success}: {lastUpload.originalName}
          </react_native_1.Text>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>
            {text.upload.resultModule}:{' '}
            {moduleOptions.find((option) => option.key === lastUpload.module)?.label ??
                lastUpload.module}
          </react_native_1.Text>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>
            {text.upload.resultSection}:{' '}
            {sectionsByModule[lastUpload.module].find((option) => option.key === lastUpload.section)?.label ?? lastUpload.section}
          </react_native_1.Text>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>
            {text.upload.customCategoryLabel}:{' '}
            {lastUpload.customCategory || text.upload.uncategorized}
          </react_native_1.Text>
          <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultLink}>{lastUpload.fileUrl}</react_native_1.Text>
        </react_native_1.View>) : null}

      <react_native_1.View style={AdminUploadPanel_styles_1.styles.uploadResultBox}>
        <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultText}>{text.upload.existingTitle}</react_native_1.Text>
        <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>{text.upload.existingSubtitle}</react_native_1.Text>

        {isLoadingLibrary ? (<react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>{text.upload.loadingExisting}</react_native_1.Text>) : null}
        {libraryError ? <react_native_1.Text style={AdminUploadPanel_styles_1.styles.error}>{libraryError}</react_native_1.Text> : null}

        {!isLoadingLibrary && !libraryError && libraryItems.length === 0 ? (<react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>{text.upload.emptyExisting}</react_native_1.Text>) : null}

        {libraryItems.slice(0, 15).map((item) => (<react_native_1.View key={`media-${item.documentId}`} style={AdminUploadPanel_styles_1.styles.mediaItemCard}>
            <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultText}>{item.originalName}</react_native_1.Text>
            <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>
              {new Date(item.uploadedAt).toLocaleString()}
            </react_native_1.Text>
            <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>{item.mediaType}</react_native_1.Text>
            <react_native_1.Text style={AdminUploadPanel_styles_1.styles.uploadResultMeta}>
              {text.upload.customCategoryLabel}:{' '}
              {item.customCategory || text.upload.uncategorized}
            </react_native_1.Text>

            <react_native_1.View style={AdminUploadPanel_styles_1.styles.mediaActionRow}>
              <react_native_1.Pressable style={AdminUploadPanel_styles_1.styles.secondaryButton} onPress={() => {
                void react_native_1.Linking.openURL(item.fileUrl);
            }}>
                <react_native_1.Text style={AdminUploadPanel_styles_1.styles.secondaryButtonText}>{text.upload.openMediaButton}</react_native_1.Text>
              </react_native_1.Pressable>

              <react_native_1.Pressable style={[
                AdminUploadPanel_styles_1.styles.deleteButton,
                isDeletingId === item.documentId && AdminUploadPanel_styles_1.styles.buttonDisabled,
            ]} disabled={isDeletingId === item.documentId} onPress={() => {
                void handleDeleteLibraryItem(item);
            }}>
                <react_native_1.Text style={AdminUploadPanel_styles_1.styles.deleteButtonText}>
                  {isDeletingId === item.documentId
                ? text.upload.deletingMedia
                : text.upload.deleteMediaButton}
                </react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>
          </react_native_1.View>))}
      </react_native_1.View>

      <ConfirmDialog_1.ConfirmDialog visible={confirmDialogVisible} title={text.upload.deleteConfirmTitle} message={text.upload.deleteConfirmMessage} cancelLabel={text.adminTraining.confirmProbationCancel} confirmLabel={text.upload.deleteConfirmAction} destructive onCancel={() => closeConfirmDelete(false)} onConfirm={() => closeConfirmDelete(true)}/>
    </react_native_1.View>);
}
//# sourceMappingURL=AdminUploadPanel.js.map
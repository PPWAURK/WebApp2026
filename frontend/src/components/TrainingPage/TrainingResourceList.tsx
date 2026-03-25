import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { TrainingCompletionMap } from '../../services/trainingProgressStorage';
import type { LibraryFileItem } from '../../services/uploadsApi';
import {
  formatDateLabel,
  formatFileSize,
  getTrainingItemIcon,
} from './trainingPage.shared';
import { styles } from './TrainingPage.styles';

type TrainingResourceListProps = {
  text: AppText;
  selectedSectionLabel: string;
  showSidePreview: boolean;
  sectionItems: LibraryFileItem[];
  searchKeyword: string;
  isLoadingLibrary: boolean;
  hasSearchResults: boolean;
  isWebPlatform: boolean;
  completionByFile: TrainingCompletionMap;
  openedDocumentFileName: string | null;
  webPreviewDocumentFileName: string | null;
  onChangeSearch: (value: string) => void;
  onOpenDocument: (item: LibraryFileItem) => void;
  onOpenVideo: (item: LibraryFileItem) => void;
  onToggleCompletion: (fileName: string) => void;
};

export function TrainingResourceList({
  text,
  selectedSectionLabel,
  showSidePreview,
  sectionItems,
  searchKeyword,
  isLoadingLibrary,
  hasSearchResults,
  isWebPlatform,
  completionByFile,
  openedDocumentFileName,
  webPreviewDocumentFileName,
  onChangeSearch,
  onOpenDocument,
  onOpenVideo,
  onToggleCompletion,
}: TrainingResourceListProps) {
  return (
    <View
      style={[styles.taskListWrap, showSidePreview && styles.taskListWrapWide]}
    >
      <View style={styles.surfaceHeader}>
        <View style={styles.surfaceHeaderCopy}>
          <Text style={styles.surfaceEyebrow}>{selectedSectionLabel}</Text>
          <Text style={styles.surfaceTitle}>{selectedSectionLabel}</Text>
          <Text style={styles.surfaceSubtitle}>
            {text.training.previewHint}
          </Text>
        </View>
        <View style={styles.surfaceCountPill}>
          <Text style={styles.surfaceCountText}>{sectionItems.length}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchShell}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchKeyword}
            onChangeText={onChangeSearch}
            placeholder={text.training.searchPlaceholder}
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <Text style={styles.taskListTitle}>{selectedSectionLabel}</Text>

      {!hasSearchResults ? (
        <View style={styles.emptyStateCardInner}>
          <Text style={styles.emptyText}>
            {isLoadingLibrary
              ? text.training.loadingLibrary
              : searchKeyword.trim().length > 0
                ? text.training.searchEmpty
                : text.training.noDocuments}
          </Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {sectionItems.map((item) => {
            const isDocument = item.mediaType === 'document';
            const isCompleted = Boolean(completionByFile[item.fileName]);
            const isActiveTask =
              openedDocumentFileName === item.fileName ||
              webPreviewDocumentFileName === item.fileName;

            return (
              <View
                key={item.fileName}
                style={[styles.taskCard, isActiveTask && styles.taskCardActive]}
              >
                <View style={styles.taskCardHeader}>
                  <View style={styles.taskCardIconWrap}>
                    <Ionicons
                      name={getTrainingItemIcon(item)}
                      size={18}
                      color={COLORS.brandPrimary}
                    />
                  </View>

                  <View style={styles.taskCardCopy}>
                    <Text style={styles.taskCardTitle}>
                      {item.originalName}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {`${formatDateLabel(item.uploadedAt)} · ${formatFileSize(
                        item.size,
                      )}`}
                    </Text>
                  </View>

                  <View style={styles.taskBadgeColumn}>
                    <View style={styles.taskTypeBadge}>
                      <Text style={styles.taskTypeBadgeText}>
                        {isDocument
                          ? text.training.taskTypeDocument
                          : text.training.taskTypeVideo}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.taskStatusBadge,
                        isCompleted && styles.taskStatusBadgeDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusText,
                          isCompleted && styles.taskStatusTextDone,
                        ]}
                      >
                        {isCompleted
                          ? text.training.completionDone
                          : text.training.completionTodo}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.taskActionsRow}>
                  {isDocument ? (
                    <Pressable
                      style={styles.taskActionButton}
                      onPress={() => onOpenDocument(item)}
                    >
                      <Text style={styles.taskActionButtonText}>
                        {isWebPlatform
                          ? text.training.previewButton
                          : text.training.openPdfButton}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.taskActionButton}
                      onPress={() => onOpenVideo(item)}
                    >
                      <Text style={styles.taskActionButtonText}>
                        {text.training.playVideoButton}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.taskActionButton,
                      styles.taskCompletionButton,
                      isCompleted && styles.taskCompletionButtonDone,
                    ]}
                    onPress={() => {
                      void onToggleCompletion(item.fileName);
                    }}
                  >
                    <Text
                      style={[
                        styles.taskActionButtonText,
                        isCompleted && styles.taskCompletionButtonTextDone,
                      ]}
                    >
                      {isCompleted
                        ? text.training.markUndone
                        : text.training.markDone}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

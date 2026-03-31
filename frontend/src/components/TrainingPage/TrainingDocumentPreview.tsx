import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { LibraryFileItem } from '../../services/uploadsApi';
import { TrainingPdfPageViewer } from './TrainingPdfPageViewer';
import { styles } from './TrainingPage.styles';

type TrainingDocumentPreviewProps = {
  text: AppText;
  webPreviewDocument: LibraryFileItem | null;
  webPreviewUrl: string | null;
  webPreviewLoading: boolean;
  showSidePreview: boolean;
  previewFrameHeight: number;
  showTabletPageControls?: boolean;
};

export function TrainingDocumentPreview({
  text,
  webPreviewDocument,
  webPreviewUrl,
  webPreviewLoading,
  showSidePreview,
  previewFrameHeight,
  showTabletPageControls = false,
}: TrainingDocumentPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    setPreviewPage(1);
    setPageCount(null);
  }, [webPreviewDocument?.fileName, webPreviewUrl]);

  useEffect(() => {
    if (!pageCount) {
      return;
    }

    setPreviewPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  function goToPreviousPage() {
    setPreviewPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPreviewPage((current) =>
      pageCount ? Math.min(current + 1, pageCount) : current + 1,
    );
  }

  function renderPageControls() {
    if (!showTabletPageControls || !webPreviewDocument || !webPreviewUrl) {
      return null;
    }

    return (
      <View style={styles.previewPageControlsRow}>
        <Pressable
          style={[
            styles.previewControlButton,
            previewPage === 1 && styles.previewPageControlButtonDisabled,
          ]}
          onPress={goToPreviousPage}
          disabled={previewPage === 1}
          accessibilityRole="button"
          accessibilityLabel={text.training.previewPreviousPage}
          accessibilityState={{ disabled: previewPage === 1 }}
        >
          <Text style={styles.previewControlButtonText}>
            {text.training.previewPreviousPage}
          </Text>
        </Pressable>
        <View style={styles.previewPageIndicator}>
          <Text style={styles.previewPageIndicatorText}>
            {text.training.previewPageLabel.replace('{page}', String(previewPage))}
          </Text>
        </View>
        <Pressable
          style={[
            styles.previewControlButton,
            pageCount !== null &&
              previewPage >= pageCount &&
              styles.previewPageControlButtonDisabled,
          ]}
          onPress={goToNextPage}
          disabled={pageCount !== null && previewPage >= pageCount}
          accessibilityRole="button"
          accessibilityLabel={text.training.previewNextPage}
          accessibilityState={{
            disabled: pageCount !== null && previewPage >= pageCount,
          }}
        >
          <Text style={styles.previewControlButtonText}>
            {text.training.previewNextPage}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View
        style={[
          styles.previewWrap,
          showSidePreview ? styles.previewWrapSide : styles.previewWrapBelow,
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={styles.previewHeaderCopy}>
            <Text style={styles.previewTitle}>
              {webPreviewDocument?.originalName ?? text.training.previewTitle}
            </Text>
            <Text style={styles.previewHint}>
              {text.training.webPreviewHint}
            </Text>
          </View>
          {webPreviewDocument ? (
            <View style={styles.previewControlsRow}>
              {renderPageControls()}
              <Pressable
                style={styles.previewControlButton}
                onPress={() => setIsFullscreen(true)}
                accessibilityRole="button"
                accessibilityLabel={text.training.previewFullscreen}
              >
                <Text style={styles.previewControlButtonText}>
                  {text.training.previewFullscreen}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View
          style={[styles.previewFrameShell, { height: previewFrameHeight }]}
        >
          {webPreviewDocument ? (
            webPreviewUrl ? (
              <TrainingPdfPageViewer
                src={webPreviewUrl}
                pageNumber={previewPage}
                title={webPreviewDocument.originalName}
                loadingLabel={text.training.loadingLibrary}
                errorLabel={text.training.loadError}
                onDocumentLoadSuccess={setPageCount}
              />
            ) : webPreviewLoading ? (
              <View style={styles.previewEmptyWrap}>
                <Text style={styles.previewEmptyText}>
                  {text.training.loadingLibrary}
                </Text>
              </View>
            ) : (
              <View style={styles.previewEmptyWrap}>
                <Text style={styles.previewEmptyText}>
                  {text.training.previewEmpty}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.previewEmptyWrap}>
              <Text style={styles.previewEmptyText}>
                {text.training.previewEmpty}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={isFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.previewFullscreenBackdrop}>
          <View
            style={styles.previewFullscreenCard}
            accessible
            accessibilityLabel={text.training.previewTitle}
          >
            <View style={styles.previewFullscreenHeader}>
              <Text style={styles.previewFullscreenTitle} numberOfLines={1}>
                {webPreviewDocument?.originalName ?? text.training.previewTitle}
              </Text>
              <View style={styles.previewControlsRow}>
                {renderPageControls()}
                <Pressable
                  style={styles.previewControlButton}
                  onPress={() => setIsFullscreen(false)}
                  accessibilityRole="button"
                  accessibilityLabel={text.dashboard.levelModalClose}
                >
                  <Text style={styles.previewControlButtonText}>X</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.previewFullscreenFrameShell}>
              {webPreviewDocument && webPreviewUrl ? (
                <TrainingPdfPageViewer
                  src={webPreviewUrl}
                  pageNumber={previewPage}
                  title={webPreviewDocument.originalName}
                  loadingLabel={text.training.loadingLibrary}
                  errorLabel={text.training.loadError}
                  onDocumentLoadSuccess={setPageCount}
                />
              ) : webPreviewLoading ? (
                <View style={styles.previewEmptyWrap}>
                  <Text style={styles.previewEmptyText}>
                    {text.training.loadingLibrary}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

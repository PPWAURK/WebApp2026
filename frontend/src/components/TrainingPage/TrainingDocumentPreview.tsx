import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import type { LibraryFileItem } from '../../services/uploadsApi';
import { buildWebPreviewUrl, WebPdfFrame } from './trainingPage.shared';
import { styles } from './TrainingPage.styles';

type TrainingDocumentPreviewProps = {
  text: AppText;
  webPreviewDocument: LibraryFileItem | null;
  webPreviewUrl: string | null;
  webPreviewLoading: boolean;
  showSidePreview: boolean;
  previewFrameHeight: number;
};

export function TrainingDocumentPreview({
  text,
  webPreviewDocument,
  webPreviewUrl,
  webPreviewLoading,
  showSidePreview,
  previewFrameHeight,
}: TrainingDocumentPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
              <Pressable
                style={styles.previewControlButton}
                onPress={() => setIsFullscreen(true)}
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
              <WebPdfFrame
                src={buildWebPreviewUrl(webPreviewUrl)}
                title={webPreviewDocument.originalName}
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
          <View style={styles.previewFullscreenCard}>
            <View style={styles.previewFullscreenHeader}>
              <Text style={styles.previewFullscreenTitle} numberOfLines={1}>
                {webPreviewDocument?.originalName ?? text.training.previewTitle}
              </Text>
              <Pressable
                style={styles.previewControlButton}
                onPress={() => setIsFullscreen(false)}
              >
                <Text style={styles.previewControlButtonText}>X</Text>
              </Pressable>
            </View>
            <View style={styles.previewFullscreenFrameShell}>
              {webPreviewDocument && webPreviewUrl ? (
                <WebPdfFrame
                  src={buildWebPreviewUrl(webPreviewUrl)}
                  title={webPreviewDocument.originalName}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { ResizeMode, Video, VideoFullscreenUpdate } from 'expo-av';
import {
  Modal,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { AppText } from '../../locales/translations';
import type { LibraryFileItem } from '../../services/uploadsApi';
import { styles } from './TrainingPage.styles';

type TrainingVideoModalProps = {
  text: AppText;
  selectedVideo: LibraryFileItem | null;
  shouldAutoFullscreen: boolean;
  onClose: () => void;
  onAutoFullscreenConsumed: () => void;
};

export function TrainingVideoModal({
  text,
  selectedVideo,
  shouldAutoFullscreen,
  onClose,
  onAutoFullscreenConsumed,
}: TrainingVideoModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const videoRef = useRef<Video | null>(null);

  useEffect(() => {
    setVideoAspectRatio(16 / 9);
  }, [selectedVideo?.fileUrl]);

  const videoFrameSize = useMemo(() => {
    const modalCardInnerMaxWidth = Math.min(windowWidth - 56, 736);
    const modalMaxHeight = Math.max(220, windowHeight - 140);
    const widthByHeightLimit = modalMaxHeight * videoAspectRatio;
    const frameWidth = Math.max(
      180,
      Math.min(modalCardInnerMaxWidth, widthByHeightLimit),
    );
    const frameHeight = frameWidth / videoAspectRatio;

    return {
      width: frameWidth,
      height: frameHeight,
    };
  }, [videoAspectRatio, windowHeight, windowWidth]);

  function updateVideoAspectRatioFromEvent(event: unknown) {
    const readyEvent = event as {
      naturalSize?: { width?: number; height?: number };
      nativeEvent?: {
        naturalSize?: { width?: number; height?: number };
        target?: { videoWidth?: number; videoHeight?: number };
      };
      target?: { videoWidth?: number; videoHeight?: number };
    };

    const naturalSize =
      readyEvent.naturalSize ?? readyEvent.nativeEvent?.naturalSize;
    const target = readyEvent.target ?? readyEvent.nativeEvent?.target;
    const width = naturalSize?.width ?? target?.videoWidth ?? 0;
    const height = naturalSize?.height ?? target?.videoHeight ?? 0;

    if (width > 0 && height > 0) {
      setVideoAspectRatio(width / height);
    }
  }

  async function openFullscreenFromPlayer() {
    if (!selectedVideo) {
      return;
    }

    onAutoFullscreenConsumed();

    try {
      await videoRef.current?.presentFullscreenPlayer();
    } catch {}
  }

  return (
    <Modal
      visible={Boolean(selectedVideo)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.videoModalBackdrop}>
        <View style={styles.videoModalCard}>
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitle} numberOfLines={2}>
              {selectedVideo?.originalName ?? text.training.videosTitle}
            </Text>
            <Pressable
              style={styles.videoModalCloseButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={text.dashboard.levelModalClose}
            >
              <Text style={styles.videoModalCloseText}>X</Text>
            </Pressable>
          </View>

          {selectedVideo ? (
            <View
              style={[
                styles.videoPlayerShell,
                {
                  width: videoFrameSize.width,
                  height: videoFrameSize.height,
                },
              ]}
            >
              <Video
                key={selectedVideo.fileUrl}
                ref={videoRef}
                style={styles.videoPlayer}
                source={{ uri: selectedVideo.fileUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                onLoad={(event) => {
                  updateVideoAspectRatioFromEvent(event);
                  if (shouldAutoFullscreen) {
                    void openFullscreenFromPlayer();
                  }
                }}
                onReadyForDisplay={(event) => {
                  updateVideoAspectRatioFromEvent(event);
                  if (shouldAutoFullscreen) {
                    void openFullscreenFromPlayer();
                  }
                }}
                onFullscreenUpdate={(event) => {
                  if (
                    event.fullscreenUpdate ===
                    VideoFullscreenUpdate.PLAYER_DID_DISMISS
                  ) {
                    onClose();
                  }
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

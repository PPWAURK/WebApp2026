"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingPageLegacy = TrainingPageLegacy;
const react_1 = require("react");
const expo_av_1 = require("expo-av");
const react_native_1 = require("react-native");
const config_1 = require("../../constants/config");
const documentTaxonomy_1 = require("../../constants/documentTaxonomy");
const usersApi_1 = require("../../services/usersApi");
const uploadsApi_1 = require("../../services/uploadsApi");
const TrainingPage_legacy_styles_1 = require("./TrainingPage.legacy.styles");
function appendQuizContextToUrl(baseUrl, context) {
    const params = new URLSearchParams({
        section: context.section,
        document: context.originalName,
    });
    const joinWith = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${joinWith}${params.toString()}`;
}
function getQuizLinkKey(section, language) {
    return `${section}:${language}`;
}
function TrainingPageLegacy({ text, accessToken, currentUser, language, }) {
    const [activeTab, setActiveTab] = (0, react_1.useState)('dishTraining');
    const [activeSection, setActiveSection] = (0, react_1.useState)('RECIPE');
    const [libraryItems, setLibraryItems] = (0, react_1.useState)([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = (0, react_1.useState)(false);
    const [libraryError, setLibraryError] = (0, react_1.useState)(null);
    const [selectedVideo, setSelectedVideo] = (0, react_1.useState)(null);
    const [openedDocument, setOpenedDocument] = (0, react_1.useState)(null);
    const [quizLinksByKey, setQuizLinksByKey] = (0, react_1.useState)({});
    const [quizLanguage, setQuizLanguage] = (0, react_1.useState)(language === 'fr' ? 'fr' : 'bn');
    const [shouldAutoFullscreen, setShouldAutoFullscreen] = (0, react_1.useState)(false);
    const [videoAspectRatio, setVideoAspectRatio] = (0, react_1.useState)(16 / 9);
    const { width: windowWidth, height: windowHeight } = (0, react_native_1.useWindowDimensions)();
    const videoRef = (0, react_1.useRef)(null);
    const tabs = [
        { key: 'dishTraining', label: text.training.tabs.dishTraining },
        { key: 'companyPolicy', label: text.training.tabs.companyPolicy },
        { key: 'managementTools', label: text.training.tabs.managementTools },
    ];
    const activeModule = activeTab === 'dishTraining'
        ? 'TRAINING'
        : activeTab === 'companyPolicy'
            ? 'POLICY'
            : 'MANAGEMENT';
    const userTrainingAccess = currentUser.trainingAccess ?? [];
    const sectionsByModule = (0, react_1.useMemo)(() => (0, documentTaxonomy_1.getSectionsByModule)(text), [text]);
    const sectionOptions = (0, react_1.useMemo)(() => sectionsByModule[activeModule], [activeModule, sectionsByModule]);
    const allowedTabs = (0, react_1.useMemo)(() => tabs.filter((tab) => {
        const module = tab.key === 'dishTraining'
            ? 'TRAINING'
            : tab.key === 'companyPolicy'
                ? 'POLICY'
                : 'MANAGEMENT';
        return sectionsByModule[module].some((section) => userTrainingAccess.includes(section.key));
    }), [sectionsByModule, tabs, userTrainingAccess]);
    (0, react_1.useEffect)(() => {
        if (!allowedTabs.some((tab) => tab.key === activeTab)) {
            const fallbackTab = allowedTabs[0];
            if (fallbackTab) {
                setActiveTab(fallbackTab.key);
            }
        }
    }, [activeTab, allowedTabs]);
    (0, react_1.useEffect)(() => {
        const firstSection = sectionOptions.find((sectionOption) => userTrainingAccess.includes(sectionOption.key));
        if (firstSection) {
            setActiveSection(firstSection.key);
        }
    }, [sectionOptions, userTrainingAccess]);
    (0, react_1.useEffect)(() => {
        setSelectedVideo(null);
        setOpenedDocument(null);
        setShouldAutoFullscreen(false);
    }, [activeModule, activeSection]);
    (0, react_1.useEffect)(() => {
        setVideoAspectRatio(16 / 9);
    }, [selectedVideo?.fileUrl]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoadingLibrary(true);
        setLibraryError(null);
        void (0, uploadsApi_1.fetchLibraryFiles)(accessToken, { module: activeModule })
            .then((items) => {
            if (isActive) {
                setLibraryItems(items);
            }
        })
            .catch(() => {
            if (isActive) {
                setLibraryItems([]);
                setLibraryError(text.training.loadError);
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
    }, [accessToken, activeModule, text.training.loadError]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        void (0, usersApi_1.fetchTrainingQuizLinks)(accessToken)
            .then((links) => {
            if (!isActive) {
                return;
            }
            const nextQuizLinksByKey = links.reduce((accumulator, item) => {
                if (item.quizUrl) {
                    accumulator[getQuizLinkKey(item.section, item.language)] =
                        item.quizUrl;
                }
                return accumulator;
            }, {});
            setQuizLinksByKey(nextQuizLinksByKey);
        })
            .catch(() => {
            if (isActive) {
                setQuizLinksByKey({});
            }
        });
        return () => {
            isActive = false;
        };
    }, [accessToken]);
    const visibleSectionOptions = sectionOptions.filter((sectionOption) => userTrainingAccess.includes(sectionOption.key));
    const selectedSection = visibleSectionOptions.find((sectionOption) => sectionOption.key === activeSection) ?? visibleSectionOptions[0];
    const selectedSectionKey = selectedSection?.key;
    const dbQuizBaseUrl = selectedSectionKey
        ? quizLinksByKey[getQuizLinkKey(selectedSectionKey, quizLanguage)] ?? ''
        : '';
    const fallbackQuizBaseUrl = selectedSectionKey
        ? (0, config_1.getTrainingQuizUrlForSectionLanguage)(selectedSectionKey, quizLanguage)
        : '';
    const quizBaseUrl = dbQuizBaseUrl || fallbackQuizBaseUrl;
    const sectionKeyForItems = selectedSection?.key ?? activeSection;
    const docs = libraryItems.filter((item) => item.section === sectionKeyForItems && item.mediaType === 'document');
    const videos = libraryItems.filter((item) => item.section === sectionKeyForItems && item.mediaType === 'video');
    (0, react_1.useEffect)(() => {
        if (!openedDocument) {
            return;
        }
        const isDocumentStillVisible = docs.some((item) => item.fileName === openedDocument.fileName);
        if (!isDocumentStillVisible) {
            setOpenedDocument(null);
        }
    }, [docs, openedDocument]);
    const quizUrl = (0, react_1.useMemo)(() => {
        if (!quizBaseUrl || !openedDocument) {
            return null;
        }
        return appendQuizContextToUrl(quizBaseUrl, openedDocument);
    }, [openedDocument, quizBaseUrl]);
    function updateVideoAspectRatioFromEvent(event) {
        const readyEvent = event;
        const naturalSize = readyEvent.naturalSize ?? readyEvent.nativeEvent?.naturalSize;
        const target = readyEvent.target ?? readyEvent.nativeEvent?.target;
        const width = naturalSize?.width ?? target?.videoWidth ?? 0;
        const height = naturalSize?.height ?? target?.videoHeight ?? 0;
        if (width > 0 && height > 0) {
            setVideoAspectRatio(width / height);
        }
    }
    const videoFrameSize = (0, react_1.useMemo)(() => {
        const modalCardInnerMaxWidth = Math.min(windowWidth - 56, 736);
        const modalMaxHeight = Math.max(220, windowHeight - 140);
        const widthByHeightLimit = modalMaxHeight * videoAspectRatio;
        const frameWidth = Math.max(180, Math.min(modalCardInnerMaxWidth, widthByHeightLimit));
        const frameHeight = frameWidth / videoAspectRatio;
        return {
            width: frameWidth,
            height: frameHeight,
        };
    }, [videoAspectRatio, windowHeight, windowWidth]);
    async function openFullscreenFromPlayer() {
        if (!selectedVideo) {
            return;
        }
        setShouldAutoFullscreen(false);
        try {
            await videoRef.current?.presentFullscreenPlayer();
        }
        catch {
        }
    }
    function openDocumentFile(item) {
        setOpenedDocument({
            fileName: item.fileName,
            originalName: item.originalName,
            section: item.section,
        });
        void react_native_1.Linking.openURL(item.fileUrl);
    }
    function openQuiz() {
        if (!quizUrl) {
            return;
        }
        void react_native_1.Linking.openURL(quizUrl);
    }
    const quizStatusText = !quizBaseUrl
        ? text.training.quizLinkMissing
        : openedDocument
            ? text.training.quizReady
            : text.training.quizLocked;
    return (<react_native_1.View style={TrainingPage_legacy_styles_1.styles.card}>
      <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.title}>{text.training.title}</react_native_1.Text>
      <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.subtitle}>{text.training.intro}</react_native_1.Text>

      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={TrainingPage_legacy_styles_1.styles.trainingTabRow}>
        {allowedTabs.map((tab) => (<react_native_1.Pressable key={tab.key} style={[
                TrainingPage_legacy_styles_1.styles.trainingTab,
                activeTab === tab.key && TrainingPage_legacy_styles_1.styles.trainingTabActive,
            ]} onPress={() => setActiveTab(tab.key)}>
            <react_native_1.Text style={[
                TrainingPage_legacy_styles_1.styles.trainingTabText,
                activeTab === tab.key && TrainingPage_legacy_styles_1.styles.trainingTabTextActive,
            ]}>
              {tab.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.ScrollView>

      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={TrainingPage_legacy_styles_1.styles.trainingTabRow}>
        {visibleSectionOptions.map((sectionOption) => (<react_native_1.Pressable key={sectionOption.key} style={[
                TrainingPage_legacy_styles_1.styles.trainingTab,
                activeSection === sectionOption.key && TrainingPage_legacy_styles_1.styles.trainingTabActive,
            ]} onPress={() => setActiveSection(sectionOption.key)}>
            <react_native_1.Text style={[
                TrainingPage_legacy_styles_1.styles.trainingTabText,
                activeSection === sectionOption.key &&
                    TrainingPage_legacy_styles_1.styles.trainingTabTextActive,
            ]}>
              {sectionOption.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.ScrollView>

      {libraryError ? <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.error}>{libraryError}</react_native_1.Text> : null}

      {allowedTabs.length === 0 ? (<react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docEmpty}>{text.training.noAccessConfigured}</react_native_1.Text>) : null}

      {selectedSection ? (<react_native_1.View style={TrainingPage_legacy_styles_1.styles.docBlock}>
          <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docBlockTitle}>{selectedSection.label}</react_native_1.Text>

          <react_native_1.View style={TrainingPage_legacy_styles_1.styles.workflowCard}>
            <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.workflowTitle}>{text.training.workflowTitle}</react_native_1.Text>
            <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.workflowHint}>{text.training.workflowHint}</react_native_1.Text>

            <react_native_1.View style={TrainingPage_legacy_styles_1.styles.quizLanguageRow}>
              <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.quizLanguageLabel}>
                {text.training.quizLanguageLabel}
              </react_native_1.Text>
              <react_native_1.View style={TrainingPage_legacy_styles_1.styles.quizLanguageChipRow}>
                {['fr', 'bn'].map((languageValue) => (<react_native_1.Pressable key={`quiz-language-${languageValue}`} style={[
                    TrainingPage_legacy_styles_1.styles.quizLanguageChip,
                    quizLanguage === languageValue &&
                        TrainingPage_legacy_styles_1.styles.quizLanguageChipActive,
                ]} onPress={() => setQuizLanguage(languageValue)}>
                      <react_native_1.Text style={[
                    TrainingPage_legacy_styles_1.styles.quizLanguageChipText,
                    quizLanguage === languageValue &&
                        TrainingPage_legacy_styles_1.styles.quizLanguageChipTextActive,
                ]}>
                        {languageValue === 'fr'
                    ? text.training.quizLanguageFr
                    : text.training.quizLanguageBn}
                      </react_native_1.Text>
                    </react_native_1.Pressable>))}
              </react_native_1.View>
            </react_native_1.View>

            <react_native_1.View style={TrainingPage_legacy_styles_1.styles.workflowStepRow}>
              <react_native_1.View style={[
                TrainingPage_legacy_styles_1.styles.workflowStepBadge,
                openedDocument && TrainingPage_legacy_styles_1.styles.workflowStepBadgeDone,
            ]}>
                <react_native_1.Text style={[
                TrainingPage_legacy_styles_1.styles.workflowStepBadgeText,
                openedDocument && TrainingPage_legacy_styles_1.styles.workflowStepBadgeTextDone,
            ]}>
                  1
                </react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.workflowStepText}>{text.training.workflowStepRead}</react_native_1.Text>
            </react_native_1.View>

            <react_native_1.View style={TrainingPage_legacy_styles_1.styles.workflowStepRow}>
              <react_native_1.View style={[
                TrainingPage_legacy_styles_1.styles.workflowStepBadge,
                quizUrl && TrainingPage_legacy_styles_1.styles.workflowStepBadgeDone,
            ]}>
                <react_native_1.Text style={[
                TrainingPage_legacy_styles_1.styles.workflowStepBadgeText,
                quizUrl && TrainingPage_legacy_styles_1.styles.workflowStepBadgeTextDone,
            ]}>
                  2
                </react_native_1.Text>
              </react_native_1.View>
              <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.workflowStepText}>{text.training.workflowStepQuiz}</react_native_1.Text>
            </react_native_1.View>

            <react_native_1.Pressable style={[
                TrainingPage_legacy_styles_1.styles.quizActionButton,
                !quizUrl && TrainingPage_legacy_styles_1.styles.quizActionButtonDisabled,
            ]} onPress={openQuiz} disabled={!quizUrl}>
              <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.quizActionButtonText}>{text.training.quizButton}</react_native_1.Text>
            </react_native_1.Pressable>

            <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.workflowStatusText}>{quizStatusText}</react_native_1.Text>
          </react_native_1.View>

          <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docItemMeta}>{text.training.documentsTitle}</react_native_1.Text>
          {docs.length === 0 ? (<react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docEmpty}>
              {isLoadingLibrary
                    ? text.training.loadingLibrary
                    : text.training.noDocuments}
            </react_native_1.Text>) : (docs.map((item) => {
                const isOpened = openedDocument?.fileName === item.fileName &&
                    openedDocument.section === item.section;
                return (<react_native_1.View key={`${item.fileName}-doc`} style={[TrainingPage_legacy_styles_1.styles.docItem, isOpened && TrainingPage_legacy_styles_1.styles.docItemActive]}>
                  <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docItemTitle}>{item.originalName}</react_native_1.Text>
                  <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docItemMeta}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </react_native_1.Text>
                  <react_native_1.Pressable style={TrainingPage_legacy_styles_1.styles.docActionButton} onPress={() => openDocumentFile(item)}>
                    <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docActionButtonText}>
                      {text.training.openPdfButton}
                    </react_native_1.Text>
                  </react_native_1.Pressable>
                </react_native_1.View>);
            }))}

          <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docItemMeta}>{text.training.videosTitle}</react_native_1.Text>
          {videos.length === 0 ? (<react_native_1.Text style={TrainingPage_legacy_styles_1.styles.docEmpty}>
              {isLoadingLibrary
                    ? text.training.loadingLibrary
                    : text.training.noVideos}
            </react_native_1.Text>) : (<react_native_1.View style={TrainingPage_legacy_styles_1.styles.videoSelectorGrid}>
              {videos.map((item) => (<react_native_1.Pressable key={`${item.fileName}-video`} style={TrainingPage_legacy_styles_1.styles.videoSelectorCard} onPress={() => {
                        setSelectedVideo(item);
                        setShouldAutoFullscreen(true);
                    }}>
                  <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.videoSelectorCardTitle} numberOfLines={2}>
                    {item.originalName}
                  </react_native_1.Text>
                  <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.videoSelectorCardMeta}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </react_native_1.Text>
                </react_native_1.Pressable>))}
            </react_native_1.View>)}
        </react_native_1.View>) : null}

      <react_native_1.Modal visible={Boolean(selectedVideo)} transparent animationType="fade" onRequestClose={() => setSelectedVideo(null)}>
        <react_native_1.View style={TrainingPage_legacy_styles_1.styles.videoModalBackdrop}>
          <react_native_1.View style={TrainingPage_legacy_styles_1.styles.videoModalCard}>
            <react_native_1.View style={TrainingPage_legacy_styles_1.styles.videoModalHeader}>
              <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.videoModalTitle} numberOfLines={2}>
                {selectedVideo?.originalName ?? text.training.videosTitle}
              </react_native_1.Text>
              <react_native_1.Pressable style={TrainingPage_legacy_styles_1.styles.videoModalCloseButton} onPress={() => setSelectedVideo(null)} accessibilityRole="button" accessibilityLabel={text.dashboard.levelModalClose}>
                <react_native_1.Text style={TrainingPage_legacy_styles_1.styles.videoModalCloseText}>X</react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>

            {selectedVideo ? (<react_native_1.View style={[
                TrainingPage_legacy_styles_1.styles.videoPlayerShell,
                { width: videoFrameSize.width, height: videoFrameSize.height },
            ]}>
                <expo_av_1.Video key={selectedVideo.fileUrl} ref={videoRef} style={TrainingPage_legacy_styles_1.styles.videoPlayer} source={{ uri: selectedVideo.fileUrl }} useNativeControls resizeMode={expo_av_1.ResizeMode.CONTAIN} shouldPlay onLoad={(event) => {
                updateVideoAspectRatioFromEvent(event);
                if (shouldAutoFullscreen) {
                    void openFullscreenFromPlayer();
                }
            }} onReadyForDisplay={(event) => {
                updateVideoAspectRatioFromEvent(event);
                if (shouldAutoFullscreen) {
                    void openFullscreenFromPlayer();
                }
            }} onFullscreenUpdate={(event) => {
                if (event.fullscreenUpdate ===
                    expo_av_1.VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
                    setSelectedVideo(null);
                }
            }}/>
              </react_native_1.View>) : null}
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.View>);
}
//# sourceMappingURL=TrainingPage.legacy.js.map
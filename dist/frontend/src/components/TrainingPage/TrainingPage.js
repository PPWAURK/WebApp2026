"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingPage = TrainingPage;
const react_1 = require("react");
const expo_av_1 = require("expo-av");
const react_native_1 = require("react-native");
const config_1 = require("../../constants/config");
const documentTaxonomy_1 = require("../../constants/documentTaxonomy");
const trainingScenario_1 = require("../../constants/trainingScenario");
const trainingProgressStorage_1 = require("../../services/trainingProgressStorage");
const usersApi_1 = require("../../services/usersApi");
const uploadsApi_1 = require("../../services/uploadsApi");
const TrainingPage_styles_1 = require("./TrainingPage.styles");
function getQuizLinkKey(section, language) {
    return `${section}:${language}`;
}
function buildQuizUrl(baseUrl, section, context) {
    const params = new URLSearchParams({
        section,
    });
    if (context && context.section === section) {
        params.set('document', context.originalName);
    }
    const joinWith = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${joinWith}${params.toString()}`;
}
function WebPdfFrame({ src, title }) {
    if (react_native_1.Platform.OS !== 'web') {
        return null;
    }
    return (0, react_1.createElement)('iframe', {
        src,
        title,
        style: {
            border: '0',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
        },
    });
}
function buildWebPreviewUrl(src) {
    if (src.includes('#')) {
        return src;
    }
    return `${src}#page=1&zoom=page-height&toolbar=1&navpanes=0&scrollbar=1`;
}
function formatDateLabel(value) {
    return new Date(value).toLocaleDateString();
}
function TrainingPage({ text, accessToken, currentUser, language, }) {
    const [activeScenarioKey, setActiveScenarioKey] = (0, react_1.useState)(null);
    const [activeSection, setActiveSection] = (0, react_1.useState)(null);
    const [libraryItems, setLibraryItems] = (0, react_1.useState)([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = (0, react_1.useState)(false);
    const [libraryError, setLibraryError] = (0, react_1.useState)(null);
    const [searchKeyword, setSearchKeyword] = (0, react_1.useState)('');
    const [selectedVideo, setSelectedVideo] = (0, react_1.useState)(null);
    const [openedDocument, setOpenedDocument] = (0, react_1.useState)(null);
    const [webPreviewDocument, setWebPreviewDocument] = (0, react_1.useState)(null);
    const [isWebPreviewFullscreen, setIsWebPreviewFullscreen] = (0, react_1.useState)(false);
    const [quizLinksByKey, setQuizLinksByKey] = (0, react_1.useState)({});
    const [quizLanguage, setQuizLanguage] = (0, react_1.useState)(language === 'fr' ? 'fr' : 'bn');
    const [completionByFile, setCompletionByFile] = (0, react_1.useState)({});
    const [shouldAutoFullscreen, setShouldAutoFullscreen] = (0, react_1.useState)(false);
    const [videoAspectRatio, setVideoAspectRatio] = (0, react_1.useState)(16 / 9);
    const { width: windowWidth, height: windowHeight } = (0, react_native_1.useWindowDimensions)();
    const videoRef = (0, react_1.useRef)(null);
    const scenarios = (0, react_1.useMemo)(() => (0, trainingScenario_1.getTrainingScenarios)(text), [text]);
    const userTrainingAccess = currentUser.trainingAccess ?? [];
    const sectionLabelByKey = (0, react_1.useMemo)(() => {
        const map = new Map();
        const grouped = (0, documentTaxonomy_1.getSectionsByModule)(text);
        for (const sectionList of Object.values(grouped)) {
            for (const sectionEntry of sectionList) {
                map.set(sectionEntry.key, sectionEntry.label);
            }
        }
        return map;
    }, [text]);
    const availableScenarios = (0, react_1.useMemo)(() => scenarios
        .map((scenario) => ({
        ...scenario,
        sections: scenario.sections.filter((section) => userTrainingAccess.includes(section)),
    }))
        .filter((scenario) => scenario.sections.length > 0), [scenarios, userTrainingAccess]);
    (0, react_1.useEffect)(() => {
        if (!availableScenarios.length) {
            setActiveScenarioKey(null);
            setActiveSection(null);
            return;
        }
        setActiveScenarioKey((current) => {
            if (current && availableScenarios.some((scenario) => scenario.key === current)) {
                return current;
            }
            return availableScenarios[0].key;
        });
    }, [availableScenarios]);
    const activeScenario = (0, react_1.useMemo)(() => availableScenarios.find((scenario) => scenario.key === activeScenarioKey) ??
        availableScenarios[0] ??
        null, [activeScenarioKey, availableScenarios]);
    (0, react_1.useEffect)(() => {
        if (!activeScenario) {
            setActiveSection(null);
            return;
        }
        setActiveSection((current) => {
            if (current && activeScenario.sections.includes(current)) {
                return current;
            }
            return activeScenario.sections[0] ?? null;
        });
    }, [activeScenario]);
    (0, react_1.useEffect)(() => {
        setSearchKeyword('');
        setSelectedVideo(null);
        setShouldAutoFullscreen(false);
    }, [activeScenarioKey, activeSection]);
    (0, react_1.useEffect)(() => {
        setVideoAspectRatio(16 / 9);
    }, [selectedVideo?.fileUrl]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        void (0, trainingProgressStorage_1.loadTrainingCompletionMap)(currentUser.id)
            .then((data) => {
            if (isActive) {
                setCompletionByFile(data);
            }
        })
            .catch(() => {
            if (isActive) {
                setCompletionByFile({});
            }
        });
        return () => {
            isActive = false;
        };
    }, [currentUser.id]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoadingLibrary(true);
        setLibraryError(null);
        void (0, uploadsApi_1.fetchLibraryFiles)(accessToken, {})
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
    }, [accessToken, text.training.loadError]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        void (0, usersApi_1.fetchTrainingQuizLinks)(accessToken)
            .then((links) => {
            if (!isActive) {
                return;
            }
            const nextQuizLinksByKey = links.reduce((accumulator, item) => {
                if (item.quizUrl) {
                    accumulator[getQuizLinkKey(item.section, item.language)] = item.quizUrl;
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
    const selectedSectionLabel = (activeSection ? sectionLabelByKey.get(activeSection) : null) ?? '';
    const sectionItems = (0, react_1.useMemo)(() => {
        if (!activeSection) {
            return [];
        }
        const normalizedSearch = searchKeyword.trim().toLowerCase();
        return libraryItems
            .filter((item) => item.section === activeSection &&
            (item.mediaType === 'document' || item.mediaType === 'video'))
            .filter((item) => {
            if (!normalizedSearch) {
                return true;
            }
            return item.originalName.toLowerCase().includes(normalizedSearch);
        })
            .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime());
    }, [activeSection, libraryItems, searchKeyword]);
    const selectedSectionKey = activeSection;
    const dbQuizBaseUrl = selectedSectionKey
        ? quizLinksByKey[getQuizLinkKey(selectedSectionKey, quizLanguage)] ?? ''
        : '';
    const fallbackQuizBaseUrl = selectedSectionKey
        ? (0, config_1.getTrainingQuizUrlForSectionLanguage)(selectedSectionKey, quizLanguage)
        : '';
    const quizBaseUrl = dbQuizBaseUrl || fallbackQuizBaseUrl;
    const quizUrl = (0, react_1.useMemo)(() => {
        if (!quizBaseUrl || !selectedSectionKey) {
            return null;
        }
        return buildQuizUrl(quizBaseUrl, selectedSectionKey, openedDocument);
    }, [openedDocument, quizBaseUrl, selectedSectionKey]);
    (0, react_1.useEffect)(() => {
        if (!webPreviewDocument) {
            return;
        }
        const stillExists = sectionItems.some((item) => item.fileName === webPreviewDocument.fileName);
        if (!stillExists) {
            setWebPreviewDocument(null);
        }
    }, [sectionItems, webPreviewDocument]);
    const quizStatusText = !quizBaseUrl
        ? text.training.quizLinkMissing
        : openedDocument && openedDocument.section === selectedSectionKey
            ? text.training.quizReady
            : text.training.quizDirectAvailable;
    const hasSearchResults = sectionItems.length > 0;
    const isWebPlatform = react_native_1.Platform.OS === 'web';
    const showSidePreview = isWebPlatform && windowWidth >= 1180;
    const previewFrameHeight = showSidePreview
        ? Math.max(360, Math.min(windowHeight - 320, 560))
        : Math.max(300, Math.min(windowHeight * 0.45, 460));
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
    function openDocument(item) {
        setOpenedDocument({
            fileName: item.fileName,
            originalName: item.originalName,
            section: item.section,
        });
        if (isWebPlatform) {
            setWebPreviewDocument(item);
            return;
        }
        void react_native_1.Linking.openURL(item.fileUrl);
    }
    function openDocumentExternally(item) {
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
    async function toggleCompletion(fileName) {
        const currentlyCompleted = Boolean(completionByFile[fileName]);
        setCompletionByFile((current) => {
            const next = { ...current };
            if (currentlyCompleted) {
                delete next[fileName];
            }
            else {
                next[fileName] = { completedAt: new Date().toISOString() };
            }
            return next;
        });
        try {
            const saved = await (0, trainingProgressStorage_1.setTrainingItemCompletion)(currentUser.id, fileName, !currentlyCompleted);
            setCompletionByFile(saved);
        }
        catch {
            setCompletionByFile((current) => {
                const next = { ...current };
                if (!currentlyCompleted) {
                    delete next[fileName];
                }
                else {
                    next[fileName] = { completedAt: new Date().toISOString() };
                }
                return next;
            });
        }
    }
    return (<react_native_1.View style={TrainingPage_styles_1.styles.card}>
      <react_native_1.Text style={TrainingPage_styles_1.styles.title}>{text.training.title}</react_native_1.Text>
      <react_native_1.Text style={TrainingPage_styles_1.styles.subtitle}>{text.training.intro}</react_native_1.Text>

      <react_native_1.Text style={TrainingPage_styles_1.styles.blockLabel}>{text.training.scenarioLabel}</react_native_1.Text>
      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={TrainingPage_styles_1.styles.pillRow}>
        {availableScenarios.map((scenario) => (<react_native_1.Pressable key={scenario.key} style={[
                TrainingPage_styles_1.styles.pill,
                activeScenario?.key === scenario.key && TrainingPage_styles_1.styles.pillActive,
            ]} onPress={() => setActiveScenarioKey(scenario.key)}>
            <react_native_1.Text style={[
                TrainingPage_styles_1.styles.pillText,
                activeScenario?.key === scenario.key && TrainingPage_styles_1.styles.pillTextActive,
            ]}>
              {scenario.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.ScrollView>

      <react_native_1.Text style={TrainingPage_styles_1.styles.blockLabel}>{text.training.sectionLabel}</react_native_1.Text>
      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={TrainingPage_styles_1.styles.pillRow}>
        {(activeScenario?.sections ?? []).map((section) => (<react_native_1.Pressable key={section} style={[TrainingPage_styles_1.styles.pill, activeSection === section && TrainingPage_styles_1.styles.pillActive]} onPress={() => setActiveSection(section)}>
            <react_native_1.Text style={[
                TrainingPage_styles_1.styles.pillText,
                activeSection === section && TrainingPage_styles_1.styles.pillTextActive,
            ]}>
              {sectionLabelByKey.get(section)}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.ScrollView>

      <react_native_1.View style={TrainingPage_styles_1.styles.quizCard}>
        <react_native_1.View style={TrainingPage_styles_1.styles.quizHeaderRow}>
          <react_native_1.View style={TrainingPage_styles_1.styles.quizHeaderCopy}>
            <react_native_1.Text style={TrainingPage_styles_1.styles.quizTitle}>{text.training.workflowTitle}</react_native_1.Text>
            <react_native_1.Text style={TrainingPage_styles_1.styles.quizHint}>{text.training.workflowHint}</react_native_1.Text>
          </react_native_1.View>

          <react_native_1.Pressable style={[TrainingPage_styles_1.styles.quizActionButton, !quizUrl && TrainingPage_styles_1.styles.quizActionButtonDisabled]} onPress={openQuiz} disabled={!quizUrl}>
            <react_native_1.Text style={TrainingPage_styles_1.styles.quizActionButtonText}>{text.training.quizButton}</react_native_1.Text>
          </react_native_1.Pressable>
        </react_native_1.View>

        <react_native_1.View style={TrainingPage_styles_1.styles.quizLanguageRow}>
          <react_native_1.Text style={TrainingPage_styles_1.styles.quizLanguageLabel}>{text.training.quizLanguageLabel}</react_native_1.Text>
          <react_native_1.View style={TrainingPage_styles_1.styles.quizLanguageChipRow}>
            {['fr', 'bn'].map((languageValue) => (<react_native_1.Pressable key={`quiz-language-${languageValue}`} style={[
                TrainingPage_styles_1.styles.quizLanguageChip,
                quizLanguage === languageValue && TrainingPage_styles_1.styles.quizLanguageChipActive,
            ]} onPress={() => setQuizLanguage(languageValue)}>
                <react_native_1.Text style={[
                TrainingPage_styles_1.styles.quizLanguageChipText,
                quizLanguage === languageValue && TrainingPage_styles_1.styles.quizLanguageChipTextActive,
            ]}>
                  {languageValue === 'fr'
                ? text.training.quizLanguageFr
                : text.training.quizLanguageBn}
                </react_native_1.Text>
              </react_native_1.Pressable>))}
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.Text style={TrainingPage_styles_1.styles.quizStatusText}>{quizStatusText}</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.View style={TrainingPage_styles_1.styles.searchWrap}>
        <react_native_1.TextInput style={TrainingPage_styles_1.styles.searchInput} value={searchKeyword} onChangeText={setSearchKeyword} placeholder={text.training.searchPlaceholder} placeholderTextColor="#a98a8d" autoCapitalize="none" autoCorrect={false}/>
      </react_native_1.View>

      {libraryError ? <react_native_1.Text style={TrainingPage_styles_1.styles.error}>{libraryError}</react_native_1.Text> : null}

      {!availableScenarios.length ? (<react_native_1.Text style={TrainingPage_styles_1.styles.emptyText}>{text.training.noAccessConfigured}</react_native_1.Text>) : null}

      {availableScenarios.length > 0 ? (<react_native_1.View style={[
                TrainingPage_styles_1.styles.contentSplit,
                showSidePreview && TrainingPage_styles_1.styles.contentSplitWide,
            ]}>
          <react_native_1.View style={[TrainingPage_styles_1.styles.taskListWrap, showSidePreview && TrainingPage_styles_1.styles.taskListWrapWide]}>
            <react_native_1.Text style={TrainingPage_styles_1.styles.taskListTitle}>{selectedSectionLabel}</react_native_1.Text>

            {!hasSearchResults ? (<react_native_1.Text style={TrainingPage_styles_1.styles.emptyText}>
                {isLoadingLibrary
                    ? text.training.loadingLibrary
                    : searchKeyword.trim().length > 0
                        ? text.training.searchEmpty
                        : text.training.noDocuments}
              </react_native_1.Text>) : (<react_native_1.View style={TrainingPage_styles_1.styles.taskList}>
                {sectionItems.map((item) => {
                    const isDocument = item.mediaType === 'document';
                    const isCompleted = Boolean(completionByFile[item.fileName]);
                    return (<react_native_1.View key={item.fileName} style={TrainingPage_styles_1.styles.taskCard}>
                      <react_native_1.View style={TrainingPage_styles_1.styles.taskCardHeader}>
                        <react_native_1.Text style={TrainingPage_styles_1.styles.taskCardTitle}>{item.originalName}</react_native_1.Text>
                        <react_native_1.Text style={TrainingPage_styles_1.styles.taskTypeBadge}>
                          {isDocument
                            ? text.training.taskTypeDocument
                            : text.training.taskTypeVideo}
                        </react_native_1.Text>
                      </react_native_1.View>

                      <react_native_1.Text style={TrainingPage_styles_1.styles.taskMeta}>
                        {formatDateLabel(item.uploadedAt)}
                      </react_native_1.Text>

                      <react_native_1.View style={TrainingPage_styles_1.styles.taskStatusRow}>
                        <react_native_1.Text style={TrainingPage_styles_1.styles.taskStatusText}>
                          {isCompleted
                            ? text.training.completionDone
                            : text.training.completionTodo}
                        </react_native_1.Text>
                      </react_native_1.View>

                      <react_native_1.View style={TrainingPage_styles_1.styles.taskActionsRow}>
                        {isDocument ? (<>
                            <react_native_1.Pressable style={TrainingPage_styles_1.styles.taskActionButton} onPress={() => openDocument(item)}>
                              <react_native_1.Text style={TrainingPage_styles_1.styles.taskActionButtonText}>
                                {isWebPlatform
                                ? text.training.previewButton
                                : text.training.openPdfButton}
                              </react_native_1.Text>
                            </react_native_1.Pressable>
                            <react_native_1.Pressable style={TrainingPage_styles_1.styles.taskActionButton} onPress={() => openDocumentExternally(item)}>
                              <react_native_1.Text style={TrainingPage_styles_1.styles.taskActionButtonText}>
                                {text.training.openExternalButton}
                              </react_native_1.Text>
                            </react_native_1.Pressable>
                          </>) : (<react_native_1.Pressable style={TrainingPage_styles_1.styles.taskActionButton} onPress={() => {
                                setSelectedVideo(item);
                                setShouldAutoFullscreen(true);
                            }}>
                            <react_native_1.Text style={TrainingPage_styles_1.styles.taskActionButtonText}>
                              {text.training.playVideoButton}
                            </react_native_1.Text>
                          </react_native_1.Pressable>)}

                        <react_native_1.Pressable style={[
                            TrainingPage_styles_1.styles.taskActionButton,
                            TrainingPage_styles_1.styles.taskCompletionButton,
                            isCompleted && TrainingPage_styles_1.styles.taskCompletionButtonDone,
                        ]} onPress={() => {
                            void toggleCompletion(item.fileName);
                        }}>
                          <react_native_1.Text style={[
                            TrainingPage_styles_1.styles.taskActionButtonText,
                            isCompleted && TrainingPage_styles_1.styles.taskCompletionButtonTextDone,
                        ]}>
                            {isCompleted
                            ? text.training.markUndone
                            : text.training.markDone}
                          </react_native_1.Text>
                        </react_native_1.Pressable>
                      </react_native_1.View>
                    </react_native_1.View>);
                })}
              </react_native_1.View>)}
          </react_native_1.View>

          {isWebPlatform ? (<react_native_1.View style={[
                    TrainingPage_styles_1.styles.previewWrap,
                    showSidePreview ? TrainingPage_styles_1.styles.previewWrapSide : TrainingPage_styles_1.styles.previewWrapBelow,
                ]}>
              <react_native_1.Text style={TrainingPage_styles_1.styles.previewTitle}>{text.training.previewTitle}</react_native_1.Text>
              <react_native_1.Text style={TrainingPage_styles_1.styles.previewHint}>{text.training.webPreviewHint}</react_native_1.Text>
              {webPreviewDocument ? (<react_native_1.View style={TrainingPage_styles_1.styles.previewControlsRow}>
                  <react_native_1.Pressable style={TrainingPage_styles_1.styles.previewControlButton} onPress={() => setIsWebPreviewFullscreen(true)}>
                    <react_native_1.Text style={TrainingPage_styles_1.styles.previewControlButtonText}>
                      {text.training.previewFullscreen}
                    </react_native_1.Text>
                  </react_native_1.Pressable>
                </react_native_1.View>) : null}
              <react_native_1.View style={[TrainingPage_styles_1.styles.previewFrameShell, { height: previewFrameHeight }]}>
                {webPreviewDocument ? (<WebPdfFrame src={buildWebPreviewUrl(webPreviewDocument.fileUrl)} title={webPreviewDocument.originalName}/>) : (<react_native_1.View style={TrainingPage_styles_1.styles.previewEmptyWrap}>
                    <react_native_1.Text style={TrainingPage_styles_1.styles.previewEmptyText}>
                      {text.training.previewEmpty}
                    </react_native_1.Text>
                  </react_native_1.View>)}
              </react_native_1.View>
            </react_native_1.View>) : null}
        </react_native_1.View>) : null}

      {isWebPlatform ? (<react_native_1.Modal visible={isWebPreviewFullscreen} transparent animationType="fade" onRequestClose={() => setIsWebPreviewFullscreen(false)}>
          <react_native_1.View style={TrainingPage_styles_1.styles.previewFullscreenBackdrop}>
            <react_native_1.View style={TrainingPage_styles_1.styles.previewFullscreenCard}>
              <react_native_1.View style={TrainingPage_styles_1.styles.previewFullscreenHeader}>
                <react_native_1.Text style={TrainingPage_styles_1.styles.previewFullscreenTitle} numberOfLines={1}>
                  {webPreviewDocument?.originalName ?? text.training.previewTitle}
                </react_native_1.Text>
                <react_native_1.Pressable style={TrainingPage_styles_1.styles.previewControlButton} onPress={() => setIsWebPreviewFullscreen(false)}>
                  <react_native_1.Text style={TrainingPage_styles_1.styles.previewControlButtonText}>X</react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>
              <react_native_1.View style={TrainingPage_styles_1.styles.previewFullscreenFrameShell}>
                {webPreviewDocument ? (<WebPdfFrame src={buildWebPreviewUrl(webPreviewDocument.fileUrl)} title={webPreviewDocument.originalName}/>) : null}
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.Modal>) : null}

      <react_native_1.Modal visible={Boolean(selectedVideo)} transparent animationType="fade" onRequestClose={() => setSelectedVideo(null)}>
        <react_native_1.View style={TrainingPage_styles_1.styles.videoModalBackdrop}>
          <react_native_1.View style={TrainingPage_styles_1.styles.videoModalCard}>
            <react_native_1.View style={TrainingPage_styles_1.styles.videoModalHeader}>
              <react_native_1.Text style={TrainingPage_styles_1.styles.videoModalTitle} numberOfLines={2}>
                {selectedVideo?.originalName ?? text.training.videosTitle}
              </react_native_1.Text>
              <react_native_1.Pressable style={TrainingPage_styles_1.styles.videoModalCloseButton} onPress={() => setSelectedVideo(null)} accessibilityRole="button" accessibilityLabel={text.dashboard.levelModalClose}>
                <react_native_1.Text style={TrainingPage_styles_1.styles.videoModalCloseText}>X</react_native_1.Text>
              </react_native_1.Pressable>
            </react_native_1.View>

            {selectedVideo ? (<react_native_1.View style={[
                TrainingPage_styles_1.styles.videoPlayerShell,
                { width: videoFrameSize.width, height: videoFrameSize.height },
            ]}>
                <expo_av_1.Video key={selectedVideo.fileUrl} ref={videoRef} style={TrainingPage_styles_1.styles.videoPlayer} source={{ uri: selectedVideo.fileUrl }} useNativeControls resizeMode={expo_av_1.ResizeMode.CONTAIN} shouldPlay onLoad={(event) => {
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
//# sourceMappingURL=TrainingPage.js.map
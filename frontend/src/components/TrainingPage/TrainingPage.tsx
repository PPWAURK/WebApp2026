import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import type { User } from '../../types/auth';
import type { Language } from '../../types/language';
import { TrainingDocumentPreview } from './TrainingDocumentPreview';
import { styles } from './TrainingPage.styles';
import { TrainingResourceList } from './TrainingResourceList';
import { TrainingScenarioPanel } from './TrainingScenarioPanel';
import { TrainingVideoModal } from './TrainingVideoModal';
import { useTrainingData } from './useTrainingData';
import { useTrainingNavigation } from './useTrainingNavigation';

type TrainingPageProps = {
  text: AppText;
  accessToken: string;
  currentUser: User;
  language: Language;
};

export function TrainingPage({
  text,
  accessToken,
  currentUser,
  language,
}: TrainingPageProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const navigation = useTrainingNavigation({
    text,
    userTrainingAccess: currentUser.trainingAccess ?? [],
  });

  const data = useTrainingData({
    text,
    accessToken,
    userId: currentUser.id,
    language,
    activeSection: navigation.activeSection,
    searchKeyword: navigation.searchKeyword,
  });

  const isWebPlatform = Platform.OS === 'web';
  const isTabletBrowserWidth = windowWidth >= 768 && windowWidth < 1180;
  const showSidePreview = isWebPlatform && windowWidth >= 1180;
  const previewFrameHeight = showSidePreview
    ? Math.max(360, Math.min(windowHeight - 320, 560))
    : isTabletBrowserWidth
      ? Math.max(520, Math.min(windowHeight * 0.72, 760))
      : Math.max(300, Math.min(windowHeight * 0.45, 460));

  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View
            style={styles.heroHeader}
            accessible
            accessibilityLabel={`${text.training.title}. ${text.training.intro}`}
          >
            <View style={styles.heroCopy}>
              <Text
                style={styles.title}
                accessibilityRole="header"
                accessibilityLabel={text.training.title}
              >
                {text.training.title}
              </Text>
              <Text style={styles.subtitle}>{text.training.intro}</Text>
            </View>

            <View style={styles.heroBadgeRow}>
              {navigation.activeScenario ? (
                <View style={styles.heroBadge}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={COLORS.brandPrimary}
                  />
                  <Text style={styles.heroBadgeText}>
                    {navigation.activeScenario.label}
                  </Text>
                </View>
              ) : null}
              {navigation.selectedSectionLabel ? (
                <View style={styles.heroBadge}>
                  <Ionicons
                    name="book-outline"
                    size={16}
                    color={COLORS.brandPrimary}
                  />
                  <Text style={styles.heroBadgeText}>
                    {navigation.selectedSectionLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {navigation.availableScenarios.length > 0 ? (
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {data.selectedSectionDocumentCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.taskTypeDocument}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {data.selectedSectionVideoCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.taskTypeVideo}
                </Text>
              </View>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>
                  {data.selectedSectionCompletedCount}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {text.training.completionDone}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {data.libraryError ? (
          <Text style={styles.error}>{data.libraryError}</Text>
        ) : null}

        {!navigation.availableScenarios.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyText}>
              {text.training.noAccessConfigured}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.trainingLayout,
              windowWidth >= 1120 && styles.trainingLayoutWide,
            ]}
          >
            <View
              style={[
                styles.controlColumn,
                windowWidth >= 1120 && styles.controlColumnWide,
              ]}
            >
              <TrainingScenarioPanel
                text={text}
                availableScenarios={navigation.availableScenarios}
                activeScenario={navigation.activeScenario}
                activeSection={navigation.activeSection}
                selectedSectionLabel={navigation.selectedSectionLabel}
                sectionLabelByKey={navigation.sectionLabelByKey}
                quizLanguage={data.quizLanguage}
                quizUrl={data.quizUrl}
                quizStatusText={data.quizStatusText}
                onSelectScenario={navigation.setActiveScenarioKey}
                onSelectSection={navigation.setActiveSection}
                onSelectQuizLanguage={data.setQuizLanguage}
                onOpenQuiz={data.openQuiz}
              />
            </View>

            <View
              style={[
                styles.resourceColumn,
                windowWidth >= 1120 && styles.resourceColumnWide,
              ]}
            >
              <View style={styles.surfaceCard}>
                <View
                  style={[
                    styles.contentSplit,
                    showSidePreview && styles.contentSplitWide,
                  ]}
                >
                  <TrainingResourceList
                    text={text}
                    selectedSectionLabel={navigation.selectedSectionLabel}
                    showSidePreview={showSidePreview}
                    sectionItems={data.sectionItems}
                    searchKeyword={navigation.searchKeyword}
                    isLoadingLibrary={data.isLoadingLibrary}
                    hasSearchResults={data.hasSearchResults}
                    isWebPlatform={isWebPlatform}
                    completionByFile={data.completionByFile}
                    openedDocumentFileName={
                      data.openedDocument?.fileName ?? null
                    }
                    webPreviewDocumentFileName={
                      data.webPreviewDocument?.fileName ?? null
                    }
                    onChangeSearch={navigation.setSearchKeyword}
                    onOpenDocument={data.openDocument}
                    onOpenVideo={navigation.openVideo}
                    onToggleCompletion={(fileName) => {
                      void data.toggleCompletion(fileName);
                    }}
                  />

                  {isWebPlatform ? (
                    <TrainingDocumentPreview
                      text={text}
                      webPreviewDocument={data.webPreviewDocument}
                      webPreviewUrl={data.webPreviewUrl}
                      webPreviewLoading={data.webPreviewLoading}
                      showSidePreview={showSidePreview}
                      previewFrameHeight={previewFrameHeight}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <TrainingVideoModal
        text={text}
        selectedVideo={navigation.selectedVideo}
        shouldAutoFullscreen={navigation.shouldAutoFullscreen}
        onClose={navigation.closeVideo}
        onAutoFullscreenConsumed={navigation.clearAutoFullscreen}
      />
    </View>
  );
}

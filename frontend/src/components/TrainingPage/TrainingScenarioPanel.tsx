import { Pressable, ScrollView, Text, View } from 'react-native';
import type { TrainingQuizLinkLanguage } from '../../constants/config';
import type { TrainingScenario } from '../../constants/trainingScenario';
import type { AppText } from '../../locales/translations';
import type { TrainingSection } from '../../types/auth';
import { styles } from './TrainingPage.styles';

type TrainingScenarioPanelProps = {
  text: AppText;
  availableScenarios: TrainingScenario[];
  activeScenario: TrainingScenario | null;
  activeSection: TrainingSection | null;
  selectedSectionLabel: string;
  sectionLabelByKey: Map<TrainingSection, string>;
  quizLanguage: TrainingQuizLinkLanguage;
  quizUrl: string | null;
  quizStatusText: string;
  onSelectScenario: (scenarioKey: string) => void;
  onSelectSection: (section: TrainingSection) => void;
  onSelectQuizLanguage: (language: TrainingQuizLinkLanguage) => void;
  onOpenQuiz: () => void;
};

export function TrainingScenarioPanel({
  text,
  availableScenarios,
  activeScenario,
  activeSection,
  selectedSectionLabel,
  sectionLabelByKey,
  quizLanguage,
  quizUrl,
  quizStatusText,
  onSelectScenario,
  onSelectSection,
  onSelectQuizLanguage,
  onOpenQuiz,
}: TrainingScenarioPanelProps) {
  return (
    <>
      <View style={styles.surfaceCard}>
        <View style={styles.surfaceHeader}>
          <View style={styles.surfaceHeaderCopy}>
            <Text style={styles.surfaceEyebrow}>
              {text.training.scenarioLabel}
            </Text>
            <Text style={styles.surfaceTitle}>
              {activeScenario?.label ?? text.training.title}
            </Text>
            <Text style={styles.surfaceSubtitle}>
              {text.training.workflowHint}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {availableScenarios.map((scenario) => (
            <Pressable
              key={scenario.key}
              style={[
                styles.pill,
                activeScenario?.key === scenario.key && styles.pillActive,
              ]}
              onPress={() => onSelectScenario(scenario.key)}
              accessibilityRole="button"
              accessibilityLabel={scenario.label}
              accessibilityState={{
                selected: activeScenario?.key === scenario.key,
              }}
            >
              <Text
                style={[
                  styles.pillText,
                  activeScenario?.key === scenario.key && styles.pillTextActive,
                ]}
              >
                {scenario.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.surfaceCard}>
        <View style={styles.surfaceHeader}>
          <View style={styles.surfaceHeaderCopy}>
            <Text style={styles.surfaceEyebrow}>
              {text.training.sectionLabel}
            </Text>
            <Text style={styles.surfaceTitle}>
              {selectedSectionLabel || text.training.sectionLabel}
            </Text>
            <Text style={styles.surfaceSubtitle}>
              {text.training.searchPlaceholder}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {(activeScenario?.sections ?? []).map((section) => (
            <Pressable
              key={section}
              style={[
                styles.pill,
                activeSection === section && styles.pillActive,
              ]}
              onPress={() => onSelectSection(section)}
              accessibilityRole="button"
              accessibilityLabel={sectionLabelByKey.get(section) ?? section}
              accessibilityState={{ selected: activeSection === section }}
            >
              <Text
                style={[
                  styles.pillText,
                  activeSection === section && styles.pillTextActive,
                ]}
              >
                {sectionLabelByKey.get(section)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.quizCard}>
        <View style={styles.quizHeaderRow}>
          <View style={styles.quizHeaderCopy}>
            <Text style={styles.quizTitle}>{text.training.workflowTitle}</Text>
            <Text style={styles.quizHint}>{text.training.workflowHint}</Text>
          </View>

          <Pressable
            style={[
              styles.quizActionButton,
              !quizUrl && styles.quizActionButtonDisabled,
            ]}
            onPress={onOpenQuiz}
            disabled={!quizUrl}
            accessibilityRole="button"
            accessibilityLabel={text.training.quizButton}
            accessibilityState={{ disabled: !quizUrl }}
          >
            <Text style={styles.quizActionButtonText}>
              {text.training.quizButton}
            </Text>
          </Pressable>
        </View>

        <View style={styles.quizLanguageRow}>
          <Text style={styles.quizLanguageLabel}>
            {text.training.quizLanguageLabel}
          </Text>
          <View style={styles.quizLanguageChipRow}>
            {(['fr', 'bn', 'zh'] as TrainingQuizLinkLanguage[]).map(
              (languageValue) => (
                <Pressable
                  key={`quiz-language-${languageValue}`}
                  style={[
                    styles.quizLanguageChip,
                    quizLanguage === languageValue &&
                      styles.quizLanguageChipActive,
                  ]}
                  onPress={() => onSelectQuizLanguage(languageValue)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    languageValue === 'fr'
                      ? text.training.quizLanguageFr
                      : languageValue === 'bn'
                        ? text.training.quizLanguageBn
                        : text.training.quizLanguageZh
                  }
                  accessibilityState={{
                    selected: quizLanguage === languageValue,
                  }}
                >
                  <Text
                    style={[
                      styles.quizLanguageChipText,
                      quizLanguage === languageValue &&
                        styles.quizLanguageChipTextActive,
                    ]}
                  >
                    {languageValue === 'fr'
                      ? text.training.quizLanguageFr
                      : languageValue === 'bn'
                        ? text.training.quizLanguageBn
                        : text.training.quizLanguageZh}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </View>

        <Text style={styles.quizStatusText}>{quizStatusText}</Text>
      </View>
    </>
  );
}

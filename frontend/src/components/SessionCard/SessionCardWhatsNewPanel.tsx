import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import {
  EMPLOYEE_LEVELS,
  formatNewsTag,
  getVisibleLevelsSummary,
} from '../../features/dashboard/lib/dashboardShared';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardWhatsNewState } from './useSessionCardWhatsNewState';

type SessionCardWhatsNewPanelProps = {
  isCompactAdminCardLayout: boolean;
  text: AppText;
  whatsNewState: SessionCardWhatsNewState;
};

export function SessionCardWhatsNewPanel({
  isCompactAdminCardLayout,
  text,
  whatsNewState,
}: SessionCardWhatsNewPanelProps) {
  const hasAttachment = Boolean(whatsNewState.whatsNewLastUpload);

  return (
    <View
      style={[
        styles.quickBlock,
        isCompactAdminCardLayout && styles.quickBlockCompact,
        styles.whatsNewHighlightBlock,
        styles.dashboardTopModuleCard,
      ]}
    >
      <View
        style={[
          styles.whatsNewHeader,
          isCompactAdminCardLayout && styles.whatsNewHeaderCompact,
        ]}
      >
        <View style={styles.whatsNewHeaderMain}>
          <View style={styles.whatsNewHeaderIconWrap}>
            <Ionicons
              name="megaphone-outline"
              size={18}
              color={COLORS.textOnDark}
            />
          </View>
          <View style={styles.whatsNewHeaderTitleWrap}>
            <Text
              style={[
                styles.panelTitleOnDark,
                isCompactAdminCardLayout && styles.panelTitleOnDarkCompact,
              ]}
            >
              {text.dashboard.whatsNewTitle}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.whatsNewStatusPill,
            isCompactAdminCardLayout && styles.whatsNewStatusPillCompact,
          ]}
        >
          <Text style={styles.whatsNewStatusPillText}>
            {hasAttachment
              ? text.dashboard.whatsNewAttachmentReady
              : text.dashboard.whatsNewCta}
          </Text>
        </View>
      </View>

      <View style={styles.whatsNewIntroStrip}>
        <Text style={styles.whatsNewKicker}>
          {text.dashboard.whatsNewSubtitle}
        </Text>
      </View>

      <View style={styles.whatsNewFieldBlock}>
        <Text style={styles.whatsNewFieldLabel}>
          {text.dashboard.whatsNewTypeLabel}
        </Text>
        <ScrollView
          horizontal={!isCompactAdminCardLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.whatsNewTypeTabs,
            isCompactAdminCardLayout && styles.whatsNewTypeTabsCompact,
          ]}
        >
          {(
            [
              {
                key: 'NEWS',
                label: text.dashboard.whatsNewTypeNews,
                icon: '📰',
                activeBorderColor: 'rgba(171,30,36,0.45)',
                activeBackgroundColor: 'rgba(171,30,36,0.12)',
              },
              {
                key: 'CONGRATS',
                label: text.dashboard.whatsNewTypeCongrats,
                icon: '🎉',
                activeBorderColor: 'rgba(198,90,110,0.45)',
                activeBackgroundColor: 'rgba(198,90,110,0.12)',
              },
              {
                key: 'CRITIQUE',
                label: text.dashboard.whatsNewTypeCritique,
                icon: '⚠️',
                activeBorderColor: 'rgba(145,24,30,0.45)',
                activeBackgroundColor: 'rgba(145,24,30,0.14)',
              },
            ] as const
          ).map((option) => {
            const isActive = whatsNewState.whatsNewLane === option.key;

            return (
              <Pressable
                key={`whats-new-lane-${option.key}`}
                style={[
                  styles.whatsNewTypeChip,
                  isCompactAdminCardLayout && styles.whatsNewTypeChipCompact,
                  isActive && styles.whatsNewTypeChipActive,
                  isActive && {
                    borderColor: option.activeBorderColor,
                    backgroundColor: option.activeBackgroundColor,
                  },
                ]}
                onPress={() => whatsNewState.setWhatsNewLane(option.key)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.whatsNewTypeChipText,
                    isCompactAdminCardLayout &&
                      styles.whatsNewTypeChipTextCompact,
                    isActive && styles.whatsNewTypeChipTextActive,
                  ]}
                >
                  {`${option.icon} ${option.label}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.whatsNewFieldBlock}>
        <Text style={styles.whatsNewFieldLabel}>
          {text.dashboard.whatsNewTitlePlaceholder}
        </Text>
        <TextInput
          style={styles.whatsNewInput}
          value={whatsNewState.whatsNewTitle}
          onChangeText={(value) => whatsNewState.setWhatsNewTitle(value)}
          placeholder={text.dashboard.whatsNewTitlePlaceholder}
          placeholderTextColor={COLORS.placeholder}
          accessibilityLabel={text.dashboard.whatsNewTitlePlaceholder}
        />
      </View>

      <View style={styles.whatsNewFieldBlock}>
        <Text style={styles.whatsNewFieldLabel}>
          {text.dashboard.whatsNewMessagePlaceholder}
        </Text>
        <TextInput
          style={[styles.whatsNewInput, styles.whatsNewMessageInput]}
          value={whatsNewState.whatsNewMessage}
          onChangeText={(value) => whatsNewState.setWhatsNewMessage(value)}
          placeholder={text.dashboard.whatsNewMessagePlaceholder}
          placeholderTextColor={COLORS.placeholder}
          multiline
          textAlignVertical="top"
          accessibilityLabel={text.dashboard.whatsNewMessagePlaceholder}
        />
      </View>

      <View style={styles.whatsNewFieldBlock}>
        <Text style={styles.whatsNewFieldLabel}>
          {text.dashboard.whatsNewTagsLabel}
        </Text>
        <TextInput
          style={styles.whatsNewInput}
          value={whatsNewState.whatsNewTagsInput}
          onChangeText={(value) => whatsNewState.setWhatsNewTagsInput(value)}
          placeholder={text.dashboard.whatsNewTagsPlaceholder}
          placeholderTextColor={COLORS.placeholder}
          accessibilityLabel={text.dashboard.whatsNewTagsPlaceholder}
        />
        <Text style={styles.panelSubtitleOnDark}>
          {text.dashboard.whatsNewTagsHint}
        </Text>

        {whatsNewState.parsedWhatsNewTags.length > 0 ? (
          <View style={styles.newsTagRow}>
            {whatsNewState.parsedWhatsNewTags.map((tag) => (
              <View key={`whats-new-tag-${tag}`} style={styles.newsIndexedTag}>
                <Text style={styles.newsIndexedTagText}>
                  {formatNewsTag(tag)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.whatsNewFieldBlock}>
        <Text style={styles.whatsNewFieldLabel}>
          {text.dashboard.whatsNewVisibleLevelsLabel}
        </Text>
        <Pressable
          style={[
            styles.whatsNewLevelsTrigger,
            isCompactAdminCardLayout && styles.whatsNewLevelsTriggerCompact,
          ]}
          onPress={whatsNewState.toggleWhatsNewLevelsExpanded}
          accessibilityRole="button"
          accessibilityLabel={text.dashboard.whatsNewVisibleLevelsLabel}
          accessibilityState={{
            expanded: whatsNewState.isWhatsNewLevelsExpanded,
          }}
        >
          <View style={styles.whatsNewLevelsTriggerTextWrap}>
            <Text
              style={styles.whatsNewLevelsSummary}
              numberOfLines={isCompactAdminCardLayout ? 2 : 1}
            >
              {getVisibleLevelsSummary(
                whatsNewState.whatsNewVisibleLevels,
                text,
              )}
            </Text>
            {!whatsNewState.isWhatsNewLevelsExpanded ? (
              <Text style={styles.panelSubtitleOnDark}>
                {text.dashboard.whatsNewVisibleLevelsHint}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={
              whatsNewState.isWhatsNewLevelsExpanded
                ? 'chevron-up-outline'
                : 'chevron-down-outline'
            }
            size={18}
            color={COLORS.brandPrimaryDark}
          />
        </Pressable>

        {whatsNewState.isWhatsNewLevelsExpanded ? (
          <>
            <Text style={styles.panelSubtitleOnDark}>
              {text.dashboard.whatsNewVisibleLevelsHint}
            </Text>
            <View style={styles.whatsNewLevelsWrap}>
              <Pressable
                style={[
                  styles.whatsNewLevelChip,
                  isCompactAdminCardLayout && styles.whatsNewLevelChipCompact,
                  whatsNewState.whatsNewVisibleLevels.length === 0 &&
                    styles.whatsNewLevelChipActive,
                ]}
                onPress={whatsNewState.clearWhatsNewVisibleLevels}
                accessibilityRole="button"
                accessibilityLabel={text.dashboard.newsVisibleLevelsAll}
                accessibilityState={{
                  selected: whatsNewState.whatsNewVisibleLevels.length === 0,
                }}
              >
                <Text
                  style={[
                    styles.whatsNewLevelChipText,
                    isCompactAdminCardLayout &&
                      styles.whatsNewLevelChipTextCompact,
                    whatsNewState.whatsNewVisibleLevels.length === 0 &&
                      styles.whatsNewLevelChipTextActive,
                  ]}
                >
                  {text.dashboard.newsVisibleLevelsAll}
                </Text>
              </Pressable>

              {EMPLOYEE_LEVELS.map((level) => {
                const isActive =
                  whatsNewState.whatsNewVisibleLevels.includes(level);

                return (
                  <Pressable
                    key={`whats-new-visible-level-${level}`}
                    style={[
                      styles.whatsNewLevelChip,
                      isCompactAdminCardLayout &&
                        styles.whatsNewLevelChipCompact,
                      isActive && styles.whatsNewLevelChipActive,
                    ]}
                    onPress={() =>
                      whatsNewState.toggleWhatsNewVisibleLevel(level)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={text.dashboard.levels[level]}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.whatsNewLevelChipText,
                        isCompactAdminCardLayout &&
                          styles.whatsNewLevelChipTextCompact,
                        isActive && styles.whatsNewLevelChipTextActive,
                      ]}
                    >
                      {text.dashboard.levels[level]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </View>

      <View
        style={[
          styles.whatsNewActionRow,
          isCompactAdminCardLayout && styles.whatsNewActionRowCompact,
        ]}
      >
        <Pressable
          style={[
            styles.whatsNewPublishButton,
            styles.whatsNewActionButton,
            isCompactAdminCardLayout && styles.whatsNewActionButtonCompact,
            whatsNewState.whatsNewPublishing && styles.buttonDisabled,
          ]}
          disabled={whatsNewState.whatsNewPublishing}
          onPress={() => {
            void whatsNewState.handlePublishWhatsNew();
          }}
          accessibilityRole="button"
          accessibilityLabel={text.dashboard.whatsNewCta}
          accessibilityState={{ disabled: whatsNewState.whatsNewPublishing }}
        >
          <Text style={styles.whatsNewPublishButtonText}>
            {whatsNewState.whatsNewPublishing
              ? text.dashboard.whatsNewPublishing
              : text.dashboard.whatsNewCta}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.whatsNewSecondaryButton,
            styles.whatsNewActionButton,
            isCompactAdminCardLayout && styles.whatsNewActionButtonCompact,
            whatsNewState.whatsNewUploading && styles.buttonDisabled,
          ]}
          disabled={whatsNewState.whatsNewUploading}
          onPress={() => {
            void whatsNewState.handleWhatsNewUpload();
          }}
          accessibilityRole="button"
          accessibilityLabel={text.dashboard.whatsNewAttachCta}
          accessibilityState={{ disabled: whatsNewState.whatsNewUploading }}
        >
          <Text style={styles.whatsNewSecondaryButtonText}>
            {whatsNewState.whatsNewUploading
              ? text.upload.uploading
              : text.dashboard.whatsNewAttachCta}
          </Text>
        </Pressable>
      </View>

      {whatsNewState.whatsNewError ? (
        <Text style={styles.errorText}>{whatsNewState.whatsNewError}</Text>
      ) : null}

      {whatsNewState.whatsNewLastUpload ? (
        <View style={styles.whatsNewAttachmentCard}>
          <Text style={styles.panelSectionLabelOnDark}>
            {text.dashboard.whatsNewAttachmentReady}
          </Text>
          <Text style={styles.panelSubtitleOnDark}>
            {whatsNewState.whatsNewLastUpload.originalName}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { EMPLOYEE_LEVELS } from '../../features/dashboard/lib/dashboardShared';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardLevelEditorModalProps = {
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardLevelEditorModal({
  supervisorState,
  text,
}: SessionCardLevelEditorModalProps) {
  return (
    <Modal
      visible={supervisorState.levelEditorUser !== null}
      transparent
      animationType="fade"
      onRequestClose={supervisorState.closeLevelEditor}
    >
      <View style={styles.previewModalBackdrop}>
        <View
          style={styles.levelModalCard}
          accessible
          accessibilityLabel={text.dashboard.levelModalTitle}
        >
          <View style={styles.previewModalHeader}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.levelModalTitle}
            </Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={supervisorState.closeLevelEditor}
              accessibilityRole="button"
              accessibilityLabel={text.dashboard.levelModalClose}
            >
              <Text style={styles.secondaryButtonText}>
                {text.dashboard.levelModalClose}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.levelListWrap}
            contentContainerStyle={styles.levelListContent}
          >
            {EMPLOYEE_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.levelListItem,
                  supervisorState.levelEditorUser?.employeeLevel === level &&
                    styles.levelListItemActive,
                  supervisorState.isUpdatingLevelUserId ===
                    supervisorState.levelEditorUser?.id &&
                    styles.buttonDisabled,
                ]}
                disabled={
                  supervisorState.isUpdatingLevelUserId ===
                  supervisorState.levelEditorUser?.id
                }
                onPress={() => {
                  if (!supervisorState.levelEditorUser) {
                    return;
                  }

                  void supervisorState.handleUpdateEmployeeLevel(
                    supervisorState.levelEditorUser,
                    level,
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={text.dashboard.levels[level]}
                accessibilityState={{
                  selected:
                    supervisorState.levelEditorUser?.employeeLevel === level,
                  disabled:
                    supervisorState.isUpdatingLevelUserId ===
                    supervisorState.levelEditorUser?.id,
                }}
              >
                <Text
                  style={[
                    styles.levelListItemText,
                    supervisorState.levelEditorUser?.employeeLevel === level &&
                      styles.levelListItemTextActive,
                  ]}
                >
                  {text.dashboard.levels[level]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

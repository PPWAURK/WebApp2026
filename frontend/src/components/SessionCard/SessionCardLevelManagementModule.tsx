import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { WORKPLACE_ROLES } from '../../features/dashboard/lib/dashboardShared';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardLevelManagementModuleProps = {
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardLevelManagementModule({
  supervisorState,
  text,
}: SessionCardLevelManagementModuleProps) {
  return (
    <View style={styles.employeeModuleCard}>
      <View style={styles.employeeModuleHeader}>
        <View style={styles.employeeModuleHeaderMain}>
          <View style={styles.employeeModuleHeaderIconWrap}>
            <Ionicons name="ribbon-outline" size={18} color="#ffffff" />
          </View>
          <View style={styles.employeeModuleHeaderCopy}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickLevelTitle}
            </Text>
            <Text style={styles.employeeModuleHeaderHint}>
              {supervisorState.levelUsers.length === 0
                ? text.dashboard.quickNoEmployee
                : text.dashboard.quickSearchPlaceholder}
            </Text>
          </View>
        </View>
        <View style={styles.employeeModuleCountBadge}>
          <Text style={styles.employeeModuleCountValue}>
            {supervisorState.levelUsers.length}
          </Text>
        </View>
      </View>

      <View style={styles.employeeModuleSearchShell}>
        <Ionicons name="search-outline" size={18} color="#8d5a5f" />
        <TextInput
          style={styles.employeeModuleSearchInput}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor="#a98a8d"
          value={supervisorState.levelSearch}
          onChangeText={(value) => supervisorState.setLevelSearch(value)}
        />
      </View>

      {supervisorState.levelBlockError ? (
        <Text style={styles.errorText}>{supervisorState.levelBlockError}</Text>
      ) : null}

      {supervisorState.levelUsers.length === 0 ? (
        <View style={styles.employeeModuleEmptyState}>
          <Ionicons name="people-outline" size={18} color="#ab1e24" />
          <Text style={styles.employeeModuleEmptyText}>
            {text.dashboard.quickNoEmployee}
          </Text>
        </View>
      ) : (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.employeeModuleScrollableList}
          contentContainerStyle={styles.employeeModuleScrollableListContent}
        >
          {supervisorState.levelUsers.map((entry) => (
            <View key={`level-${entry.id}`} style={styles.employeeCompactRow}>
              <View style={styles.employeeCompactTopRow}>
                <View style={styles.employeeModuleAvatar}>
                  <Text style={styles.employeeModuleAvatarText}>
                    {(entry.name ?? entry.email).trim().slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.employeeCompactIdentity}>
                  <Text style={styles.employeeModuleName} numberOfLines={1}>
                    {entry.name ?? entry.email}
                  </Text>
                  <Text style={styles.employeeModuleEmail} numberOfLines={1}>
                    {entry.email}
                  </Text>
                  <View style={styles.employeeCompactMetaRail}>
                    <View style={styles.employeeCompactMetaPill}>
                      <Text
                        style={styles.employeeCompactMetaPillText}
                        numberOfLines={1}
                      >
                        {text.dashboard.levels[entry.employeeLevel]}
                      </Text>
                    </View>
                    <View style={styles.employeeCompactMetaPill}>
                      <Text
                        style={styles.employeeCompactMetaPillText}
                        numberOfLines={1}
                      >
                        {entry.restaurant?.name ??
                          text.dashboard.quickRestaurantFilterUnassigned}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.employeeModuleInlineIconButton,
                    supervisorState.isUpdatingLevelUserId === entry.id &&
                      styles.buttonDisabled,
                  ]}
                  accessibilityLabel={text.dashboard.levelModalTitle}
                  disabled={supervisorState.isUpdatingLevelUserId === entry.id}
                  onPress={() => supervisorState.openLevelEditor(entry)}
                >
                  <Ionicons
                    name={
                      supervisorState.isUpdatingLevelUserId === entry.id
                        ? 'hourglass-outline'
                        : 'arrow-up-circle-outline'
                    }
                    size={18}
                    color="#7f1b21"
                  />
                </Pressable>
              </View>

              <View style={styles.employeeCompactChoiceWrap}>
                {WORKPLACE_ROLES.map((workplaceRole) => {
                  const isActive = entry.workplaceRole === workplaceRole;
                  const isUpdating =
                    supervisorState.isUpdatingWorkplaceUserId === entry.id;

                  return (
                    <Pressable
                      key={`workplace-${entry.id}-${workplaceRole}`}
                      style={[
                        styles.employeeCompactChoiceChip,
                        isActive && styles.employeeCompactChoiceChipActive,
                        isUpdating && styles.buttonDisabled,
                      ]}
                      disabled={isUpdating}
                      onPress={() => {
                        void supervisorState.handleUpdateEmployeeWorkplaceRole(
                          entry,
                          workplaceRole,
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.employeeCompactChoiceChipText,
                          isActive &&
                            styles.employeeCompactChoiceChipTextActive,
                        ]}
                      >
                        {text.dashboard.workplaceValues[workplaceRole]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

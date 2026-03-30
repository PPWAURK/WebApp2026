import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardManagerDeleteModuleProps = {
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardManagerDeleteModule({
  supervisorState,
  text,
}: SessionCardManagerDeleteModuleProps) {
  return (
    <View style={styles.employeeModuleCard}>
      <View style={styles.employeeModuleHeader}>
        <View style={styles.employeeModuleHeaderMain}>
          <View style={styles.employeeModuleHeaderIconWrap}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={COLORS.textOnDark}
            />
          </View>
          <View style={styles.employeeModuleHeaderCopy}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickDeleteTitle}
            </Text>
            <Text style={styles.employeeModuleHeaderHint}>
              {supervisorState.deletionUsers.length === 0
                ? text.dashboard.quickNoEmployee
                : text.dashboard.quickSearchPlaceholder}
            </Text>
          </View>
        </View>
        <View style={styles.employeeModuleCountBadge}>
          <Text style={styles.employeeModuleCountValue}>
            {supervisorState.deletionUsers.length}
          </Text>
        </View>
      </View>

      <View style={styles.employeeModuleSearchShell}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.employeeModuleSearchInput}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor={COLORS.placeholder}
          value={supervisorState.deleteSearch}
          onChangeText={(value) => supervisorState.setDeleteSearch(value)}
          accessibilityLabel={text.dashboard.quickSearchPlaceholder}
        />
      </View>

      {supervisorState.usersLoading ? (
        <Text style={styles.subtitle}>{text.adminTraining.loading}</Text>
      ) : null}
      {supervisorState.usersError ? (
        <Text style={styles.errorText}>{supervisorState.usersError}</Text>
      ) : null}

      {!supervisorState.usersLoading &&
      !supervisorState.usersError &&
      supervisorState.deletionUsers.length === 0 ? (
        <View style={styles.employeeModuleEmptyState}>
          <Ionicons
            name="people-outline"
            size={18}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.employeeModuleEmptyText}>
            {text.dashboard.quickNoEmployee}
          </Text>
        </View>
      ) : null}

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.employeeModuleScrollableList}
        contentContainerStyle={styles.employeeModuleScrollableListContent}
      >
        {supervisorState.deletionUsers.map((entry) => {
          const displayName = (entry.name ?? entry.email).trim();

          return (
            <View
              key={`manager-delete-${entry.id}`}
              style={styles.employeeCompactRow}
            >
              <View style={styles.employeeCompactTopRow}>
                <View style={styles.employeeModuleAvatar}>
                  <Text style={styles.employeeModuleAvatarText}>
                    {displayName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.employeeCompactIdentity}>
                  <Text style={styles.employeeModuleName} numberOfLines={1}>
                    {displayName}
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
                        {entry.restaurant?.name ??
                          text.dashboard.quickRestaurantFilterUnassigned}
                      </Text>
                    </View>
                    <View style={styles.employeeCompactMetaPill}>
                      <Text
                        style={styles.employeeCompactMetaPillText}
                        numberOfLines={1}
                      >
                        {text.dashboard.levels[entry.employeeLevel]}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.employeeCompactIconButton,
                    styles.employeeCompactDangerButton,
                    supervisorState.isDeletingUserId === entry.id &&
                      styles.buttonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${text.dashboard.quickDeleteButton} ${displayName}`}
                  accessibilityState={{
                    disabled: supervisorState.isDeletingUserId === entry.id,
                  }}
                  disabled={supervisorState.isDeletingUserId === entry.id}
                  onPress={() => {
                    void supervisorState.handleDeleteUser(entry);
                  }}
                >
                  <Ionicons
                    name={
                      supervisorState.isDeletingUserId === entry.id
                        ? 'hourglass-outline'
                        : 'trash-outline'
                    }
                    size={16}
                    color={COLORS.brandPrimary}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

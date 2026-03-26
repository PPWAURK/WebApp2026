import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardManagerApprovalModuleProps = {
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardManagerApprovalModule({
  supervisorState,
  text,
}: SessionCardManagerApprovalModuleProps) {
  const pendingApprovalCount = supervisorState.accountApprovalUsers.length;
  const pendingEmailVerificationCount =
    supervisorState.emailVerificationUsers.length;
  const totalPendingCount =
    pendingApprovalCount + pendingEmailVerificationCount;

  return (
    <View style={styles.employeeModuleCard}>
      <View style={styles.employeeModuleHeader}>
        <View style={styles.employeeModuleHeaderMain}>
          <View style={styles.employeeModuleHeaderIconWrap}>
            <Ionicons
              name="person-add-outline"
              size={18}
              color={COLORS.textOnDark}
            />
          </View>
          <View style={styles.employeeModuleHeaderCopy}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickApproveTitle}
            </Text>
            <Text style={styles.employeeModuleHeaderHint}>
              {totalPendingCount === 0
                ? text.dashboard.quickNoPendingAccount
                : text.dashboard.quickSearchPlaceholder}
            </Text>
          </View>
        </View>
        <View style={styles.employeeModuleCountBadge}>
          <Text style={styles.employeeModuleCountValue}>
            {totalPendingCount}
          </Text>
        </View>
      </View>

      <View style={styles.employeeModuleSearchShell}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.employeeModuleSearchInput}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor={COLORS.placeholder}
          value={supervisorState.approvalSearch}
          onChangeText={(value) => supervisorState.setApprovalSearch(value)}
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
      totalPendingCount === 0 ? (
        <View style={styles.employeeModuleEmptyState}>
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={COLORS.brandPrimary}
          />
          <Text style={styles.employeeModuleEmptyText}>
            {text.dashboard.quickNoPendingAccount}
          </Text>
        </View>
      ) : null}

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.employeeModuleScrollableList}
        contentContainerStyle={styles.employeeModuleScrollableListContent}
      >
        {pendingEmailVerificationCount > 0 ? (
          <View style={styles.managerApprovalSection}>
            <View style={styles.managerApprovalSectionHeader}>
              <Text style={styles.quickSectionTitle}>
                {text.dashboard.quickPendingEmailVerificationTitle}
              </Text>
              <Text style={styles.managerApprovalSectionCount}>
                {pendingEmailVerificationCount}
              </Text>
            </View>

            {supervisorState.emailVerificationUsers.map((entry) => {
              const displayName = (entry.name ?? entry.email).trim();

              return (
                <View
                  key={`manager-verify-${entry.id}`}
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
                      <Text
                        style={styles.employeeModuleEmail}
                        numberOfLines={1}
                      >
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
                        <View style={styles.employeeCompactMetaPill}>
                          <Text
                            style={styles.employeeCompactMetaPillText}
                            numberOfLines={1}
                          >
                            {
                              text.dashboard.workplaceValues[
                                entry.workplaceRole
                              ]
                            }
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.subtitle}>
                        {text.dashboard.quickPendingEmailVerificationHint}
                      </Text>
                    </View>

                    <View style={styles.employeeCompactActionColumn}>
                      <View style={styles.employeeModuleStatusPill}>
                        <Text style={styles.employeeModuleStatusText}>
                          {
                            text.adminTraining.accountStatusValues
                              .emailVerificationPending
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {pendingApprovalCount > 0 ? (
          <View style={styles.managerApprovalSection}>
            <View style={styles.managerApprovalSectionHeader}>
              <Text style={styles.quickSectionTitle}>
                {text.dashboard.quickApproveTitle}
              </Text>
              <Text style={styles.managerApprovalSectionCount}>
                {pendingApprovalCount}
              </Text>
            </View>

            {supervisorState.accountApprovalUsers.map((entry) => {
              const displayName = (entry.name ?? entry.email).trim();

              return (
                <View
                  key={`manager-approve-${entry.id}`}
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
                      <Text
                        style={styles.employeeModuleEmail}
                        numberOfLines={1}
                      >
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
                        <View style={styles.employeeCompactMetaPill}>
                          <Text
                            style={styles.employeeCompactMetaPillText}
                            numberOfLines={1}
                          >
                            {
                              text.dashboard.workplaceValues[
                                entry.workplaceRole
                              ]
                            }
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.employeeCompactActionColumn}>
                      <View style={styles.employeeModuleStatusPill}>
                        <Text style={styles.employeeModuleStatusText}>
                          {text.adminTraining.accountStatusValues.pending}
                        </Text>
                      </View>
                      <View style={styles.employeeCompactActionRow}>
                        <Pressable
                          style={[
                            styles.employeeCompactIconButton,
                            styles.employeeCompactDangerButton,
                            supervisorState.isRejectingUserId === entry.id &&
                              styles.buttonDisabled,
                          ]}
                          accessibilityLabel={
                            text.adminTraining.rejectAccountButton
                          }
                          disabled={
                            supervisorState.isApprovingUserId === entry.id ||
                            supervisorState.isRejectingUserId === entry.id
                          }
                          onPress={() => {
                            void supervisorState.handleRejectAccount(entry);
                          }}
                        >
                          <Ionicons
                            name={
                              supervisorState.isRejectingUserId === entry.id
                                ? 'hourglass-outline'
                                : 'close-outline'
                            }
                            size={16}
                            color={COLORS.brandPrimary}
                          />
                        </Pressable>

                        <Pressable
                          style={[
                            styles.employeeCompactIconButton,
                            styles.employeeCompactApproveButton,
                            supervisorState.isApprovingUserId === entry.id &&
                              styles.buttonDisabled,
                          ]}
                          accessibilityLabel={
                            text.adminTraining.approveAccountButton
                          }
                          disabled={
                            supervisorState.isApprovingUserId === entry.id ||
                            supervisorState.isRejectingUserId === entry.id
                          }
                          onPress={() => {
                            void supervisorState.handleApproveAccount(entry);
                          }}
                        >
                          <Ionicons
                            name={
                              supervisorState.isApprovingUserId === entry.id
                                ? 'hourglass-outline'
                                : 'checkmark-outline'
                            }
                            size={16}
                            color={COLORS.textOnDark}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

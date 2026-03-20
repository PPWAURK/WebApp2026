import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={styles.employeeModuleCard}>
      <View style={styles.employeeModuleHeader}>
        <View style={styles.employeeModuleHeaderMain}>
          <View style={styles.employeeModuleHeaderIconWrap}>
            <Ionicons name="person-add-outline" size={18} color="#ffffff" />
          </View>
          <View style={styles.employeeModuleHeaderCopy}>
            <Text style={styles.quickBlockTitle}>
              {text.dashboard.quickApproveTitle}
            </Text>
            <Text style={styles.employeeModuleHeaderHint}>
              {pendingApprovalCount === 0
                ? text.dashboard.quickNoPendingAccount
                : text.dashboard.quickSearchPlaceholder}
            </Text>
          </View>
        </View>
        <View style={styles.employeeModuleCountBadge}>
          <Text style={styles.employeeModuleCountValue}>
            {pendingApprovalCount}
          </Text>
        </View>
      </View>

      <View style={styles.employeeModuleSearchShell}>
        <Ionicons name="search-outline" size={18} color="#8d5a5f" />
        <TextInput
          style={styles.employeeModuleSearchInput}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor="#a98a8d"
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
      pendingApprovalCount === 0 ? (
        <View style={styles.employeeModuleEmptyState}>
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color="#ab1e24"
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
                    <View style={styles.employeeCompactMetaPill}>
                      <Text
                        style={styles.employeeCompactMetaPillText}
                        numberOfLines={1}
                      >
                        {text.dashboard.workplaceValues[entry.workplaceRole]}
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
                      accessibilityLabel={text.adminTraining.rejectAccountButton}
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
                        color="#ab1e24"
                      />
                    </Pressable>

                    <Pressable
                      style={[
                        styles.employeeCompactIconButton,
                        styles.employeeCompactApproveButton,
                        supervisorState.isApprovingUserId === entry.id &&
                          styles.buttonDisabled,
                      ]}
                      accessibilityLabel={text.adminTraining.approveAccountButton}
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
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import { SessionCardRestaurantFilter } from './SessionCardRestaurantFilter';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardAdminQuickPanelProps = {
  isCompactAdminCardLayout: boolean;
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardAdminQuickPanel({
  isCompactAdminCardLayout,
  supervisorState,
  text,
}: SessionCardAdminQuickPanelProps) {
  const pendingApprovalCount = supervisorState.accountApprovalUsers.length;
  const pendingEmailVerificationCount =
    supervisorState.emailVerificationUsers.length;
  const totalPendingCount =
    pendingApprovalCount + pendingEmailVerificationCount;

  return (
    <View
      style={[
        styles.quickBlock,
        isCompactAdminCardLayout && styles.quickBlockCompact,
        styles.dashboardTopModuleCard,
        styles.managerApprovalCard,
      ]}
    >
      <View
        style={[
          styles.dashboardTopCardHeader,
          isCompactAdminCardLayout && styles.dashboardTopCardHeaderCompact,
        ]}
      >
        <View
          style={[
            styles.dashboardTopCardHeaderMain,
            isCompactAdminCardLayout &&
              styles.dashboardTopCardHeaderMainCompact,
          ]}
        >
          <View style={styles.dashboardTopCardIconWrap}>
            <Ionicons name="people-outline" size={18} color="#ffffff" />
          </View>
          <Text
            style={[
              styles.panelTitleOnDark,
              isCompactAdminCardLayout && styles.panelTitleOnDarkCompact,
            ]}
          >
            {text.dashboard.quickApproveManagerTitle}
          </Text>
        </View>
        <View
          style={[
            styles.dashboardTopCardStatusPill,
            isCompactAdminCardLayout &&
              styles.dashboardTopCardStatusPillCompact,
          ]}
        >
          <Text style={styles.dashboardTopCardStatusText}>
            {totalPendingCount}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.managerApprovalToolbar,
          isCompactAdminCardLayout && styles.managerApprovalToolbarCompact,
        ]}
      >
        <View
          style={[
            styles.managerApprovalToolbarFilter,
            isCompactAdminCardLayout &&
              styles.managerApprovalToolbarFilterCompact,
          ]}
        >
          <SessionCardRestaurantFilter
            compact
            isOpen={supervisorState.openRestaurantFilterFor === 'approval'}
            onSelect={supervisorState.selectRestaurantFilter}
            onToggle={() => supervisorState.toggleRestaurantFilter('approval')}
            options={supervisorState.employeeRestaurantOptions}
            selectedLabel={supervisorState.selectedRestaurantFilterLabel}
            selectedValue={supervisorState.selectedEmployeeRestaurantFilter}
            text={text}
          />
        </View>
        <TextInput
          style={[
            styles.quickSearchInput,
            styles.managerApprovalSearchInput,
            isCompactAdminCardLayout &&
              styles.managerApprovalSearchInputCompact,
          ]}
          placeholder={text.dashboard.quickSearchPlaceholder}
          placeholderTextColor="#a98a8d"
          value={supervisorState.approvalSearch}
          onChangeText={(value) => supervisorState.setApprovalSearch(value)}
        />
      </View>

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

          {supervisorState.emailVerificationUsers.slice(0, 4).map((entry) => (
            <View
              key={`verify-${entry.id}`}
              style={styles.managerApprovalPendingCard}
            >
              <View style={styles.managerApprovalPendingTopRow}>
                <View style={styles.quickLevelInfo}>
                  <Text style={styles.quickRowTitle}>
                    {entry.name ?? entry.email}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {entry.email}
                  </Text>
                </View>

                <View style={styles.employeeModuleStatusPill}>
                  <Text style={styles.employeeModuleStatusText}>
                    {
                      text.adminTraining.accountStatusValues
                        .emailVerificationPending
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.managerApprovalMetaRow}>
                <View style={styles.managerApprovalMetaPill}>
                  <Text style={styles.managerApprovalMetaPillText}>
                    {entry.restaurant?.name ??
                      text.dashboard.quickRestaurantFilterUnassigned}
                  </Text>
                </View>
                <View style={styles.managerApprovalMetaPill}>
                  <Text style={styles.managerApprovalMetaPillText}>
                    {text.dashboard.levels.L7_D}
                  </Text>
                </View>
              </View>

              <Text style={styles.subtitle}>
                {text.dashboard.quickPendingEmailVerificationHint}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.managerApprovalSection}>
        <View style={styles.managerApprovalSectionHeader}>
          <Text style={styles.quickSectionTitle}>
            {text.dashboard.quickApproveManagerTitle}
          </Text>
          <Text style={styles.managerApprovalSectionCount}>
            {pendingApprovalCount}
          </Text>
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
          <View style={styles.managerApprovalEmptyState}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#ab1e24"
            />
            <Text style={styles.managerApprovalEmptyText}>
              {text.dashboard.quickNoPendingAccount}
            </Text>
          </View>
        ) : null}

        {supervisorState.accountApprovalUsers.slice(0, 4).map((entry) => (
          <View
            key={`approve-${entry.id}`}
            style={styles.managerApprovalPendingCard}
          >
            <View style={styles.managerApprovalPendingTopRow}>
              <View style={styles.quickLevelInfo}>
                <Text style={styles.quickRowTitle}>
                  {entry.name ?? entry.email}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {entry.email}
                </Text>
              </View>

              <View style={styles.managerApprovalPendingActions}>
                <Pressable
                  style={[
                    styles.managerApprovalIconButton,
                    styles.managerApprovalRejectButton,
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
                    size={18}
                    color="#ab1e24"
                  />
                </Pressable>
                <Pressable
                  style={[
                    styles.managerApprovalIconButton,
                    styles.managerApprovalApproveButton,
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
                    size={18}
                    color={
                      supervisorState.isApprovingUserId === entry.id
                        ? '#7f1b21'
                        : '#2f7d32'
                    }
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.managerApprovalMetaRow}>
              <View style={styles.managerApprovalMetaPill}>
                <Text style={styles.managerApprovalMetaPillText}>
                  {entry.restaurant?.name ??
                    text.dashboard.quickRestaurantFilterUnassigned}
                </Text>
              </View>
              <View style={styles.managerApprovalMetaPill}>
                <Text style={styles.managerApprovalMetaPillText}>
                  {text.dashboard.levels.L7_D}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.managerApprovalSection}>
        <View style={styles.managerApprovalSectionHeader}>
          <Text style={styles.quickSectionTitle}>
            {text.dashboard.quickManagerListTitle}
          </Text>
          <Text style={styles.managerApprovalSectionCount}>
            {supervisorState.approvedManagerUsers.length}
          </Text>
        </View>

        {supervisorState.approvedManagerUsers.length === 0 ? (
          <Text style={styles.subtitle}>{text.dashboard.quickNoManager}</Text>
        ) : (
          <View style={styles.managerApprovalManagerGrid}>
            {supervisorState.approvedManagerUsers.map((entry) => (
              <View
                key={`approved-manager-${entry.id}`}
                style={styles.managerApprovalManagerCard}
              >
                <Text style={styles.quickManagerBadgeText} numberOfLines={1}>
                  {(entry.name ?? entry.email).trim()}
                </Text>
                <Text style={styles.quickManagerBadgeMeta} numberOfLines={1}>
                  {entry.restaurant?.name ??
                    text.dashboard.quickRestaurantFilterUnassigned}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

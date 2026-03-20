import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { AppText } from '../../locales/translations';
import { styles } from './SessionCard.styles';
import type { SessionCardSupervisorState } from './useSessionCardSupervisorState';

type SessionCardManagerTransferModuleProps = {
  supervisorState: SessionCardSupervisorState;
  text: AppText;
};

export function SessionCardManagerTransferModule({
  supervisorState,
  text,
}: SessionCardManagerTransferModuleProps) {
  return (
    <View style={styles.employeeModuleCard}>
      <View style={styles.employeeModuleHeader}>
        <View style={styles.employeeModuleHeaderMain}>
          <View style={styles.employeeModuleHeaderIconWrap}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#ffffff" />
          </View>
          <View style={styles.employeeModuleHeaderCopy}>
            <Text style={styles.quickBlockTitle}>
              {text.adminRestaurant.transferEmployees}
            </Text>
            <Text style={styles.employeeModuleHeaderHint}>
              {text.adminRestaurant.transferSearchPlaceholder}
            </Text>
          </View>
        </View>
        <View style={styles.employeeModuleCountBadge}>
          <Text style={styles.employeeModuleCountValue}>
            {supervisorState.visibleTransferUsers.length}
          </Text>
        </View>
      </View>

      <View style={styles.employeeModuleSearchShell}>
        <Ionicons name="search-outline" size={18} color="#8d5a5f" />
        <TextInput
          style={styles.employeeModuleSearchInput}
          placeholder={text.adminRestaurant.transferSearchPlaceholder}
          placeholderTextColor="#a98a8d"
          value={supervisorState.transferSearch}
          onChangeText={(value) => supervisorState.setTransferSearch(value)}
        />
      </View>

      {supervisorState.transferBlockError ? (
        <Text style={styles.errorText}>{supervisorState.transferBlockError}</Text>
      ) : null}

      {supervisorState.visibleTransferUsers.length === 0 ? (
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
          style={styles.employeeTransferRoster}
          contentContainerStyle={styles.employeeModuleScrollableListContent}
        >
          {supervisorState.visibleTransferUsers.map((entry) => {
            const isActive = supervisorState.selectedTransferUserId === entry.id;
            const displayName = (entry.name ?? entry.email).trim();

            return (
              <Pressable
                key={`transfer-user-${entry.id}`}
                style={[
                  styles.employeeCompactSelectableRow,
                  isActive && styles.employeeCompactSelectableRowActive,
                ]}
                onPress={() => supervisorState.selectTransferUser(entry.id)}
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
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={16}
                    color={isActive ? '#ab1e24' : '#8d5a5f'}
                  />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {supervisorState.selectedTransferUser ? (
        <View style={styles.transferPanelCard}>
          <View style={styles.transferPanelHeader}>
            <View style={styles.transferPanelHeaderMain}>
              <View style={styles.employeeModuleAvatar}>
                <Text style={styles.employeeModuleAvatarText}>
                  {(supervisorState.selectedTransferUser.name ??
                    supervisorState.selectedTransferUser.email)
                    .trim()
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.transferPanelIdentity}>
                <Text style={styles.employeeModuleName} numberOfLines={1}>
                  {supervisorState.selectedTransferUser.name ??
                    supervisorState.selectedTransferUser.email}
                </Text>
                <Text style={styles.employeeModuleEmail} numberOfLines={1}>
                  {supervisorState.selectedTransferUser.email}
                </Text>
              </View>
            </View>
            <View style={styles.transferPanelStatusPill}>
              <Text style={styles.transferPanelStatusText}>
                {supervisorState.selectedTransferRestaurant
                  ? text.adminRestaurant.transferButton
                  : text.adminRestaurant.assignToRestaurant}
              </Text>
            </View>
          </View>

          <View style={styles.transferSummaryGrid}>
            <View style={styles.transferSummaryCard}>
              <Text style={styles.transferSummaryLabel}>
                {text.adminRestaurant.currentRestaurantLabel}
              </Text>
              <Text style={styles.transferSummaryValue} numberOfLines={2}>
                {supervisorState.selectedTransferUser.restaurant?.name ??
                  text.adminRestaurant.unassignedLabel}
              </Text>
            </View>
            <View style={styles.transferSummaryCard}>
              <Text style={styles.transferSummaryLabel}>
                {text.adminRestaurant.assignToRestaurant}
              </Text>
              <Text style={styles.transferSummaryValue} numberOfLines={2}>
                {supervisorState.selectedTransferRestaurant?.name ??
                  text.dashboard.quickTransferNoDestination}
              </Text>
            </View>
          </View>

          {supervisorState.availableTransferRestaurants.length === 0 ? (
            <Text style={styles.employeeModuleSelectionHint}>
              {text.dashboard.quickTransferNoDestination}
            </Text>
          ) : (
            <ScrollView
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={styles.transferDestinationList}
              contentContainerStyle={styles.transferDestinationListContent}
            >
              {supervisorState.availableTransferRestaurants.map((restaurant) => {
                const isActive =
                  supervisorState.selectedTransferRestaurantId === restaurant.id;

                return (
                  <Pressable
                    key={`transfer-restaurant-${restaurant.id}`}
                    style={[
                      styles.transferDestinationRow,
                      isActive && styles.transferDestinationRowActive,
                    ]}
                    onPress={() =>
                      supervisorState.selectTransferRestaurant(restaurant.id)
                    }
                  >
                    <View style={styles.transferDestinationRowMain}>
                      <Text
                        style={[
                          styles.transferDestinationRowText,
                          isActive && styles.transferDestinationRowTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {restaurant.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.transferDestinationIndicator,
                        isActive && styles.transferDestinationIndicatorActive,
                      ]}
                    >
                      <Ionicons
                        name={isActive ? 'checkmark-outline' : 'ellipse-outline'}
                        size={16}
                        color={isActive ? '#ffffff' : '#ab1e24'}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            style={[
              styles.employeeModuleActionButton,
              styles.employeeModuleNeutralAction,
              (supervisorState.isTransferringUserId ===
                supervisorState.selectedTransferUser.id ||
                !supervisorState.selectedTransferRestaurantId ||
                supervisorState.availableTransferRestaurants.length === 0) &&
                styles.buttonDisabled,
            ]}
            disabled={
              supervisorState.isTransferringUserId ===
                supervisorState.selectedTransferUser.id ||
              !supervisorState.selectedTransferRestaurantId ||
              supervisorState.availableTransferRestaurants.length === 0
            }
            onPress={() => {
              void supervisorState.handleTransferUser();
            }}
          >
            <Ionicons
              name={
                supervisorState.isTransferringUserId ===
                supervisorState.selectedTransferUser.id
                  ? 'hourglass-outline'
                  : 'swap-horizontal-outline'
              }
              size={16}
              color="#7f1b21"
            />
            <Text style={styles.employeeModuleNeutralActionText}>
              {supervisorState.isTransferringUserId ===
              supervisorState.selectedTransferUser.id
                ? text.adminRestaurant.transferring
                : text.adminRestaurant.transferButton}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

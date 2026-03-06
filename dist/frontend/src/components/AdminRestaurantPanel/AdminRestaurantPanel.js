"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRestaurantPanel = AdminRestaurantPanel;
const react_1 = require("react");
const react_native_1 = require("react-native");
const restaurantsApi_1 = require("../../services/restaurantsApi");
const usersApi_1 = require("../../services/usersApi");
const AdminRestaurantPanel_styles_1 = require("./AdminRestaurantPanel.styles");
function AdminRestaurantPanel({ accessToken, text }) {
    const [restaurants, setRestaurants] = (0, react_1.useState)([]);
    const [selectedRestaurantId, setSelectedRestaurantId] = (0, react_1.useState)(null);
    const [employeeUsers, setEmployeeUsers] = (0, react_1.useState)([]);
    const [selectedTransferUserId, setSelectedTransferUserId] = (0, react_1.useState)(null);
    const [transferSearch, setTransferSearch] = (0, react_1.useState)('');
    const [restaurantName, setRestaurantName] = (0, react_1.useState)('');
    const [restaurantAddress, setRestaurantAddress] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isSavingRestaurant, setIsSavingRestaurant] = (0, react_1.useState)(false);
    const [isAssigning, setIsAssigning] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    async function loadData() {
        setIsLoading(true);
        setError(null);
        try {
            const [restaurantData, trainingUsers] = await Promise.all([
                (0, restaurantsApi_1.fetchRestaurants)(),
                (0, usersApi_1.fetchTrainingAccessUsers)(accessToken),
            ]);
            const allUsers = trainingUsers.filter((entry) => entry.role !== 'ADMIN');
            setRestaurants(restaurantData);
            setEmployeeUsers(allUsers);
            if (restaurantData.length > 0) {
                setSelectedRestaurantId((current) => current ?? restaurantData[0].id);
            }
            if (allUsers.length > 0) {
                setSelectedTransferUserId((current) => current ?? allUsers[0].id);
            }
        }
        catch {
            setError(text.adminRestaurant.loadError);
        }
        finally {
            setIsLoading(false);
        }
    }
    (0, react_1.useEffect)(() => {
        void loadData();
    }, [accessToken]);
    const visibleTransferUsers = (0, react_1.useMemo)(() => {
        const query = transferSearch.trim().toLowerCase();
        if (!query) {
            return employeeUsers;
        }
        return employeeUsers.filter((entry) => {
            const name = entry.name?.toLowerCase() ?? '';
            return name.includes(query) || entry.email.toLowerCase().includes(query);
        });
    }, [employeeUsers, transferSearch]);
    const selectedTransferUser = (0, react_1.useMemo)(() => employeeUsers.find((entry) => entry.id === selectedTransferUserId) ?? null, [employeeUsers, selectedTransferUserId]);
    async function onCreateRestaurant() {
        setIsSavingRestaurant(true);
        setError(null);
        try {
            const created = await (0, restaurantsApi_1.createRestaurant)(accessToken, {
                name: restaurantName,
                address: restaurantAddress,
            });
            setRestaurants((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedRestaurantId(created.id);
            setRestaurantName('');
            setRestaurantAddress('');
        }
        catch {
            setError(text.adminRestaurant.createError);
        }
        finally {
            setIsSavingRestaurant(false);
        }
    }
    async function onTransferUser() {
        if (!selectedTransferUser || !selectedRestaurantId) {
            return;
        }
        setIsAssigning(true);
        setError(null);
        try {
            await (0, usersApi_1.assignUserRestaurant)(accessToken, selectedTransferUser.id, selectedRestaurantId);
            setEmployeeUsers((current) => current.map((entry) => entry.id === selectedTransferUser.id
                ? {
                    ...entry,
                    restaurantId: selectedRestaurantId,
                    restaurant: restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
                        entry.restaurant,
                }
                : entry));
        }
        catch {
            setError(text.adminRestaurant.transferError);
        }
        finally {
            setIsAssigning(false);
        }
    }
    return (<react_native_1.View style={AdminRestaurantPanel_styles_1.styles.uploadCard}>
      <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.uploadTitle}>{text.adminRestaurant.title}</react_native_1.Text>
      <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.uploadSubtitle}>
        {text.adminRestaurant.subtitle}
      </react_native_1.Text>

      {error ? <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.error}>{error}</react_native_1.Text> : null}

      <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.uploadFieldTitle}>{text.adminRestaurant.newRestaurant}</react_native_1.Text>
      <react_native_1.TextInput style={AdminRestaurantPanel_styles_1.styles.input} placeholder={text.adminRestaurant.namePlaceholder} placeholderTextColor="#a98a8d" value={restaurantName} onChangeText={setRestaurantName}/>
      <react_native_1.TextInput style={AdminRestaurantPanel_styles_1.styles.input} placeholder={text.adminRestaurant.addressPlaceholder} placeholderTextColor="#a98a8d" value={restaurantAddress} onChangeText={setRestaurantAddress}/>
      <react_native_1.Pressable style={[AdminRestaurantPanel_styles_1.styles.primaryButton, isSavingRestaurant && AdminRestaurantPanel_styles_1.styles.buttonDisabled]} disabled={isSavingRestaurant} onPress={() => {
            void onCreateRestaurant();
        }}>
        <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.primaryButtonText}>
          {isSavingRestaurant
            ? text.adminRestaurant.creating
            : text.adminRestaurant.createButton}
        </react_native_1.Text>
      </react_native_1.Pressable>

      <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.uploadFieldTitle}>{text.adminRestaurant.assignToRestaurant}</react_native_1.Text>
      <react_native_1.View style={AdminRestaurantPanel_styles_1.styles.uploadChipWrap}>
        {restaurants.map((restaurant) => (<react_native_1.Pressable key={restaurant.id} style={[
                AdminRestaurantPanel_styles_1.styles.uploadChip,
                selectedRestaurantId === restaurant.id && AdminRestaurantPanel_styles_1.styles.uploadChipActive,
            ]} onPress={() => setSelectedRestaurantId(restaurant.id)}>
            <react_native_1.Text style={[
                AdminRestaurantPanel_styles_1.styles.uploadChipText,
                selectedRestaurantId === restaurant.id && AdminRestaurantPanel_styles_1.styles.uploadChipTextActive,
            ]}>
              {restaurant.name}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.uploadFieldTitle}>{text.adminRestaurant.transferEmployees}</react_native_1.Text>
      <react_native_1.TextInput style={AdminRestaurantPanel_styles_1.styles.input} placeholder={text.adminRestaurant.transferSearchPlaceholder} placeholderTextColor="#a98a8d" value={transferSearch} onChangeText={setTransferSearch}/>

      <react_native_1.View style={AdminRestaurantPanel_styles_1.styles.uploadChipWrap}>
        {visibleTransferUsers.map((entry) => (<react_native_1.Pressable key={entry.id} style={[
                AdminRestaurantPanel_styles_1.styles.uploadChip,
                selectedTransferUserId === entry.id && AdminRestaurantPanel_styles_1.styles.uploadChipActive,
            ]} onPress={() => setSelectedTransferUserId(entry.id)}>
            <react_native_1.Text style={[
                AdminRestaurantPanel_styles_1.styles.uploadChipText,
                selectedTransferUserId === entry.id && AdminRestaurantPanel_styles_1.styles.uploadChipTextActive,
            ]}>
              {entry.name ?? entry.email}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      {selectedTransferUser ? (<react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.docEmpty}>
          {text.adminRestaurant.currentRestaurantLabel}:{' '}
          {selectedTransferUser.restaurant?.name ?? text.adminRestaurant.unassignedLabel}
        </react_native_1.Text>) : null}

      <react_native_1.Pressable style={[
            AdminRestaurantPanel_styles_1.styles.secondaryButton,
            (isAssigning || !selectedTransferUser || !selectedRestaurantId) && AdminRestaurantPanel_styles_1.styles.buttonDisabled,
        ]} disabled={isAssigning || !selectedTransferUser || !selectedRestaurantId} onPress={() => {
            void onTransferUser();
        }}>
        <react_native_1.Text style={AdminRestaurantPanel_styles_1.styles.secondaryButtonText}>
          {isAssigning ? text.adminRestaurant.transferring : text.adminRestaurant.transferButton}
        </react_native_1.Text>
      </react_native_1.Pressable>
    </react_native_1.View>);
}
//# sourceMappingURL=AdminRestaurantPanel.js.map
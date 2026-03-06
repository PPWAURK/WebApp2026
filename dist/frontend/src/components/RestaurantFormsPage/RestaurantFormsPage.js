"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantFormsPage = RestaurantFormsPage;
const react_1 = require("react");
const react_native_1 = require("react-native");
const documentTaxonomy_1 = require("../../constants/documentTaxonomy");
const uploadsApi_1 = require("../../services/uploadsApi");
const RestaurantFormsPage_styles_1 = require("./RestaurantFormsPage.styles");
function RestaurantFormsPage({ text, accessToken, currentUser, }) {
    const [items, setItems] = (0, react_1.useState)([]);
    const [activeSection, setActiveSection] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const sectionOptions = (0, react_1.useMemo)(() => (0, documentTaxonomy_1.getSectionsByModule)(text).FORMS, [text]);
    const visibleSectionOptions = (0, react_1.useMemo)(() => sectionOptions.filter((sectionOption) => currentUser.trainingAccess.includes(sectionOption.key)), [currentUser.trainingAccess, sectionOptions]);
    (0, react_1.useEffect)(() => {
        if (!visibleSectionOptions.length) {
            setActiveSection(null);
            return;
        }
        setActiveSection((current) => current && visibleSectionOptions.some((entry) => entry.key === current)
            ? current
            : (visibleSectionOptions[0]?.key ?? null));
    }, [visibleSectionOptions]);
    (0, react_1.useEffect)(() => {
        let isActive = true;
        setIsLoading(true);
        setError(null);
        void (0, uploadsApi_1.fetchLibraryFiles)(accessToken, { module: 'FORMS' })
            .then((result) => {
            if (isActive) {
                setItems(result);
            }
        })
            .catch(() => {
            if (isActive) {
                setItems([]);
                setError(text.forms.loadError);
            }
        })
            .finally(() => {
            if (isActive) {
                setIsLoading(false);
            }
        });
        return () => {
            isActive = false;
        };
    }, [accessToken, text.forms.loadError]);
    const visibleItems = (0, react_1.useMemo)(() => {
        if (!activeSection) {
            return [];
        }
        return items
            .filter((item) => item.section === activeSection)
            .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime());
    }, [activeSection, items]);
    return (<react_native_1.View style={RestaurantFormsPage_styles_1.styles.card}>
      <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.title}>{text.forms.title}</react_native_1.Text>
      <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.subtitle}>{text.forms.intro}</react_native_1.Text>

      <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.sectionLabel}>{text.forms.sectionLabel}</react_native_1.Text>
      <react_native_1.View style={RestaurantFormsPage_styles_1.styles.tabRow}>
        {visibleSectionOptions.map((sectionOption) => (<react_native_1.Pressable key={sectionOption.key} style={[
                RestaurantFormsPage_styles_1.styles.tab,
                activeSection === sectionOption.key && RestaurantFormsPage_styles_1.styles.tabActive,
            ]} onPress={() => setActiveSection(sectionOption.key)}>
            <react_native_1.Text style={[
                RestaurantFormsPage_styles_1.styles.tabText,
                activeSection === sectionOption.key && RestaurantFormsPage_styles_1.styles.tabTextActive,
            ]}>
              {sectionOption.label}
            </react_native_1.Text>
          </react_native_1.Pressable>))}
      </react_native_1.View>

      {error ? <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.error}>{error}</react_native_1.Text> : null}

      {!visibleSectionOptions.length ? (<react_native_1.Text style={RestaurantFormsPage_styles_1.styles.emptyText}>{text.forms.noAccess}</react_native_1.Text>) : null}

      {visibleSectionOptions.length ? (<react_native_1.View style={RestaurantFormsPage_styles_1.styles.listBlock}>
          {isLoading ? (<react_native_1.Text style={RestaurantFormsPage_styles_1.styles.emptyText}>{text.forms.loadingLibrary}</react_native_1.Text>) : visibleItems.length === 0 ? (<react_native_1.Text style={RestaurantFormsPage_styles_1.styles.emptyText}>{text.forms.noDocuments}</react_native_1.Text>) : (visibleItems.map((item) => (<react_native_1.View key={item.fileName} style={RestaurantFormsPage_styles_1.styles.fileCard}>
                <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.fileName}>{item.originalName}</react_native_1.Text>
                <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.fileMeta}>
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </react_native_1.Text>
                <react_native_1.Pressable style={RestaurantFormsPage_styles_1.styles.openButton} onPress={() => {
                    void react_native_1.Linking.openURL(item.fileUrl);
                }}>
                  <react_native_1.Text style={RestaurantFormsPage_styles_1.styles.openButtonText}>{text.forms.openFileButton}</react_native_1.Text>
                </react_native_1.Pressable>
              </react_native_1.View>)))}
        </react_native_1.View>) : null}
    </react_native_1.View>);
}
//# sourceMappingURL=RestaurantFormsPage.js.map
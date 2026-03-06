"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageProvider = LanguageProvider;
exports.useLanguage = useLanguage;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const react_1 = require("react");
const storage_1 = require("../constants/storage");
const translations_1 = require("../locales/translations");
const LanguageContext = (0, react_1.createContext)(null);
function LanguageProvider({ children }) {
    const [isLoadingLanguage, setIsLoadingLanguage] = (0, react_1.useState)(true);
    const [language, setLanguageState] = (0, react_1.useState)('fr');
    (0, react_1.useEffect)(() => {
        async function loadLanguage() {
            try {
                const savedLanguage = await async_storage_1.default.getItem(storage_1.LANGUAGE_KEY);
                if (savedLanguage === 'fr' || savedLanguage === 'zh') {
                    setLanguageState(savedLanguage);
                }
            }
            finally {
                setIsLoadingLanguage(false);
            }
        }
        void loadLanguage();
    }, []);
    async function setLanguage(languageValue) {
        setLanguageState(languageValue);
        await async_storage_1.default.setItem(storage_1.LANGUAGE_KEY, languageValue);
    }
    return (<LanguageContext.Provider value={{
            isLoadingLanguage,
            language,
            text: translations_1.translations[language],
            setLanguage,
        }}>
      {children}
    </LanguageContext.Provider>);
}
function useLanguage() {
    const context = (0, react_1.useContext)(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
//# sourceMappingURL=useLanguage.js.map
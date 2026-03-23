"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const expo_linear_gradient_1 = require("expo-linear-gradient");
const datetimepicker_1 = __importDefault(require("@react-native-community/datetimepicker"));
const GlassCard_1 = __importDefault(require("../components/GlassCard"));
const SupplementQuickView_1 = __importDefault(require("../components/SupplementQuickView"));
const SkeletonCard_1 = __importDefault(require("../components/SkeletonCard"));
const supabase_1 = require("../services/supabase");
const supplementService_1 = require("../services/supplementService");
const notificationService_1 = require("../services/notificationService");
const useTranslation_1 = require("../hooks/useTranslation");
const theme_1 = require("../config/theme");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const ThemeContext_1 = require("../contexts/ThemeContext");
const ScreenContainer_1 = __importDefault(require("../components/ScreenContainer"));
const CustomAlert_1 = require("../components/CustomAlert");
const SUPPLEMENT_CATEGORIES = [
    { id: 'all', en: 'All', tr: 'Tümü' },
    { id: 'protein', en: 'Protein', tr: 'Protein' },
    { id: 'pre_workout', en: 'Pre-Workout', tr: 'Antrenman Öncesi' },
    { id: 'post_workout', en: 'Post-Workout', tr: 'Antrenman Sonrası' },
    { id: 'vitamin', en: 'Vitamins', tr: 'Vitaminler' },
    { id: 'mineral', en: 'Minerals', tr: 'Mineraller' },
    { id: 'other', en: 'Other', tr: 'Diğer' },
];
const TAB_OPTIONS = [
    { id: 'supplements', en: 'Supplements', tr: 'Takviyeler', icon: 'flask' },
    { id: 'vitamins', en: 'Vitamins', tr: 'Vitaminler', icon: 'sunny' },
    { id: 'minerals', en: 'Minerals', tr: 'Mineraller', icon: 'diamond' },
];
const SupplementScreen = () => {
    const { colors, isDark } = (0, ThemeContext_1.useTheme)();
    const styles = react_1.default.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const [activeTab, setActiveTab] = (0, react_1.useState)('supplements');
    const [supplements, setSupplements] = (0, react_1.useState)([]);
    const [vitamins, setVitamins] = (0, react_1.useState)([]);
    const [minerals, setMinerals] = (0, react_1.useState)([]);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)('all');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [selectedItem, setSelectedItem] = (0, react_1.useState)(null);
    const [scheduledNotifs, setScheduledNotifs] = (0, react_1.useState)({});
    const [showCreateProgramModal, setShowCreateProgramModal] = (0, react_1.useState)(false);
    const [selectedProgramDay, setSelectedProgramDay] = (0, react_1.useState)('monday');
    const [intakeTime, setIntakeTime] = (0, react_1.useState)(new Date());
    const [notificationTime, setNotificationTime] = (0, react_1.useState)(new Date());
    const [showTimePicker, setShowTimePicker] = (0, react_1.useState)(null);
    const [creatingProgram, setCreatingProgram] = (0, react_1.useState)(false);
    const { t, isTurkish, language } = (0, useTranslation_1.useTranslation)();
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const { showAlert, AlertComponent } = (0, CustomAlert_1.useAlert)();
    const getQueryLanguage = () => (language === 'tr' ? 'tr' : 'en');
    const normalizeItem = (item) => {
        var _a, _b, _c, _d;
        return (Object.assign(Object.assign({}, item), { type: item.type || item.category, dosage: (_a = item.dosage) !== null && _a !== void 0 ? _a : item.dosageAmount, unit: (_b = item.unit) !== null && _b !== void 0 ? _b : item.dosageUnit, side_effects: (_d = (_c = item.side_effects) !== null && _c !== void 0 ? _c : item.sideEffects) !== null && _d !== void 0 ? _d : [] }));
    };
    (0, react_1.useEffect)(() => {
        notificationService_1.NotificationService.getInstance().requestPermissions();
    }, []);
    (0, react_1.useEffect)(() => {
        loadData();
    }, [activeTab, selectedCategory]);
    const loadData = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        try {
            const supabase = supabase_1.SupabaseService.getInstance();
            const supplementService = supplementService_1.SupplementService.getInstance();
            // Load user routines to sync state
            const { user } = yield supabase.getCurrentUser();
            if (user) {
                const { data: routines } = yield supplementService.getUserRoutine(user.id);
                if (routines) {
                    const newScheduledNotifs = {};
                    routines.forEach((r) => {
                        newScheduledNotifs[r.supplement_id] = true;
                    });
                    setScheduledNotifs(prev => (Object.assign(Object.assign({}, prev), newScheduledNotifs)));
                }
            }
            const queryLanguage = getQueryLanguage();
            if (activeTab === 'supplements') {
                const cat = selectedCategory === 'all' ? undefined : selectedCategory;
                const { data } = yield supplementService.getSupplements(queryLanguage, cat);
                setSupplements((data || []).map(normalizeItem));
            }
            else if (activeTab === 'vitamins') {
                const { data } = yield supplementService.getSupplements(queryLanguage, 'vitamin');
                setVitamins((data || []).map(normalizeItem));
            }
            else {
                const { data } = yield supplementService.getSupplements(queryLanguage, 'mineral');
                setMinerals((data || []).map(normalizeItem));
            }
        }
        catch (err) {
            console.error('Load data error:', err);
        }
        finally {
            setLoading(false);
        }
    });
    const getItems = () => {
        if (activeTab === 'supplements')
            return supplements;
        if (activeTab === 'vitamins')
            return vitamins;
        return minerals;
    };
    const dayOptions = [
        { key: 'monday', tr: 'Pazartesi', en: 'Monday' },
        { key: 'tuesday', tr: 'Salı', en: 'Tuesday' },
        { key: 'wednesday', tr: 'Çarşamba', en: 'Wednesday' },
        { key: 'thursday', tr: 'Perşembe', en: 'Thursday' },
        { key: 'friday', tr: 'Cuma', en: 'Friday' },
        { key: 'saturday', tr: 'Cumartesi', en: 'Saturday' },
        { key: 'sunday', tr: 'Pazar', en: 'Sunday' },
    ];
    const weekdayMap = {
        sunday: 1,
        monday: 2,
        tuesday: 3,
        wednesday: 4,
        thursday: 5,
        friday: 6,
        saturday: 7,
    };
    const formatTime = (0, react_1.useCallback)((date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }, []);
    const openCreateProgramModal = (0, react_1.useCallback)(() => {
        const today = new Date();
        const jsDay = today.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        setSelectedProgramDay(dayOptions[dayIndex].key);
        setIntakeTime(today);
        setNotificationTime(today);
        setShowCreateProgramModal(true);
    }, [dayOptions]);
    const closeCreateProgramModal = (0, react_1.useCallback)(() => {
        setShowCreateProgramModal(false);
        setShowTimePicker(null);
        setCreatingProgram(false);
    }, []);
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'protein': return { icon: 'barbell', color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' };
            case 'pre_workout': return { icon: 'flash', color: '#FFC800', bg: 'rgba(255,200,0,0.12)' };
            case 'post_workout': return { icon: 'refresh', color: '#58CC02', bg: 'rgba(88,204,2,0.12)' };
            case 'vitamin':
            case 'water_soluble':
            case 'fat_soluble': return { icon: 'sunny', color: '#FF9600', bg: 'rgba(255,150,0,0.12)' };
            case 'mineral':
            case 'macro':
            case 'trace': return { icon: 'diamond', color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)' };
            default: return { icon: 'flask', color: '#CE82FF', bg: 'rgba(206,130,255,0.12)' };
        }
    };
    const toggleReminder = (0, react_1.useCallback)((item) => __awaiter(void 0, void 0, void 0, function* () {
        const isScheduled = scheduledNotifs[item.id];
        const identifier = `supplement-${item.id}`;
        const supplementService = supplementService_1.SupplementService.getInstance();
        const { user } = yield supabase_1.SupabaseService.getInstance().getCurrentUser();
        if (isScheduled) {
            yield notificationService_1.NotificationService.getInstance().cancelNotification(identifier);
            setScheduledNotifs(prev => (Object.assign(Object.assign({}, prev), { [item.id]: false })));
            if (user) {
                yield supplementService.removeFromRoutine(user.id, item.id);
            }
        }
        else {
            // Schedule for 9:00 AM every day
            yield notificationService_1.NotificationService.getInstance().scheduleSmartReminder('supplement', 9, 0, identifier, 'Supplements', undefined, language, { name: item.name });
            setScheduledNotifs(prev => (Object.assign(Object.assign({}, prev), { [item.id]: true })));
            if (user) {
                yield supplementService.addToRoutine(user.id, item.id, '09:00:00');
            }
        }
    }), [scheduledNotifs, t, language]);
    const renderItem = (0, react_1.useCallback)(({ item, index }) => {
        const isScheduled = scheduledNotifs[item.id];
        const catInfo = getCategoryIcon(item.category || item.type);
        return (<GlassCard_1.default variant="premium" delay={index * 80} // Staggered animation
         onPress={() => setSelectedItem(item)} style={styles.itemCard}>
        <react_native_1.View style={styles.itemHeader}>
          <react_native_1.View style={[styles.iconCircle, { backgroundColor: catInfo.bg }]}>
            <vector_icons_1.Ionicons name={catInfo.icon} size={24} color={catInfo.color}/>
          </react_native_1.View>
          <react_native_1.View style={styles.itemInfo}>
            <react_native_1.Text style={styles.itemName}>{item.name}</react_native_1.Text>
            <react_native_1.Text style={styles.itemMeta}>
              {item.brand || item.type || ''} {item.dosage ? `• ${item.dosage} ${item.unit || ''}` : ''}
            </react_native_1.Text>
          </react_native_1.View>
          <react_native_1.TouchableOpacity onPress={() => toggleReminder(item)} style={[styles.miniFab, isScheduled && styles.miniFabActive]}>
            <vector_icons_1.Ionicons name={isScheduled ? "notifications" : "notifications-outline"} size={18} color={isScheduled ? '#FFF' : colors.textSecondary}/>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        
        {/* Preview of benefits */}
        {item.benefits && item.benefits.length > 0 && (<react_native_1.View style={styles.benefitsPreview}>
             {item.benefits.slice(0, 2).map((b, i) => (<react_native_1.Text key={i} style={styles.benefitPreviewText}>• {b}</react_native_1.Text>))}
             {item.benefits.length > 2 && (<react_native_1.Text style={styles.benefitPreviewText}>+ {item.benefits.length - 2} more</react_native_1.Text>)}
           </react_native_1.View>)}
      </GlassCard_1.default>);
    }, [scheduledNotifs, isTurkish, colors, toggleReminder]);
    const handleAddProgram = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setCreatingProgram(true);
            const supabase = supabase_1.SupabaseService.getInstance();
            const { user } = yield supabase.getCurrentUser();
            if (!user) {
                showAlert({
                    type: 'warning',
                    title: isTurkish ? 'Giriş Gerekli' : 'Login Required',
                    message: isTurkish ? 'Programa eklemek için giriş yapmalısınız.' : 'Please sign in to add a program.',
                    buttons: [{ text: 'OK' }],
                });
                return;
            }
            const tabLabel = activeTab === 'supplements'
                ? (isTurkish ? 'Takviye' : 'Supplement')
                : activeTab === 'vitamins'
                    ? (isTurkish ? 'Vitamin' : 'Vitamin')
                    : (isTurkish ? 'Mineral' : 'Mineral');
            const itemsCount = getItems().length;
            const selectedDay = dayOptions.find(day => day.key === selectedProgramDay);
            const dayLabel = isTurkish ? selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.tr : selectedDay === null || selectedDay === void 0 ? void 0 : selectedDay.en;
            const { error } = yield supabase.createAiProgram({
                userId: user.id,
                type: 'supplement',
                title: `${tabLabel} ${isTurkish ? 'Programı' : 'Program'}`,
                content: [
                    `${isTurkish ? 'Kategori' : 'Category'}: ${tabLabel}`,
                    `${isTurkish ? 'Gün' : 'Day'}: ${dayLabel}`,
                    `${isTurkish ? 'Kullanım saati' : 'Intake time'}: ${formatTime(intakeTime)}`,
                    `${isTurkish ? 'Bildirim saati' : 'Notification time'}: ${formatTime(notificationTime)}`,
                    `${isTurkish ? 'Toplam öğe' : 'Total items'}: ${itemsCount}`,
                ].join('\n'),
            });
            if (error)
                throw error;
            const notificationService = notificationService_1.NotificationService.getInstance();
            yield notificationService.requestPermissions();
            yield notificationService.scheduleSmartReminder('supplement', notificationTime.getHours(), notificationTime.getMinutes(), `supplement_${user.id}_${activeTab}_${selectedProgramDay}`, 'Supplements', { tab: activeTab }, language, { name: tabLabel }, weekdayMap[selectedProgramDay]);
            showAlert({
                type: 'success',
                title: isTurkish ? 'Programa Eklendi' : 'Added to Program',
                message: isTurkish ? `${tabLabel} programı eklendi ve bildirim ayarlandı.` : `${tabLabel} program added and notification is scheduled.`,
                buttons: [{ text: 'OK' }],
            });
            closeCreateProgramModal();
        }
        catch (_a) {
            showAlert({
                type: 'error',
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish ? 'Program eklenemedi. Tekrar deneyin.' : 'Could not add program. Please try again.',
                buttons: [{ text: 'OK' }],
            });
        }
        finally {
            setCreatingProgram(false);
        }
    });
    return (<ScreenContainer_1.default edges={['top', 'left', 'right']}>
      <AlertComponent />
      <expo_linear_gradient_1.LinearGradient colors={isDark ? ['#1A1A2E', '#16162B'] : ['#F0F0F5', '#FFFFFF']} style={react_native_1.StyleSheet.absoluteFill}/>
      
      <react_native_1.View style={styles.header}>
        <react_native_1.View style={styles.headerTopRow}>
          <react_native_1.Text style={styles.headerTitle}>{isTurkish ? 'Takviyeler' : 'Supplements'}</react_native_1.Text>
          <react_native_1.TouchableOpacity style={styles.addProgramBtn} onPress={openCreateProgramModal} activeOpacity={0.8}>
            <vector_icons_1.Ionicons name="add-circle" size={16} color="#FFF"/>
            <react_native_1.Text style={styles.addProgramBtnText}>{isTurkish ? 'Programa Ekle' : 'Add to Program'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        <react_native_1.Text style={styles.headerSubtitle}>{isTurkish ? 'Premium Mağaza' : 'Premium Store'}</react_native_1.Text>
      </react_native_1.View>

      {/* Tabs */}
      <react_native_1.View style={styles.tabContainer}>
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (<react_native_1.TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.tabActive]} onPress={() => { setActiveTab(tab.id); }} activeOpacity={0.7}>
              <expo_linear_gradient_1.LinearGradient colors={isActive ? ['#CE82FF', '#A855F7'] : ['transparent', 'transparent']} style={react_native_1.StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}/>
              <vector_icons_1.Ionicons name={tab.icon} size={18} color={isActive ? '#FFF' : colors.textSecondary}/>
              <react_native_1.Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {isTurkish ? tab.tr : tab.en}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>);
        })}
        </react_native_1.ScrollView>
      </react_native_1.View>

      {/* Categories (for supplements only) */}
      {activeTab === 'supplements' && (<react_native_1.View style={styles.categoryContainer}>
          <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {SUPPLEMENT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (<react_native_1.TouchableOpacity key={cat.id} style={[styles.catChip, isActive && styles.catChipActive]} onPress={() => setSelectedCategory(cat.id)} activeOpacity={0.7}>
                  <react_native_1.Text style={[styles.catText, isActive && styles.catTextActive]}>
                    {isTurkish ? cat.tr : cat.en}
                  </react_native_1.Text>
                </react_native_1.TouchableOpacity>);
            })}
          </react_native_1.ScrollView>
        </react_native_1.View>)}

      {/* Items List */}
      {loading ? (<react_native_1.View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (<SkeletonCard_1.default key={i} height={120} style={styles.itemCard}/>))}
        </react_native_1.View>) : (<react_native_1.FlatList data={getItems()} renderItem={renderItem} keyExtractor={item => String(item.id)} contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false} initialNumToRender={6} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true} ListEmptyComponent={<react_native_1.View style={[theme_1.COMMON_STYLES.center, { paddingTop: theme_1.SPACING.xl }]}>
              <react_native_1.Text style={Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.body), { color: colors.textTertiary })}>
                {isTurkish ? 'Henüz veri yok' : 'No data yet'}
              </react_native_1.Text>
            </react_native_1.View>}/>)}

      {/* Quick View Modal */}
      <SupplementQuickView_1.default visible={!!selectedItem} item={selectedItem} onClose={() => setSelectedItem(null)} onToggleReminder={toggleReminder} isScheduled={selectedItem ? scheduledNotifs[selectedItem.id] : false}/>
      <react_native_1.Modal visible={showCreateProgramModal} transparent animationType="fade" onRequestClose={closeCreateProgramModal}>
        <react_native_1.View style={styles.modalOverlay}>
          <react_native_1.View style={styles.modalCard}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>{isTurkish ? 'Create Program' : 'Create Program'}</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={styles.modalCloseBtn}>
                <vector_icons_1.Ionicons name="close" size={18} color={colors.text}/>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            <react_native_1.Text style={styles.modalSubtitle}>
              {activeTab === 'supplements'
            ? (isTurkish ? 'Takviye programı oluştur' : 'Create supplement program')
            : activeTab === 'vitamins'
                ? (isTurkish ? 'Vitamin programı oluştur' : 'Create vitamin program')
                : (isTurkish ? 'Mineral programı oluştur' : 'Create mineral program')}
            </react_native_1.Text>

            <react_native_1.Text style={styles.modalSectionTitle}>{isTurkish ? 'Haftanın günü' : 'Day of week'}</react_native_1.Text>
            <react_native_1.View style={styles.optionWrap}>
              {dayOptions.map(option => {
            const active = selectedProgramDay === option.key;
            return (<react_native_1.TouchableOpacity key={option.key} activeOpacity={0.75} style={[styles.optionChip, active && styles.optionChipActive]} onPress={() => setSelectedProgramDay(option.key)}>
                    <react_native_1.Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                      {isTurkish ? option.tr : option.en}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>);
        })}
            </react_native_1.View>

            <react_native_1.View style={styles.timeRow}>
              <react_native_1.View style={styles.timeColumn}>
                <react_native_1.Text style={styles.timeLabel}>{isTurkish ? 'Kullanım saati' : 'Intake time'}</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('intake')}>
                  <vector_icons_1.Ionicons name="time-outline" size={16} color="#FF9600"/>
                  <react_native_1.Text style={styles.timeBtnText}>{formatTime(intakeTime)}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
              <react_native_1.View style={styles.timeColumn}>
                <react_native_1.Text style={styles.timeLabel}>{isTurkish ? 'Bildirim saati' : 'Notification time'}</react_native_1.Text>
                <react_native_1.TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimePicker('notification')}>
                  <vector_icons_1.Ionicons name="notifications-outline" size={16} color="#58CC02"/>
                  <react_native_1.Text style={styles.timeBtnText}>{formatTime(notificationTime)}</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>
            </react_native_1.View>

            {showTimePicker && (<datetimepicker_1.default value={showTimePicker === 'intake' ? intakeTime : notificationTime} mode="time" display={react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, date) => {
                if (react_native_1.Platform.OS === 'android')
                    setShowTimePicker(null);
                if (!date)
                    return;
                if (showTimePicker === 'intake')
                    setIntakeTime(date);
                if (showTimePicker === 'notification')
                    setNotificationTime(date);
            }}/>)}

            <react_native_1.View style={styles.modalActions}>
              <react_native_1.TouchableOpacity onPress={closeCreateProgramModal} style={styles.cancelBtn} activeOpacity={0.8}>
                <react_native_1.Text style={styles.cancelBtnText}>{isTurkish ? 'İptal' : 'Cancel'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
              <react_native_1.TouchableOpacity onPress={handleAddProgram} style={[styles.createBtn, creatingProgram && { opacity: 0.6 }]} disabled={creatingProgram} activeOpacity={0.85}>
                <react_native_1.Text style={styles.createBtnText}>{isTurkish ? 'Program Oluştur' : 'Create Program'}</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </ScreenContainer_1.default>);
};
const getStyles = (colors, isDark) => react_native_1.StyleSheet.create({
    header: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.md,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme_1.SPACING.sm,
    },
    headerTitle: Object.assign(Object.assign({ flex: 1 }, theme_1.TYPOGRAPHY.h1), { color: colors.text }),
    addProgramBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#58CC02',
        borderRadius: theme_1.BORDER_RADIUS.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    addProgramBtnText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.captionBold), { color: '#FFF', fontSize: 12 }),
    headerSubtitle: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.textSecondary, marginTop: 4 }),
    tabContainer: {
        marginBottom: theme_1.SPACING.sm,
    },
    tabScroll: {
        paddingHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme_1.SPACING.lg,
        paddingVertical: theme_1.SPACING.sm,
        borderRadius: theme_1.BORDER_RADIUS.xl,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
        overflow: 'hidden',
    },
    tabActive: {
        borderColor: 'transparent',
        backgroundColor: colors.secondary, // Fallback if gradient fails
    },
    tabText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.button), { color: colors.textSecondary, fontSize: 14 }),
    tabTextActive: {
        color: '#FFF',
        fontWeight: '700',
    },
    categoryContainer: {
        marginBottom: theme_1.SPACING.md,
    },
    catScroll: {
        paddingHorizontal: theme_1.SPACING.lg,
        gap: theme_1.SPACING.xs,
    },
    catChip: {
        paddingHorizontal: theme_1.SPACING.md,
        paddingVertical: 6,
        borderRadius: theme_1.BORDER_RADIUS.lg,
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    catChipActive: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    catText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary, fontWeight: '600' }),
    catTextActive: {
        color: colors.primary,
    },
    listContent: {
        paddingHorizontal: theme_1.SPACING.lg,
        paddingTop: theme_1.SPACING.sm,
    },
    itemCard: {
        marginBottom: theme_1.SPACING.md,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme_1.SPACING.md,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.h3), { color: colors.text, fontSize: 16, marginBottom: 2 }),
    itemMeta: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textSecondary }),
    miniFab: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniFabActive: {
        backgroundColor: colors.accent,
    },
    benefitsPreview: {
        marginTop: theme_1.SPACING.sm,
        paddingTop: theme_1.SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingLeft: 64, // Align with text
    },
    benefitPreviewText: Object.assign(Object.assign({}, theme_1.TYPOGRAPHY.caption), { color: colors.textTertiary, fontSize: 11 }),
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalCard: {
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceSecondary,
    },
    modalSubtitle: {
        marginTop: 8,
        color: colors.textTertiary,
        fontSize: 12,
        marginBottom: 14,
    },
    modalSectionTitle: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
        marginBottom: 8,
    },
    optionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    optionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary,
    },
    optionChipActive: {
        borderColor: '#58CC02',
        backgroundColor: '#58CC0218',
    },
    optionChipText: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    optionChipTextActive: {
        color: '#58CC02',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    timeColumn: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: colors.textTertiary,
        marginBottom: 8,
        fontWeight: '600',
    },
    timeBtn: {
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    timeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary,
    },
    cancelBtnText: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '700',
    },
    createBtn: {
        flex: 1.3,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#58CC02',
    },
    createBtnText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '800',
    },
});
exports.default = SupplementScreen;

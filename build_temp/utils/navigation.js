"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationRef = void 0;
exports.navigate = navigate;
exports.safeGoBack = safeGoBack;
exports.handleUnhandledNavigationAction = handleUnhandledNavigationAction;
const native_1 = require("@react-navigation/native");
exports.navigationRef = (0, native_1.createNavigationContainerRef)();
function navigate(name, params) {
    if (exports.navigationRef.isReady()) {
        exports.navigationRef.navigate(name, params);
    }
}
/**
 * Safely navigate back, or navigate to a fallback screen if can't go back.
 * This prevents the "GO_BACK was not handled by any navigator" error.
 */
function safeGoBack(navigation, fallbackRoute, fallbackParams) {
    var _a, _b, _c, _d, _e, _f, _g;
    const nav = navigation;
    let current = nav;
    while (current) {
        try {
            const state = (_a = current.getState) === null || _a === void 0 ? void 0 : _a.call(current);
            const hasStackHistory = typeof (state === null || state === void 0 ? void 0 : state.index) === 'number' && state.index > 0;
            if (hasStackHistory || ((_b = current.canGoBack) === null || _b === void 0 ? void 0 : _b.call(current))) {
                (_c = current.goBack) === null || _c === void 0 ? void 0 : _c.call(current);
                return;
            }
        }
        catch (e) {
        }
        current = (_d = current.getParent) === null || _d === void 0 ? void 0 : _d.call(current);
    }
    if (fallbackRoute) {
        try {
            (_e = nav.navigate) === null || _e === void 0 ? void 0 : _e.call(nav, fallbackRoute, fallbackParams);
            return;
        }
        catch (e) {
        }
    }
    if (exports.navigationRef.isReady()) {
        const rootState = exports.navigationRef.getRootState();
        if ((_f = rootState === null || rootState === void 0 ? void 0 : rootState.routeNames) === null || _f === void 0 ? void 0 : _f.includes('Main')) {
            exports.navigationRef.navigate('Main');
        }
        else if ((_g = rootState === null || rootState === void 0 ? void 0 : rootState.routeNames) === null || _g === void 0 ? void 0 : _g.includes('Auth')) {
            exports.navigationRef.navigate('Auth');
        }
    }
}
function handleUnhandledNavigationAction(action) {
    var _a, _b;
    if ((action === null || action === void 0 ? void 0 : action.type) !== 'GO_BACK') {
        return;
    }
    if (!exports.navigationRef.isReady()) {
        return;
    }
    const rootState = exports.navigationRef.getRootState();
    if ((_a = rootState === null || rootState === void 0 ? void 0 : rootState.routeNames) === null || _a === void 0 ? void 0 : _a.includes('Main')) {
        exports.navigationRef.navigate('Main');
        return;
    }
    if ((_b = rootState === null || rootState === void 0 ? void 0 : rootState.routeNames) === null || _b === void 0 ? void 0 : _b.includes('Auth')) {
        exports.navigationRef.navigate('Auth');
    }
}

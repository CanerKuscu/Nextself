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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakService = void 0;
const supabase_1 = require("./supabase");
const dateUtils_1 = require("../utils/dateUtils");
const LogManager_1 = require("../utils/LogManager");
class StreakService {
    constructor() { }
    static getInstance() {
        if (!StreakService.instance) {
            StreakService.instance = new StreakService();
        }
        return StreakService.instance;
    }
    // Get current streak status
    getStreak() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data: { user } } = yield supabase.auth.getUser();
                if (!user)
                    throw new Error('Not authenticated');
                // Calculate streak from workout_sessions table (users table doesn't have streak columns)
                const today = (0, dateUtils_1.getLocalDateString)();
                const { data: workouts, error } = yield supabase
                    .from('workout_sessions')
                    .select('created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(60);
                if (error)
                    throw error;
                const { data: streakRow } = yield supabase
                    .from('user_streaks')
                    .select('current_streak, longest_streak, last_workout_date, last_rest_date, last_activity_date')
                    .eq('user_id', user.id)
                    .maybeSingle();
                let currentStreak = 0;
                let longestStreak = (streakRow === null || streakRow === void 0 ? void 0 : streakRow.longest_streak) || 0;
                let lastWorkoutDate = (streakRow === null || streakRow === void 0 ? void 0 : streakRow.last_workout_date) || null;
                const lastRestDate = (streakRow === null || streakRow === void 0 ? void 0 : streakRow.last_rest_date) || null;
                if (workouts && workouts.length > 0) {
                    lastWorkoutDate = lastWorkoutDate || workouts[0].created_at;
                    // Count consecutive days from today
                    const workoutDays = new Set(workouts.map(w => (0, dateUtils_1.getLocalDateString)(new Date(w.created_at))));
                    let checkDate = new Date();
                    // If today is not a workout day and not a rest day, start from yesterday
                    const todayStr = (0, dateUtils_1.getLocalDateString)(checkDate);
                    if (!workoutDays.has(todayStr) && lastRestDate !== todayStr) {
                        checkDate.setDate(checkDate.getDate() - 1);
                    }
                    while (workoutDays.has((0, dateUtils_1.getLocalDateString)(checkDate)) || (0, dateUtils_1.getLocalDateString)(checkDate) === lastRestDate) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    }
                    // Check streak freeze: if yesterday was missed but user has a streak freeze item
                    if (currentStreak === 0 && workoutDays.size > 0) {
                        try {
                            const { StoreService } = yield Promise.resolve().then(() => __importStar(require('./storeService')));
                            const hasFreeze = yield StoreService.getInstance().useStreakFreeze();
                            if (hasFreeze) {
                                // Recalculate from 2 days ago
                                checkDate = new Date();
                                checkDate.setDate(checkDate.getDate() - 2);
                                currentStreak = 1; // freeze counts as 1 day saved
                                while (workoutDays.has((0, dateUtils_1.getLocalDateString)(checkDate))) {
                                    currentStreak++;
                                    checkDate.setDate(checkDate.getDate() - 1);
                                }
                            }
                        }
                        catch (_a) { }
                    }
                    currentStreak = Math.max(currentStreak, (streakRow === null || streakRow === void 0 ? void 0 : streakRow.current_streak) || 0);
                    longestStreak = Math.max(currentStreak, longestStreak);
                }
                return {
                    currentStreak,
                    longestStreak,
                    lastWorkoutDate,
                    lastRestDate,
                    isRestDay: lastRestDate === today,
                };
            }
            catch (err) {
                LogManager_1.LogManager.getInstance().warn('Streak fetch warning:', err);
                return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, lastRestDate: null, isRestDay: false };
            }
        });
    }
    // Log a completed workout
    logWorkout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data: { user } } = yield supabase.auth.getUser();
                if (!user)
                    throw new Error('Not authenticated');
                const currentData = yield this.getStreak();
                const today = (0, dateUtils_1.getLocalDateString)();
                // If already logged today, do nothing
                // Compare date-only portion since lastWorkoutDate may be a full ISO timestamp
                const lastWorkoutDay = currentData.lastWorkoutDate
                    ? (0, dateUtils_1.getLocalDateString)(new Date(currentData.lastWorkoutDate))
                    : null;
                if (lastWorkoutDay === today)
                    return currentData;
                let newStreak = currentData.currentStreak;
                // If yesterday was a workout OR yesterday was a rest day, increment streak
                if (this.isYesterday(currentData.lastWorkoutDate) || this.isYesterday(currentData.lastRestDate)) {
                    newStreak += 1;
                }
                else if (!this.isToday(currentData.lastWorkoutDate)) {
                    // Streak broken
                    newStreak = 1;
                }
                const newLongest = Math.max(newStreak, currentData.longestStreak);
                const updateData = {
                    user_id: user.id,
                    current_streak: newStreak,
                    longest_streak: newLongest,
                    last_workout_date: today,
                    last_activity_date: today,
                    updated_at: new Date().toISOString()
                };
                const { error } = yield supabase
                    .from('user_streaks')
                    .upsert(updateData, { onConflict: 'user_id' });
                if (error)
                    throw error;
                // Update friendship streaks asynchronously in the background
                this.updateFriendshipStreaks(user.id, today).catch(e => LogManager_1.LogManager.getInstance().error('Friendship streak error:', e));
                return {
                    currentStreak: newStreak,
                    longestStreak: newLongest,
                    lastWorkoutDate: today,
                    lastRestDate: currentData.lastRestDate,
                    isRestDay: false,
                };
            }
            catch (err) {
                LogManager_1.LogManager.getInstance().error('Error logging workout:', err);
                throw err;
            }
        });
    }
    // Mark today as a planned rest day (keeps streak alive)
    setRestDay() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                const { data: { user } } = yield supabase.auth.getUser();
                if (!user)
                    throw new Error('Not authenticated');
                const today = (0, dateUtils_1.getLocalDateString)();
                const currentData = yield this.getStreak();
                // If already a rest day, do nothing
                if (currentData.lastRestDate === today)
                    return currentData;
                const { error } = yield supabase
                    .from('user_streaks')
                    .upsert({
                    user_id: user.id,
                    last_rest_date: today,
                    last_activity_date: today,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                if (error)
                    throw error;
                // Also check for mutual friendship streak updates on rest days
                this.updateFriendshipStreaks(user.id, today).catch(e => LogManager_1.LogManager.getInstance().error('Friendship streak error:', e));
                return Object.assign(Object.assign({}, currentData), { lastRestDate: today, isRestDay: true });
            }
            catch (err) {
                LogManager_1.LogManager.getInstance().error('Error setting rest day:', err);
                throw err;
            }
        });
    }
    // Update friendship streaks if both friends completed their goals
    updateFriendshipStreaks(userId, today) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const supabase = supabase_1.SupabaseService.getInstance().getClient();
                // 1. Get all accepted friendships for this user
                const { data: friendships, error: fetchError } = yield supabase
                    .from('friendships')
                    .select('*')
                    .eq('status', 'accepted')
                    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
                if (fetchError || !friendships)
                    return;
                for (const friendship of friendships) {
                    // If this friendship was already updated today, skip
                    if (friendship.last_streak_date === today)
                        continue;
                    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
                    // 2. Get friend's streak status
                    const { data: friendData } = yield supabase
                        .from('user_streaks')
                        .select('last_workout_date, last_rest_date')
                        .eq('user_id', friendId)
                        .maybeSingle();
                    if (!friendData)
                        continue;
                    // 3. Check if friend has met the daily requirement today
                    const friendMetGoal = friendData.last_workout_date === today || friendData.last_rest_date === today;
                    // If friend also met goal today, we can increment the friendship streak
                    if (friendMetGoal) {
                        let newStreak = friendship.current_streak || 0;
                        const lastStreak = friendship.last_streak_date;
                        if (this.isYesterday(lastStreak)) {
                            newStreak += 1;
                        }
                        else if (!this.isToday(lastStreak)) {
                            newStreak = 1;
                        }
                        const newLongest = Math.max(newStreak, friendship.longest_streak || 0);
                        // 4. Update the friendship
                        yield supabase
                            .from('friendships')
                            .update({
                            current_streak: newStreak,
                            longest_streak: newLongest,
                            last_streak_date: today,
                            updated_at: new Date().toISOString()
                        })
                            .eq('id', friendship.id);
                    }
                }
            }
            catch (err) {
                LogManager_1.LogManager.getInstance().error('Error updating friendship streaks:', err);
            }
        });
    }
    // Helpers
    isToday(dateString) {
        if (!dateString)
            return false;
        const today = (0, dateUtils_1.getLocalDateString)();
        const dateDay = (0, dateUtils_1.getLocalDateString)(new Date(dateString));
        return dateDay === today;
    }
    isYesterday(dateString) {
        if (!dateString)
            return false;
        const dateDay = (0, dateUtils_1.getLocalDateString)(new Date(dateString));
        return dateDay === (0, dateUtils_1.getYesterdayDateString)();
    }
}
exports.StreakService = StreakService;

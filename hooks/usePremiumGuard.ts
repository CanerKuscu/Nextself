import React, { useState } from 'react';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { SubscriptionService } from '../services/SubscriptionService';
import { useAuthStore } from '../store/authStoreSecure';

const PROFESSIONAL_ROLES = ['pt', 'dietitian', 'trainer'] as const;

/**
 * usePremiumGuard
 *
 * Checks if the user has an active Pro subscription via RevenueCat.
 * If not, and they are not a Professional, it redirects them to the Paywall screen.
 *
 * Professional roles bypass the paywall by design. We write a best-effort audit row
 * each time a professional skips a paid feature so the bypass is observable in
 * `professional_paywall_bypass_log` (created in migration 20260515090300_*).
 */
export const usePremiumGuard = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const profile = useAuthStore(state => state.profile);
    const [isPremium, setIsPremium] = useState<boolean | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const logProfessionalBypass = (userId: string, role: string) => {
                try {
                    void SupabaseService.getInstance()
                        .getClient()
                        .from('professional_paywall_bypass_log')
                        .insert({ user_id: userId, role, screen: route?.name ?? 'unknown' })
                        .then(({ error }) => {
                            if (error) {
                                console.warn('[usePremiumGuard] Bypass audit insert failed:', error.message);
                            }
                        });
                } catch (auditError) {
                    console.warn('[usePremiumGuard] Bypass audit threw:', auditError);
                }
            };

            const checkAccess = async () => {
                // Professionals bypass consumer paywalls
                if (profile?.role && (PROFESSIONAL_ROLES as ReadonlyArray<string>).includes(profile.role)) {
                    if (profile.id) {
                        logProfessionalBypass(profile.id, profile.role);
                    }
                    if (isActive) setIsPremium(true);
                    return;
                }

                const service = SubscriptionService.getInstance();
                await service.initialize(profile?.id);
                const status = await service.checkUserStatus();

                if (isActive) {
                    setIsPremium(status);
                    if (!status) {
                        // Redirect to Paywall
                        // Resetting state or popping current screen so back button behaves correctly
                        navigation.navigate('Paywall');
                    }
                }
            };

            checkAccess();

            return () => {
                isActive = false;
            };
        }, [navigation, profile?.id, profile?.role, route?.name])
    );

    return isPremium;
};

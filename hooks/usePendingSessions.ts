import { useEffect } from 'react';
import { SupabaseService } from '@nextself/shared';
import { useTranslation } from './useTranslation';

export function usePendingSessions(showAlert: any, isTurkish: boolean) {
    useEffect(() => {
        const handleApproveSession = async (sessionId: string) => {
            try {
                const { error } = await SupabaseService.getInstance().getClient()
                    .from('session_checkins')
                    .update({
                        is_verified: true,
                        checkin_time: new Date().toISOString()
                    })
                    .eq('id', sessionId);

                if (error) throw error;

                showAlert({
                    title: isTurkish ? 'Başarılı' : 'Success',
                    message: isTurkish ? 'Oturum başarıyla onaylandı!' : 'Session approved successfully!',
                    type: 'success'
                });
            } catch (err) {
                console.error(err);
                showAlert({ title: isTurkish ? 'Hata' : 'Error', message: 'Failed to approve session', type: 'error' });
            }
        };

        const handleDenySession = async (sessionId: string) => {
            try {
                const { error } = await SupabaseService.getInstance().getClient()
                    .from('session_checkins')
                    .delete()
                    .eq('id', sessionId);

                if (error) throw error;
            } catch (err) {
                console.error(err);
            }
        };

        const checkForPendingSessions = async () => {
            try {
                const supabase = SupabaseService.getInstance().getClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: relationships } = await supabase
                    .from('client_relationships')
                    .select('id, professional_profiles:professional_id(first_name, last_name), trainer_profiles:trainer_id(first_name, last_name), dietitian_profiles:dietitian_id(first_name, last_name)')
                    .eq('client_id', user.id)
                    .eq('status', 'active');

                if (!relationships || relationships.length === 0) return;

                const relIds = relationships.map((r: any) => r.id);

                const { data: sessions } = await supabase
                    .from('session_checkins')
                    .select('*')
                    .in('client_relationship_id', relIds)
                    .eq('is_verified', false)
                    .ilike('qr_token', 'REQ-%')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (sessions && sessions.length > 0) {
                    const session = sessions[0];
                    const rel = relationships.find((r: any) => r.id === session.client_relationship_id);
                    // @ts-ignore
                    const profArray = rel?.professional_profiles || rel?.trainer_profiles || rel?.dietitian_profiles;
                    const prof = Array.isArray(profArray) ? profArray[0] : profArray;
                    const profName = prof ? `${prof.first_name} ${prof.last_name || ''}` : (isTurkish ? 'Eğitmeniniz' : 'Your Trainer');

                    showAlert({
                        title: isTurkish ? 'Oturum İsteği' : 'Session Request',
                        message: isTurkish
                            ? `${profName} bir oturum başlatmak istiyor. Onaylıyor musunuz?`
                            : `${profName} wants to start a session. Do you approve?`,
                        type: 'confirm',
                        icon: 'timer-outline',
                        buttons: [
                            {
                                text: isTurkish ? 'Reddet' : 'Deny',
                                style: 'destructive',
                                onPress: () => handleDenySession(session.id)
                            },
                            {
                                text: isTurkish ? 'Onayla' : 'Approve',
                                onPress: () => handleApproveSession(session.id)
                            }
                        ]
                    });
                }
            } catch (err) {
                console.error('Check pending sessions error:', err);
            }
        };

        checkForPendingSessions();
    }, [isTurkish, showAlert]);
}

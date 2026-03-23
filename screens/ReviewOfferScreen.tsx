import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SupabaseService } from '@nextself/shared';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';
import { safeGoBack } from '../utils/navigation';

export default function ReviewOfferScreen() {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const route = useRoute();
    const { inviteData } = route.params as { inviteData: any };
    const { showAlert, AlertComponent } = useAlert();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState({
        workouts: true,
        nutrition: true,
        healthData: false,
    });

    const getServiceTypeLabel = (type: string) => {
        switch(type) {
            case 'online': return 'Uzaktan (Online)';
            case 'face_to_face': return 'Yüz Yüze';
            case 'hybrid': return 'Hibrit';
            default: return 'Yüz Yüze'; // Default legacy
        }
    };

    const handleAccept = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await SupabaseService.getInstance().getClient().auth.getUser();
            if (!user) throw new Error("Oturum bulunamadı");

            // Ensure public user record exists to prevent FK errors
            const { data: publicUser } = await SupabaseService.getInstance().getClient()
                .from('users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!publicUser) {
                console.log("Public user record missing, attempting to create...");
                const metadata = user.user_metadata || {};
                const fullName = metadata.full_name || metadata.name || '';
                // Fallback logic for required fields
                const firstName = metadata.first_name || (fullName ? fullName.split(' ')[0] : 'Member');
                const lastName = metadata.last_name || (fullName ? fullName.split(' ').slice(1).join(' ') : '');
                
                const { error: createError } = await SupabaseService.getInstance().getClient()
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        username: metadata.username || user.email?.split('@')[0] || `user_${user.id.substring(0, 6)}`,
                        first_name: firstName,
                        last_name: lastName,
                        user_type: 'user'
                    });

                if (createError) {
                    console.error("Failed to create missing public user record:", createError);
                }
            }

            // Professional Profile ID'sini bul (inviteData.ptId User ID'dir)
            const { data: profProfile, error: profError } = await SupabaseService.getInstance().getClient()
                .from('professional_profiles')
                .select('id')
                .eq('user_id', inviteData.ptId)
                .single();

            if (profError || !profProfile) {
                throw new Error("Eğitmen profili bulunamadı.");
            }

            // Client relationship oluştur (Pending Statüsünde)
            const { error: relError } = await SupabaseService.getInstance().getClient()
                .from('client_relationships')
                .insert({
                    professional_id: profProfile.id,
                    client_id: user.id,
                    agreed_price: inviteData.price,
                    duration_months: inviteData.duration,
                    service_type: inviteData.serviceType || 'face_to_face',
                    platform_fee_percent: 10,
                    billing_status: 'pending' // Eğitmen aktive edene kadar bekleyecek
                });

            if (relError) {
                // Eğer zaten eşleşmişlerse, unique constraint hatası alabiliriz
                if (relError.code === '23505') {
                    throw new Error("Bu eğitmenle zaten aktif veya bekleyen bir eşleşmeniz mevcut.");
                }
                throw relError;
            }

            // Ayrıca gizlilik ayarlarını kaydet (opsiyonel modül entegrasyonu)
            const { error: privacyError } = await SupabaseService.getInstance().getClient()
                .from('user_privacy_settings')
                .upsert({
                    user_id: user.id,
                    share_workouts_with_pt: permissions.workouts,
                    share_calories_with_dietitian: permissions.nutrition,
                    share_steps_with_pt: permissions.healthData
                }, { onConflict: 'user_id' });

            if (privacyError) console.warn("Privacy save error:", privacyError);

            showAlert({
                title: "Kabul Edildi",
                message: "Teklif onaylandı. Seçtiğiniz hizmet detayları eğitmeninize iletildi. Eğitmeniniz hesabınızı aktif ettiğinde takip başlayacaktır.",
                type: "success",
                buttons: [{ text: "Tamam", onPress: () => navigation.navigate('Home' as never) }]
            });

        } catch (error: any) {
            showAlert({ title: "Hata", message: error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <ScrollView style={styles.container}>
            <AlertComponent />
            <Text style={styles.title}>Hizmet Teklifi ve Onay</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Hizmet Detayları</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hizmet Tipi:</Text>
                    <Text style={styles.detailValue}>{getServiceTypeLabel(inviteData.serviceType)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Anlaşılan Ücret:</Text>
                    <Text style={styles.detailValue}>{inviteData.price} TL</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hizmet Süresi (Paket):</Text>
                    <Text style={styles.detailValue}>{inviteData.duration} Ay</Text>
                </View>

                <Text style={styles.infoText}>
                    Eğitmeniniz ({inviteData.ptId.substring(0, 8)}...) tarafından gönderilen bu daveti onayladığınızda takipleriniz ve program atamalarınız bu süre boyunca yapılacaktır.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Veri Paylaşım İzinleri</Text>
                <Text style={styles.infoText}>Eğitmeninizin/Diyetisyeninizin hangi sağlık ve aktivite verilerinizi görebileceğini seçin:</Text>

                <View style={styles.switchRow}>
                    <View style={styles.switchTextContainer}>
                        <Text style={styles.switchLabel}>Antrenman Verileri</Text>
                        <Text style={styles.switchDescription}>Tamamlanan setler, ağırlıklar, ve egzersiz yorumları</Text>
                    </View>
                    <Switch
                        value={permissions.workouts}
                        onValueChange={() => togglePermission('workouts')}
                        trackColor={{ false: "#d1d5db", true: "#818cf8" }}
                        thumbColor={permissions.workouts ? "#4f46e5" : "#f3f4f6"}
                    />
                </View>

                <View style={styles.switchRow}>
                    <View style={styles.switchTextContainer}>
                        <Text style={styles.switchLabel}>Beslenme Verileri</Text>
                        <Text style={styles.switchDescription}>Kalori takibi, makrolar ve taranan öğünler</Text>
                    </View>
                    <Switch
                        value={permissions.nutrition}
                        onValueChange={() => togglePermission('nutrition')}
                        trackColor={{ false: "#d1d5db", true: "#818cf8" }}
                        thumbColor={permissions.nutrition ? "#4f46e5" : "#f3f4f6"}
                    />
                </View>

                <View style={styles.switchRow}>
                    <View style={styles.switchTextContainer}>
                        <Text style={styles.switchLabel}>Sağlık & Apple/Google Fit</Text>
                        <Text style={styles.switchDescription}>Adım sayacı, uyku ve nabız ölçümleri</Text>
                    </View>
                    <Switch
                        value={permissions.healthData}
                        onValueChange={() => togglePermission('healthData')}
                        trackColor={{ false: "#d1d5db", true: "#818cf8" }}
                        thumbColor={permissions.healthData ? "#4f46e5" : "#f3f4f6"}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptButtonText}>Kabul Et ve Onayla</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => safeGoBack(navigation, 'Home')}
                disabled={loading}
            >
                <Text style={styles.cancelButtonText}>Reddet</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    detailLabel: { fontSize: 16, color: '#4b5563' },
    detailValue: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },
    infoText: { fontSize: 13, color: '#6b7280', marginTop: 10, lineHeight: 18 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    switchTextContainer: { flex: 1, paddingRight: 15 },
    switchLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
    switchDescription: { fontSize: 12, color: '#9ca3af' },
    acceptButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cancelButton: { backgroundColor: 'transparent', padding: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
    cancelButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});

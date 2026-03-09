import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import CustomAlert, { useAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

// Bu ekran "Client Home Tab" veya "Course Detail" ekranlarına girerken 
// billing_status === 'suspended_payment' ise yönlendirilecek olan ekrandır.
export default function ClientSuspendedScreen() {
    const navigation = useNavigation();
    const { t } = useLanguage();
    const { showAlert, AlertComponent } = useAlert();

    return (
        <View style={styles.container}>
            <AlertComponent />
            <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={80} color="#ef4444" />
            </View>

            <Text style={styles.title}>{t('suspended_title')}</Text>

            <Text style={styles.description}>
                {t('suspended_desc')}
            </Text>

            <Text style={styles.subDescription}>
                {t('suspended_subdesc')}
            </Text>

            <TouchableOpacity style={styles.contactBtn} onPress={() => {
                // Gerçek senaryoda burası eğitmenin WhatsApp numarasına veya mesajlara atabilir.
                showAlert({ title: t('info'), message: t('suspended_contact_alert'), type: 'info' });
            }}>
                <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>{t('contact_trainer')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                // signOut logicle yönlendirilebilir
                navigation.navigate('Auth' as never);
            }}>
                <Text style={styles.logoutBtnText}>{t('signOut')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fef2f2', // Açık kırmızı arka plan
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#991b1b',
        textAlign: 'center',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: '#7f1d1d',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    subDescription: {
        fontSize: 14,
        color: '#b91c1c',
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: 40,
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    contactBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    logoutBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fca5a5',
        alignItems: 'center',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    }
});

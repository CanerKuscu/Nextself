import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../locales/i18n';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  ];

  const handleLanguageSelect = (langCode: Language) => {
    setLanguage(langCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('language')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                language === lang.code && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(lang.code as Language)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{lang.nativeName}</Text>
                <Text style={styles.languageSubtitle}>{lang.name}</Text>
              </View>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedLanguage: {
    backgroundColor: '#EEF2FF',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default LanguageSelector;

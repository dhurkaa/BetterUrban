import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Switch,
  KeyboardAvoidingView,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from './utils/theme';
import { useLanguage } from './utils/language';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { theme, themeMode, changeTheme, isDarkMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();

  // ✅ DYNAMIC STYLES (theme-aware)
  const styles = getStyles(theme, isDarkMode);
  const modalStyles = getModalStyles(theme, isDarkMode);

  // State for loading and modals
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentModal, setCurrentModal] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedTheme, setSelectedTheme] = useState(themeMode);
  const [selectedPrivacy, setSelectedPrivacy] = useState('friends');
  const [selectedFontSize, setSelectedFontSize] = useState('medium');

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  useEffect(() => {
    setSelectedTheme(themeMode);
  }, [themeMode]);

  // User settings state
  const [settings, setSettings] = useState({
    profile: {
      name: 'Dhurim Citak',
      email: 'dhurim@betterurban.com',
      phone: '+383 49 123 456',
      bio: 'Mbikëqyrës Urban | Duke e bërë qytetin më të mirë për të gjithë',
      location: 'Prishtinë, Kosovë',
      profileImage: null,
    },

    notifications: {
      enabled: true,
      emailNotifications: true,
      pushNotifications: true,
      reportUpdates: true,
      nearbyReports: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },

    preferences: {
      theme: 'system',
      language: 'sq',
      fontSize: 'medium',
      dataSaver: false,
      highContrast: false,
      reduceMotion: false,
    },

    privacy: {
      profileVisibility: 'friends',
      showOnlineStatus: true,
      allowTagging: true,
      dataSharing: false,
      personalizedAds: false,
    },

    security: {
      twoFactorAuth: false,
      biometricLogin: true,
      autoLock: '1min',
    },
  });

  const [isModified, setIsModified] = useState(false);
  const [appVersion] = useState(Constants.expoConfig?.version || '1.0.0');
  const [buildNumber] = useState(
    Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode ||
      '1'
  );

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted' || cameraStatus.status !== 'granted') {
        Alert.alert(
          'Leje të Nevojshme',
          'Aplikacioni ka nevojë për leje për të hyrë në galeri dhe kamerë për të ndryshuar fotot e profilit.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load settings from AsyncStorage
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);

        // Update current selections
        setSelectedLanguage(parsedSettings.preferences?.language || 'sq');
        setSelectedTheme(parsedSettings.preferences?.theme || 'system');
        setSelectedFontSize(parsedSettings.preferences?.fontSize || 'medium');
        setSelectedPrivacy(parsedSettings.privacy?.profileVisibility || 'friends');
      }

      // Load user name separately if exists
      const userName = await AsyncStorage.getItem('userName');
      if (userName && userName !== settings.profile.name) {
        setSettings((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: userName,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      // Save to AsyncStorage
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));

      // Save user name separately for other components to use
      await AsyncStorage.setItem('userName', settings.profile.name);

      // Save profile data
      await AsyncStorage.setItem('userProfileData', JSON.stringify(settings.profile));

      setIsModified(false);

      Alert.alert('Sukses', 'Cilësimet u ruajtën me sukses!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë ruajtjes së cilësimeve');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setIsModified(true);
  };

  const handleToggle = (section, field) => {
    const currentValue = settings[section]?.[field];
    handleSettingChange(section, field, !currentValue);
  };

  const handleSelect = async (section, field, value) => {
    // Update local app settings state
    handleSettingChange(section, field, value);

    // Update local selection UI
    switch (field) {
      case 'language':
        setSelectedLanguage(value);
        // IMPORTANT: Apply app language immediately
        await changeLanguage(value); // writes appLanguage in AsyncStorage
        break;

      case 'theme':
        setSelectedTheme(value);
        // IMPORTANT: Apply app theme immediately
        await changeTheme(value); // writes appTheme in AsyncStorage
        break;

      case 'fontSize':
        setSelectedFontSize(value);
        break;

      case 'profileVisibility':
        setSelectedPrivacy(value);
        break;
    }
  };

  const openModal = (modalName) => {
    setCurrentModal(modalName);
  };

  const closeModal = () => {
    setCurrentModal(null);
  };

  const handleImagePicker = async (source) => {
    try {
      let result;

      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        setUploading(true);
        const imageUri = result.assets[0].uri;

        // Save the image
        handleSettingChange('profile', 'profileImage', imageUri);

        closeModal();
        setUploading(false);

        Alert.alert('Sukses', 'Fotoja e profilit u përditësua!', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error with image picker:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë përzgjedhjes së fotos');
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Dilni nga Llogaria', 'Jeni të sigurtë që dëshironi të dilni nga llogaria juaj?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Dil',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear auth data only
            await AsyncStorage.multiRemove(['userToken', 'sessionData']);

            // Navigate to login
            router.replace('/login');
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Fshi Llogarinë', 'Kjo veprim do të fshijë përgjithmonë të gjitha të dhënat tuaja. Jeni të sigurtë?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshi',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Clear all data
            await AsyncStorage.clear();

            Alert.alert('Llogaria u Fshi', 'Llogaria juaj u fshi me sukses.', [
              { text: 'OK', onPress: () => router.replace('/welcome') },
            ]);
          } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Gabim', 'Ndodhi një gabim gjatë fshirjes së llogarisë');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleClearCache = async () => {
    Alert.alert('Pastro Cache', 'Dëshironi të pastroni të gjitha të dhënat e cache?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Pastro',
        onPress: async () => {
          try {
            // Clear specific cache items
            await AsyncStorage.multiRemove(['reportsCache', 'mapCache', 'imagesCache']);

            Alert.alert('Sukses', 'Cache u pastrua me sukses!', [{ text: 'OK' }]);
          } catch (error) {
            console.error('Error clearing cache:', error);
          }
        },
      },
    ]);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Kopjuar', 'Teksti u kopjua në clipboard');
  };

  const openExternalLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  // ✅ Simple Modal Components (theme-aware)
  const SelectionModal = ({ title, options, selectedValue, onSelect, onClose }) => {
    return (
      <Modal animationType="slide" transparent={true} visible={true} onRequestClose={onClose}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={modalStyles.optionsList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    modalStyles.option,
                    index === options.length - 1 && modalStyles.lastOption,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                >
                  <View style={modalStyles.optionLeft}>
                    {option.icon && (
                      <MaterialIcons
                        name={option.icon}
                        size={22}
                        color={selectedValue === option.value ? theme.colors.primary : theme.colors.textSecondary}
                      />
                    )}
                    <View style={modalStyles.optionTexts}>
                      <Text
                        style={[
                          modalStyles.optionLabel,
                          selectedValue === option.value && modalStyles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text style={modalStyles.optionDescription}>{option.description}</Text>
                      )}
                    </View>
                  </View>

                  {selectedValue === option.value && (
                    <MaterialIcons name="check" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render modals
  const renderModals = () => {
    if (!currentModal) return null;

    switch (currentModal) {
      case 'imagePicker':
        return (
          <Modal animationType="slide" transparent={true} visible={true} onRequestClose={closeModal}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Zgjidhni një foto</Text>
                  <TouchableOpacity onPress={closeModal}>
                    <MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalOptions}>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleImagePicker('camera')}
                    disabled={uploading}
                  >
                    <View style={[styles.modalIcon, { backgroundColor: theme.colors.primary }]}>
                      <MaterialIcons name="camera-alt" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.modalOptionText}>Bëj Foto</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleImagePicker('gallery')}
                    disabled={uploading}
                  >
                    <View style={[styles.modalIcon, { backgroundColor: '#10B981' }]}>
                      <MaterialIcons name="photo-library" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={styles.modalOptionText}>Zgjidh nga Galeria</Text>
                  </TouchableOpacity>
                </View>

                {uploading && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.uploadingText}>Po ngarkohet...</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Anulo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );

      case 'language':
        return (
          <SelectionModal
            title="Zgjidhni Gjuhën"
            options={[
              { value: 'sq', label: 'Shqip', icon: 'flag' },
              { value: 'en', label: 'English', icon: 'language' },
            ]}
            selectedValue={selectedLanguage}
            onSelect={(value) => handleSelect('preferences', 'language', value)}
            onClose={closeModal}
          />
        );

      case 'theme':
        return (
          <SelectionModal
            title="Zgjidhni Temën"
            options={[
              { value: 'light', label: 'E Çelët', icon: 'wb-sunny' },
              { value: 'dark', label: 'E Errët', icon: 'nights-stay' },
              { value: 'system', label: 'Sistemi', icon: 'settings' },
            ]}
            selectedValue={selectedTheme}
            onSelect={(value) => handleSelect('preferences', 'theme', value)}
            onClose={closeModal}
          />
        );

      case 'privacy':
        return (
          <SelectionModal
            title="Privatësia e Profilit"
            options={[
              { value: 'public', label: 'Publik', description: 'Të gjithë mund të shohin' },
              { value: 'friends', label: 'Miq', description: 'Vetëm miqtë tuaj' },
              { value: 'private', label: 'Privat', description: 'Vetëm ju' },
            ]}
            selectedValue={selectedPrivacy}
            onSelect={(value) => handleSelect('privacy', 'profileVisibility', value)}
            onClose={closeModal}
          />
        );

      case 'fontSize':
        return (
          <SelectionModal
            title="Madhësia e Fontit"
            options={[
              { value: 'small', label: 'E Vogël', description: 'A+' },
              { value: 'medium', label: 'Normale', description: 'A++' },
              { value: 'large', label: 'E Madhe', description: 'A+++' },
            ]}
            selectedValue={selectedFontSize}
            onSelect={(value) => handleSelect('preferences', 'fontSize', value)}
            onClose={closeModal}
          />
        );

      default:
        return null;
    }
  };

  // Loading screen
  if (loading && !isModified) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Duke ngarkuar cilësimet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Switch colors (theme-aware)
  const switchTrack = {
    false: theme.colors.border,
    true: theme.colors.primary + '55',
  };
  const switchThumb = (val) => (val ? theme.colors.primary : theme.colors.textTertiary);

  // Render UI
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Cilësimet</Text>

          <TouchableOpacity
            style={styles.headerAction}
            onPress={saveSettings}
            disabled={!isModified || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  !isModified && styles.saveButtonTextDisabled,
                ]}
              >
                Ruaj
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Profili</Text>

            <TouchableOpacity style={styles.profileHeader} onPress={() => openModal('imagePicker')}>
              <View style={styles.profileImageContainer}>
                {settings.profile.profileImage ? (
                  <Image source={{ uri: settings.profile.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileInitials}>
                      {settings.profile.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.editPhotoBadge}>
                  <MaterialIcons name="edit" size={14} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{settings.profile.name}</Text>
                <Text style={styles.profileEmail}>{settings.profile.email}</Text>
                <Text style={styles.profileRole}>{settings.profile.bio}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.inputGrid}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Emri</Text>
                <TextInput
                  style={styles.input}
                  value={settings.profile.name}
                  onChangeText={(text) => handleSettingChange('profile', 'name', text)}
                  placeholder="Emri"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={settings.profile.email}
                  onChangeText={(text) => handleSettingChange('profile', 'email', text)}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Telefoni</Text>
                <TextInput
                  style={styles.input}
                  value={settings.profile.phone}
                  onChangeText={(text) => handleSettingChange('profile', 'phone', text)}
                  placeholder="Telefoni"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Lokacioni</Text>
                <TextInput
                  style={styles.input}
                  value={settings.profile.location}
                  onChangeText={(text) => handleSettingChange('profile', 'location', text)}
                  placeholder="Lokacioni"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={settings.profile.bio}
                onChangeText={(text) => handleSettingChange('profile', 'bio', text)}
                placeholder="Përshkrimi i shkurtër për veten..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Njoftimet</Text>
              <Switch
                value={settings.notifications.enabled}
                onValueChange={() => handleToggle('notifications', 'enabled')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.notifications.enabled)}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="email" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Email Notifications</Text>
              </View>
              <Switch
                value={settings.notifications.emailNotifications}
                onValueChange={() => handleToggle('notifications', 'emailNotifications')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.notifications.emailNotifications)}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="notifications" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={settings.notifications.pushNotifications}
                onValueChange={() => handleToggle('notifications', 'pushNotifications')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.notifications.pushNotifications)}
              />
            </View>

            <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="description" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Përditësime Raportesh</Text>
              </View>
              <Switch
                value={settings.notifications.reportUpdates}
                onValueChange={() => handleToggle('notifications', 'reportUpdates')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.notifications.reportUpdates)}
              />
            </View>
          </View>

          {/* App Preferences */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Preferencat e Aplikacionit</Text>

            <TouchableOpacity style={styles.selectionItem} onPress={() => openModal('theme')}>
              <View style={styles.selectionLeft}>
                <MaterialIcons name="palette" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.selectionLabel}>Tema</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>
                  {selectedTheme === 'system'
                    ? 'Sistemi'
                    : selectedTheme === 'light'
                    ? 'E Çelët'
                    : 'E Errët'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectionItem} onPress={() => openModal('language')}>
              <View style={styles.selectionLeft}>
                <MaterialIcons name="language" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.selectionLabel}>Gjuha</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>
                  {selectedLanguage === 'sq' ? 'Shqip' : selectedLanguage === 'en' ? 'English' : 'Српски'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectionItem} onPress={() => openModal('fontSize')}>
              <View style={styles.selectionLeft}>
                <MaterialIcons name="format-size" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.selectionLabel}>Madhësia e Fontit</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>
                  {selectedFontSize === 'small'
                    ? 'E Vogël'
                    : selectedFontSize === 'medium'
                    ? 'Normale'
                    : 'E Madhe'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="data-saver-off" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Kursim Të Dhënash</Text>
              </View>
              <Switch
                value={settings.preferences.dataSaver}
                onValueChange={() => handleToggle('preferences', 'dataSaver')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.preferences.dataSaver)}
              />
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Privatësia</Text>

            <TouchableOpacity style={styles.selectionItem} onPress={() => openModal('privacy')}>
              <View style={styles.selectionLeft}>
                <MaterialIcons name="visibility" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.selectionLabel}>Dukshmëria e Profilit</Text>
              </View>
              <View style={styles.selectionRight}>
                <Text style={styles.selectionValue}>
                  {selectedPrivacy === 'public' ? 'Publik' : selectedPrivacy === 'friends' ? 'Miq' : 'Privat'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="online-prediction" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Statusi Online</Text>
              </View>
              <Switch
                value={settings.privacy.showOnlineStatus}
                onValueChange={() => handleToggle('privacy', 'showOnlineStatus')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.privacy.showOnlineStatus)}
              />
            </View>

            <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="tag" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Lejo Tagging</Text>
              </View>
              <Switch
                value={settings.privacy.allowTagging}
                onValueChange={() => handleToggle('privacy', 'allowTagging')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.privacy.allowTagging)}
              />
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Siguria</Text>

            <View style={styles.toggleItem}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="security" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Autentifikim me 2 Faktorë</Text>
              </View>
              <Switch
                value={settings.security.twoFactorAuth}
                onValueChange={() => handleToggle('security', 'twoFactorAuth')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.security.twoFactorAuth)}
              />
            </View>

            <View style={[styles.toggleItem, { borderBottomWidth: 0 }]}>
              <View style={styles.toggleLeft}>
                <MaterialIcons name="fingerprint" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.toggleLabel}>Hyrje me Biometrik</Text>
              </View>
              <Switch
                value={settings.security.biometricLogin}
                onValueChange={() => handleToggle('security', 'biometricLogin')}
                trackColor={switchTrack}
                thumbColor={switchThumb(settings.security.biometricLogin)}
              />
            </View>
          </View>

          {/* Support & About */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ndihmë & Rre Nesh</Text>

            <TouchableOpacity style={styles.supportItem} onPress={() => openExternalLink('https://help.betterurban.com')}>
              <MaterialIcons name="help-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.supportLabel}>Qendra e Ndihmës</Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportItem} onPress={() => openExternalLink('mailto:support@betterurban.com')}>
              <MaterialIcons name="contact-support" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.supportLabel}>Na Kontaktoni</Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportItem} onPress={() => openExternalLink('https://betterurban.com/terms')}>
              <MaterialIcons name="description" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.supportLabel}>Kushtet e Shërbimit</Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.appInfo}>
              <Text style={styles.appInfoTitle}>BetterUrban</Text>
              <Text style={styles.appInfoVersion}>
                Version {appVersion} (Build {buildNumber})
              </Text>
              <Text style={styles.appInfoCopyright}>
                © 2024 BetterUrban. Të gjitha të drejtat e rezervuara.
              </Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerSectionTitle}>Zona e Rrezikut</Text>

            <TouchableOpacity style={styles.dangerButton} onPress={handleClearCache}>
              <MaterialIcons name="delete-sweep" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.dangerButtonText}>Pastro Cache</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.dangerButtonText}>Dil nga Llogaria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dangerButton, styles.deleteButton]} onPress={handleDeleteAccount}>
              <MaterialIcons name="delete-forever" size={22} color={theme.colors.danger} />
              <Text style={[styles.dangerButtonText, { color: theme.colors.danger }]}>
                Fshi Llogarinë
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Render active modal */}
      {renderModals()}
    </SafeAreaView>
  );
}

/**
 * ✅ Theme-aware Styles
 * NOTE: theme.colors MUST include:
 * background, cardBackground, surface, border,
 * textPrimary, textSecondary, textTertiary,
 * primary, danger
 */
function getStyles(theme, isDarkMode) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: { flex: 1 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: theme.colors.textSecondary },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary },
    headerAction: { padding: 8 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    saveButtonTextDisabled: { color: theme.colors.textTertiary },

    sectionCard: {
      backgroundColor: theme.colors.cardBackground,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.15 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },

    profileHeader: { flexDirection: 'row', marginBottom: 24 },
    profileImageContainer: { position: 'relative', marginRight: 16 },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: theme.colors.border,
    },
    profileImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.border,
    },
    profileInitials: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
    editPhotoBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.cardBackground,
    },

    profileInfo: { flex: 1, justifyContent: 'center' },
    profileName: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
    profileEmail: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 },
    profileRole: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 },

    inputGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    inputContainer: { width: '48%', marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 8 },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },

    bioContainer: { marginBottom: 0 },
    textArea: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.textPrimary,
      minHeight: 100,
      paddingTop: 12,
      textAlignVertical: 'top',
    },

    toggleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleLabel: { fontSize: 16, color: theme.colors.textPrimary },

    selectionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    selectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    selectionLabel: { fontSize: 16, color: theme.colors.textPrimary },
    selectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    selectionValue: { fontSize: 14, color: theme.colors.textSecondary },

    supportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    supportLabel: { flex: 1, fontSize: 16, color: theme.colors.textPrimary },

    appInfo: {
      alignItems: 'center',
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 12,
    },
    appInfoTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
    appInfoVersion: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 4 },
    appInfoCopyright: { fontSize: 12, color: theme.colors.textTertiary, textAlign: 'center' },

    dangerSection: {
      backgroundColor: theme.colors.cardBackground,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 24,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.15 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme.colors.border,
    },
    dangerSectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.danger, marginBottom: 20 },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    deleteButton: { borderBottomWidth: 0 },
    dangerButtonText: { flex: 1, fontSize: 16, color: theme.colors.textSecondary, fontWeight: '500' },

    bottomSpacer: { height: 100 },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme.colors.border,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary },
    modalOptions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    modalOption: {
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      minWidth: 140,
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme.colors.border,
    },
    modalIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    modalOptionText: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    uploadingContainer: { alignItems: 'center', paddingVertical: 20 },
    uploadingText: { marginTop: 8, fontSize: 14, color: theme.colors.textSecondary },
    cancelButton: { paddingVertical: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.colors.danger },
  });
}

function getModalStyles(theme, isDarkMode) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 20,
      width: width * 0.9,
      maxHeight: '80%',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: { fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary },
    optionsList: { maxHeight: 400 },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastOption: { borderBottomWidth: 0 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    optionTexts: { flex: 1 },
    optionLabel: { fontSize: 16, color: theme.colors.textPrimary, marginBottom: 4 },
    optionLabelSelected: { color: theme.colors.primary, fontWeight: '600' },
    optionDescription: { fontSize: 14, color: theme.colors.textSecondary },
  });
}

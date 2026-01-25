import React, { useEffect, useMemo, useState } from 'react';
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
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: null,
    bio: '',
    location: '',
    // stats placeholders (mund t’i lidhësh me API më vonë)
    listings: 0,
    followers: 0,
    rating: 0,
  });

  // vetëm ndryshimet gjatë edit
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    (async () => {
      await requestPermissions();
      await loadUserData();
    })();
  }, []);

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== 'web') {
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (lib.status !== 'granted') {
          Alert.alert('Leje e nevojshme', 'Na duhen lejet për të hyrë në galeri.');
        }
      }
    } catch (e) {
      // s’e bllokojmë app-in për permissions
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem('userProfileData');
      const name = (await AsyncStorage.getItem('userName')) || '';
      const email = (await AsyncStorage.getItem('userEmail')) || '';

      if (stored) {
        const parsed = JSON.parse(stored);
        setUserData(prev => ({
          ...prev,
          ...parsed,
          name: parsed?.name || name || 'Dhurim Citaku',
          email: parsed?.email || email || 'dhurim@example.com',
        }));
      } else {
        setUserData(prev => ({
          ...prev,
          name: name || 'Dhurim Citaku',
          email: email || 'dhurim@example.com',
          listings: 12,
          followers: 248,
          rating: 4.8,
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Gabim', 'Nuk u arrit të ngarkohen të dhënat e profilit.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const mergedData = useMemo(() => ({ ...userData, ...editedData }), [userData, editedData]);

  const initials = useMemo(() => {
    const n = (mergedData.name || '').trim();
    if (!n) return 'U';
    const parts = n.split(' ').filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const second = parts.length > 1 ? parts[1]?.[0] : '';
    return (first + second).toUpperCase();
  }, [mergedData.name]);

  const toggleEdit = () => {
    if (saving || uploading) return;
    if (isEditing) {
      // nëse është editing, mos e fik pa e ruajt ose cancel (për të mos humb data)
      return;
    }
    setEditedData({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (saving || uploading) return;
    setEditedData({});
    setIsEditing(false);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const updated = { ...userData, ...editedData };

      // validime minimale
      if (!updated.name || updated.name.trim().length < 2) {
        Alert.alert('Gabim', 'Emri duhet të ketë të paktën 2 karaktere.');
        return;
      }
      if (!updated.email || !updated.email.includes('@')) {
        Alert.alert('Gabim', 'Email nuk është valid.');
        return;
      }

      await AsyncStorage.setItem('userProfileData', JSON.stringify(updated));
      if (updated.name) await AsyncStorage.setItem('userName', updated.name);
      if (updated.email) await AsyncStorage.setItem('userEmail', updated.email);

      setUserData(updated);
      setEditedData({});
      setIsEditing(false);

      Alert.alert('Sukses', 'Profili u ruajt me sukses!');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë ruajtjes së profilit.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        setUploading(true);
        const uri = result.assets[0].uri;

        // simulim upload (zëvendësoje me API kur ta kesh)
        await new Promise(r => setTimeout(r, 700));

        setEditedData(prev => ({ ...prev, profileImage: uri }));
        setImageModalVisible(false);
        if (!isEditing) setIsEditing(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë zgjedhjes së fotos.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== 'granted') {
        Alert.alert('Leje e nevojshme', 'Na duhen lejet për kamerën.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled) {
        setUploading(true);
        const uri = result.assets[0].uri;

        await new Promise(r => setTimeout(r, 700));

        setEditedData(prev => ({ ...prev, profileImage: uri }));
        setImageModalVisible(false);
        if (!isEditing) setIsEditing(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë bërjes së fotos.');
    } finally {
      setUploading(false);
    }
  };

  const renderImagePickerModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={imageModalVisible}
      onRequestClose={() => setImageModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ndrysho foton</Text>
            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalOptions}>
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto} disabled={uploading}>
              <View style={[styles.modalIcon, { backgroundColor: '#2563EB' }]}>
                <MaterialIcons name="camera-alt" size={26} color="#fff" />
              </View>
              <Text style={styles.modalOptionText}>Kamerë</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={pickImage} disabled={uploading}>
              <View style={[styles.modalIcon, { backgroundColor: '#10B981' }]}>
                <MaterialIcons name="photo-library" size={26} color="#fff" />
              </View>
              <Text style={styles.modalOptionText}>Galeria</Text>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.uploadingText}>Duke përditësuar...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={() => setImageModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Mbyll</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Duke ngarkuar profilin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Profili</Text>

            {!isEditing ? (
              <TouchableOpacity style={styles.headerActionBtn} onPress={toggleEdit}>
                <Text style={styles.headerActionText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 56 }} />
            )}
          </View>

          {/* Hero / Profile Card */}
          <View style={styles.hero}>
            <View style={styles.profileCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarWrap}>
                  {mergedData.profileImage ? (
                    <Image source={{ uri: mergedData.profileImage }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.initials}>{initials}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.avatarEditBtn}
                    onPress={() => setImageModalVisible(true)}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="camera" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.nameBlock}>
                  {!isEditing ? (
                    <>
                      <Text style={styles.nameText}>{mergedData.name}</Text>
                      <Text style={styles.emailText}>{mergedData.email}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.inputLabel}>Emri</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={mergedData.name}
                        onChangeText={t => handleInputChange('name', t)}
                        placeholder="Emri dhe mbiemri"
                      />
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={mergedData.email}
                        onChangeText={t => handleInputChange('email', t)}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </>
                  )}
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mergedData.listings ?? 0}</Text>
                  <Text style={styles.statLabel}>Listings</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mergedData.followers ?? 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{mergedData.rating ?? 0}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>

              {/* Bio */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bio</Text>
                  <FontAwesome5 name="user-edit" size={14} color="#6B7280" />
                </View>

                {!isEditing ? (
                  <Text style={styles.sectionText}>
                    {mergedData.bio?.trim()
                      ? mergedData.bio
                      : 'Shto një bio të shkurtër që njerëzit të të njohin më mirë.'}
                  </Text>
                ) : (
                  <TextInput
                    style={[styles.textArea, { marginTop: 10 }]}
                    value={mergedData.bio}
                    onChangeText={t => handleInputChange('bio', t)}
                    placeholder="Përshkrim i shkurtër..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              </View>

              {/* Contact */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Kontakt</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <MaterialIcons name="phone" size={18} color="#6B7280" />
                    <Text style={styles.infoLabel}>Telefon</Text>
                  </View>

                  {!isEditing ? (
                    <Text style={styles.infoValue}>{mergedData.phone?.trim() ? mergedData.phone : '—'}</Text>
                  ) : (
                    <TextInput
                      style={styles.infoInput}
                      value={mergedData.phone}
                      onChangeText={t => handleInputChange('phone', t)}
                      placeholder="+383 XX XXX XXX"
                      keyboardType="phone-pad"
                    />
                  )}
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <MaterialIcons name="location-on" size={18} color="#6B7280" />
                    <Text style={styles.infoLabel}>Lokacioni</Text>
                  </View>

                  {!isEditing ? (
                    <Text style={styles.infoValue}>
                      {mergedData.location?.trim() ? mergedData.location : '—'}
                    </Text>
                  ) : (
                    <TextInput
                      style={styles.infoInput}
                      value={mergedData.location}
                      onChangeText={t => handleInputChange('location', t)}
                      placeholder="p.sh. Mitrovicë"
                    />
                  )}
                </View>
              </View>

              {/* Actions (vetëm në edit mode) */}
              {isEditing && (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={saving || uploading}>
                    <Text style={styles.cancelBtnText}>Anulo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving || uploading}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Ruaj</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Quick Links (jo settings brenda – vetëm navigim) */}
          <View style={styles.quickLinks}>
            <Text style={styles.quickTitle}>Më shumë</Text>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/settings')}>
              <View style={styles.linkLeft}>
                <MaterialIcons name="settings" size={20} color="#4B5563" />
                <Text style={styles.linkText}>Settings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/my_listings')}>
              <View style={styles.linkLeft}>
                <MaterialIcons name="inventory" size={20} color="#4B5563" />
                <Text style={styles.linkText}>My Listings</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/messages')}>
              <View style={styles.linkLeft}>
                <MaterialIcons name="chat" size={20} color="#4B5563" />
                <Text style={styles.linkText}>Messages</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {renderImagePickerModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },

  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: { padding: 8, borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  headerActionText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },

  hero: { paddingHorizontal: 16, paddingTop: 16 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  avatarRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#E5E7EB' },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  initials: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  nameBlock: { flex: 1, paddingTop: 2 },
  nameText: { fontSize: 20, fontWeight: '800', color: '#111827' },
  emailText: { marginTop: 4, fontSize: 13, color: '#6B7280' },

  inputLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  inlineInput: {
    marginTop: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },

  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: 14,
    overflow: 'hidden',
  },
  statItem: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#FBFDFF' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { marginTop: 2, fontSize: 12, color: '#6B7280', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#EEF2F7' },

  sectionBlock: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  sectionText: { marginTop: 10, fontSize: 13.5, color: '#4B5563', lineHeight: 20 },

  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 96,
  },

  infoRow: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  infoValue: { fontSize: 13.5, color: '#111827', fontWeight: '700' },
  infoInput: {
    minWidth: 150,
    textAlign: 'right',
    fontSize: 13.5,
    color: '#111827',
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: '#4B5563' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  quickLinks: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
  },
  quickTitle: { padding: 14, fontSize: 14, fontWeight: '800', color: '#111827' },
  linkRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { fontSize: 14, fontWeight: '700', color: '#374151' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  modalOption: {
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  modalIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { fontSize: 13, fontWeight: '800', color: '#374151' },
  uploadingContainer: { alignItems: 'center', paddingVertical: 18 },
  uploadingText: { marginTop: 8, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
});

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveReport } from './utils/storage';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function NewReport() {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [locationDetails, setLocationDetails] = useState(null);
  const router = useRouter();

  // =========================
  // ✅ NEW: Draft Autosave / Restore (matches Dashboard "continueDraft")
  // =========================
  const DRAFT_KEY = 'reportDraft';
  const restorePromptShown = useRef(false);
  const draftSaveTimer = useRef(null);

  const hasAnyDraftData = (d) => {
    if (!d) return false;
    return !!(
      (d.title && d.title.trim()) ||
      (d.description && d.description.trim()) ||
      d.image ||
      d.category ||
      d.priority ||
      d.locationDetails
    );
  };

  const saveDraft = async (draft) => {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  };

  const loadDraft = async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const applyDraftToForm = (draft) => {
    setTitle(draft?.title || '');
    setDescription(draft?.description || '');
    setImage(draft?.image || null);
    setCategory(draft?.category || null);
    setPriority(draft?.priority || 'normal');
    setLocationDetails(draft?.locationDetails || null);
  };

  useEffect(() => {
    // Prompt restore only once when screen mounts
    if (restorePromptShown.current) return;
    restorePromptShown.current = true;

    (async () => {
      const draft = await loadDraft();
      if (!hasAnyDraftData(draft)) return;

      Alert.alert(
        'Draft i Ruajtur',
        'Keni një raport të papërfunduar. A dëshironi ta vazhdoni?',
        [
          {
            text: 'Fshi Draft-in',
            style: 'destructive',
            onPress: async () => {
              await clearDraft();
            }
          },
          {
            text: 'Vazhdo',
            onPress: () => {
              applyDraftToForm(draft);
            }
          },
          { text: 'Anulo', style: 'cancel' }
        ]
      );
    })();
  }, []);

  useEffect(() => {
    // Debounced autosave
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);

    draftSaveTimer.current = setTimeout(async () => {
      const draft = {
        title,
        description,
        image,
        category,
        priority,
        locationDetails,
        timestamp: new Date().toISOString(),
      };

      if (!hasAnyDraftData(draft)) {
        await clearDraft();
        return;
      }

      await saveDraft(draft);
    }, 650);

    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [title, description, image, category, priority, locationDetails]);
  // =========================
  // END Draft Autosave / Restore
  // =========================

  // ✅ IDs duhet të përputhen me Dashboard: infrastructure/environment/security/other
  const categories = [
    { id: 'infrastructure', label: 'Infrastrukturë', icon: 'road', color: '#3B82F6', iconFamily: 'fontawesome' },
    { id: 'environment', label: 'Mjedis / Pastërti', icon: 'leaf', color: '#10B981', iconFamily: 'fontawesome' },
    { id: 'security', label: 'Siguri / Ndriçim', icon: 'security', color: '#EF4444', iconFamily: 'material' },
    { id: 'other', label: 'Të Tjera', icon: 'more-horiz', color: '#6B7280', iconFamily: 'material' }
  ];

  // ✅ IDs duhet të përputhen me Dashboard: urgent
  const priorities = [
    { id: 'low', label: 'I Ulët', color: '#6B7280', icon: 'arrow-downward' },
    { id: 'normal', label: 'Normal', color: '#3B82F6', icon: 'remove' },
    { id: 'high', label: 'I Lartë', color: '#F59E0B', icon: 'arrow-upward' },
    { id: 'urgent', label: 'Urgjent', color: '#EF4444', icon: 'warning' }
  ];

  const pickImage = async () => {
    Alert.alert(
      'Shto Foto',
      'Zgjidhni si dëshironi të shtoni një foto',
      [
        { text: 'Bëj Foto', onPress: takePhoto },
        { text: 'Zgjidh nga Galeria', onPress: pickFromGallery },
        { text: 'Anulo', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    setIsTakingPhoto(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Leje e nevojshme', 'Ju duhet leja e kamerës për të bërë foto.');
      setIsTakingPhoto(false);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    setIsTakingPhoto(false);
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
      if (description.trim()) classifyIssue(description);
    }
  };

  const pickFromGallery = async () => {
    setIsTakingPhoto(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Leje e nevojshme', 'Ju duhet leja e galerisë për të zgjedhur foto.');
      setIsTakingPhoto(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    setIsTakingPhoto(false);
    if (!result.canceled && result.assets?.[0]?.uri) {
      setImage(result.assets[0].uri);
      if (description.trim()) classifyIssue(description);
    }
  };

  // ✅ Kthen vetëm kategoritë që i njeh Dashboard-i
  const classifyIssue = (text) => {
    const t = (text || '').toLowerCase();

    // Infrastrukturë
    if (
      t.includes('vrim') || t.includes('rrug') || t.includes('asfalt') ||
      t.includes('trotoar') || t.includes('grop') || t.includes('kanal')
    ) {
      setCategory('infrastructure');
      return 'infrastructure';
    }

    // Mjedis / Pastërti
    if (
      t.includes('mbeturin') || t.includes('pleh') || t.includes('pis') ||
      t.includes('pastërti') || t.includes('kontejner') || t.includes('park') || t.includes('pem')
    ) {
      setCategory('environment');
      return 'environment';
    }

    // Siguri / Ndriçim
    if (
      t.includes('drit') || t.includes('ndriçim') || t.includes('llamb') ||
      t.includes('rrezik') || t.includes('siguri') || t.includes('aksident') || t.includes('trafik')
    ) {
      setCategory('security');
      return 'security';
    }

    setCategory('other');
    return 'other';
  };

  const getLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Leje e nevojshme', 'Ju duhet leja e lokacionit për të raportuar probleme.');
      setLoading(false);
      return null;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const addr = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      const addressText = addr?.[0]
        ? `${addr[0].street || ''}${addr[0].street && addr[0].city ? ', ' : ''}${addr[0].city || ''}`.trim() || 'Lokacioni aktual'
        : 'Lokacioni aktual';

      setLocationDetails({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: addressText
      });

      Alert.alert('Lokacioni U Kap', 'Lokacioni juaj u kap me sukses.');
      return loc;
    } catch (e) {
      Alert.alert('Gabim', 'Nuk mund të merret lokacioni. Ju lutem provoni përsëri.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Titulli Mungon', 'Ju lutem jepni një titull për raportin tuaj.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Përshkrimi Mungon', 'Ju lutem përshkruani problemin në detaje.');
      return false;
    }
    if (!image) {
      Alert.alert('Fotoja Mungon', 'Ju lutem shtoni një foto të problemit.');
      return false;
    }
    if (!category) {
      Alert.alert('Kategoria Mungon', 'Ju lutem zgjidhni një kategori për problemin.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    // Merr lokacionin nëse s’është kapur
    let locationData = locationDetails;
    if (!locationData) {
      const loc = await getLocation();
      if (!loc) {
        setLoading(false);
        return;
      }
      locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: 'Lokacioni aktual'
      };
    }

    // ✅ Struktura përputhet 100% me Dashboard
    const newReport = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title: title.trim(),
      description: description.trim(),
      image,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address
      },
      category,           // infrastructure/environment/security/other
      priority,           // low/normal/high/urgent
      status: 'pending',  // ✅ Dashboard pret 'pending'
      timestamp: new Date().toISOString(),
    };

    try {
      await saveReport(newReport);

      // ✅ Debug: shiko menjëherë çka ka në storage
      const raw = await AsyncStorage.getItem('reports');
      console.log('✅ AFTER SAVE reports =', raw);

      // ✅ NEW: clear draft after successful submit
      await clearDraft();

      setLoading(false);

      Alert.alert(
        'Raporti U Dorëzua!',
        'Raporti juaj u ruajt me sukses dhe tani duhet të shfaqet te “Raportet e Fundit”.',
        [
          { text: 'Kthehu në Dashboard', onPress: () => router.replace('/') },
          { text: 'Raporto Një Tjetër', onPress: async () => {
              setTitle('');
              setDescription('');
              setImage(null);
              setCategory(null);
              setPriority('normal');
              setLocationDetails(null);
              await clearDraft();
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Gabim në ruajtjen e raportit:', error);
      setLoading(false);
      Alert.alert('Gabim', 'Nuk u ruajt raporti. Ju lutem provoni përsëri.');
    }
  };

  const CategoryIcon = ({ cat }) => {
    if (cat.iconFamily === 'fontawesome') {
      return <FontAwesome5 name={cat.icon} size={18} color={category === cat.id ? '#FFFFFF' : cat.color} />;
    }
    return <MaterialIcons name={cat.icon} size={18} color={category === cat.id ? '#FFFFFF' : cat.color} />;
  };

  const handleBackPress = () => {
    // Draft autosaves automatically; just go back
    router.back();
  };

  const handleDiscardDraft = async () => {
    Alert.alert(
      'Fshi Draft-in?',
      'Kjo do t’i pastrojë të gjitha fushat dhe do ta fshijë draft-in e ruajtur.',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            setTitle('');
            setDescription('');
            setImage(null);
            setCategory(null);
            setPriority('normal');
            setLocationDetails(null);
            await clearDraft();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Raporto Problem Urban</Text>

            {/* ✅ NEW: Discard Draft (keeps layout same width) */}
            <TouchableOpacity style={styles.backButton} onPress={handleDiscardDraft}>
              <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Foto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shto Foto Dëshmi</Text>
            <Text style={styles.sectionSubtitle}>Një foto e qartë na ndihmon të kuptojmë më mirë problemin</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={isTakingPhoto}>
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <TouchableOpacity style={styles.replaceButton} onPress={pickImage}>
                    <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                    <Text style={styles.replaceText}>Zëvendëso</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyImage}>
                  {isTakingPhoto ? (
                    <ActivityIndicator size="large" color="#3B82F6" />
                  ) : (
                    <>
                      <View style={styles.cameraIcon}>
                        <MaterialIcons name="camera-alt" size={48} color="#3B82F6" />
                      </View>
                      <Text style={styles.pickerText}>Prek për të shtuar foto</Text>
                      <Text style={styles.pickerHint}>Bëj një foto ose zgjidh nga galeria</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Titulli */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Titulli i Raportit</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Titull i shkurtër i problemit (p.sh., 'Vrimë në Rrugën Kryesore')"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (text.trim()) classifyIssue(text);
              }}
              maxLength={60}
            />
            <Text style={styles.charCount}>{title.length}/60</Text>
          </View>

          {/* Kategoria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                    { borderColor: cat.color }
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <View style={[
                    styles.categoryIcon,
                    { backgroundColor: category === cat.id ? cat.color : `${cat.color}20` }
                  ]}>
                    <CategoryIcon cat={cat} />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Prioriteti */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niveli i Prioritetit</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((pri) => (
                <TouchableOpacity
                  key={pri.id}
                  style={[
                    styles.priorityButton,
                    priority === pri.id && styles.priorityButtonActive,
                    { borderColor: pri.color }
                  ]}
                  onPress={() => setPriority(pri.id)}
                >
                  <MaterialIcons name={pri.icon} size={20} color={priority === pri.id ? '#FFFFFF' : pri.color} />
                  <Text style={[
                    styles.priorityLabel,
                    priority === pri.id && styles.priorityLabelActive
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Përshkrimi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Përshkrim i Detajuar</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Përshkruani problemin në detaje..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (text.trim() && !category) classifyIssue(text);
              }}
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Lokacioni */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lokacioni</Text>
            <TouchableOpacity style={styles.locationButton} onPress={getLocation} disabled={loading}>
              <View style={styles.locationIcon}>
                <MaterialIcons
                  name={locationDetails ? "location-on" : "location-searching"}
                  size={24}
                  color={locationDetails ? "#10B981" : "#3B82F6"}
                />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>
                  {locationDetails ? 'Lokacioni U Kap' : 'Merr Lokacionin Aktual'}
                </Text>
                <Text style={styles.locationSubtitle} numberOfLines={2}>
                  {locationDetails?.address || 'Prek për të kapur lokacionin tuaj aktual'}
                </Text>
              </View>
              {loading ? <ActivityIndicator size="small" color="#3B82F6" /> : <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!title || !description || !image || !category) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || !title || !description || !image || !category}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Dorëzo Raportin</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Duke e dorëzuar, ju konfirmoni se ky është një problem urban i vërtetë.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },

  section: { paddingHorizontal: 24, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },

  imagePicker: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyImage: { height: 200, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  pickerText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  pickerHint: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 200 },
  replaceButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  replaceText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },

  categoryScroll: { marginHorizontal: -24 },
  categoryContainer: { paddingHorizontal: 24, gap: 12 },
  categoryButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 110,
  },
  categoryButtonActive: { backgroundColor: '#F0F9FF', borderWidth: 2 },
  categoryIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  categoryLabelActive: { color: '#1F2937' },

  priorityContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  priorityButtonActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  priorityLabel: { fontSize: 14, fontWeight: '600' },
  priorityLabelActive: { color: '#FFFFFF' },

  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    height: 150,
    textAlignVertical: 'top',
  },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  locationIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center', alignItems: 'center',
  },
  locationInfo: { flex: 1 },
  locationTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  locationSubtitle: { fontSize: 14, color: '#6B7280' },

  submitSection: { paddingHorizontal: 24, marginTop: 32 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  disclaimer: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 16, lineHeight: 18 },
});

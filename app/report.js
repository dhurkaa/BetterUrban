import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { saveReport } from '../utils/storage';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

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

  const categories = [
    { id: 'infrastructure', label: 'Infrastructure', icon: 'road', color: '#3B82F6' },
    { id: 'environment', label: 'Environment', icon: 'leaf', color: '#10B981' },
    { id: 'safety', label: 'Safety', icon: 'shield-alt', color: '#EF4444' },
    { id: 'lighting', label: 'Public Lighting', icon: 'lightbulb', color: '#F59E0B' },
    { id: 'sanitation', label: 'Sanitation', icon: 'trash-alt', color: '#8B5CF6' },
    { id: 'other', label: 'Other', icon: 'ellipsis-h', color: '#6B7280' }
  ];

  const priorities = [
    { id: 'low', label: 'Low', color: '#6B7280', icon: 'chevron-down' },
    { id: 'normal', label: 'Normal', color: '#3B82F6', icon: 'minus' },
    { id: 'high', label: 'High', color: '#F59E0B', icon: 'chevron-up' },
    { id: 'urgent', label: 'Urgent', color: '#EF4444', icon: 'exclamation' }
  ];

  const pickImage = async () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    setIsTakingPhoto(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to take photos.');
      setIsTakingPhoto(false);
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    setIsTakingPhoto(false);
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      analyzeImageForCategory(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    setIsTakingPhoto(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery permission is required to select photos.');
      setIsTakingPhoto(false);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    setIsTakingPhoto(false);
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      analyzeImageForCategory(result.assets[0].uri);
    }
  };

  const analyzeImageForCategory = (imageUri) => {
    // In a real app, this would use ML to analyze the image
    // For now, we'll use a simple heuristic based on description
    if (description.length > 0) {
      classifyIssue(description);
    }
  };

  const classifyIssue = (text) => {
    const t = text.toLowerCase();
    if (t.includes('hole') || t.includes('road') || t.includes('street') || t.includes('grop') || t.includes('rrug')) {
      setCategory('infrastructure');
      return 'Infrastructure';
    }
    if (t.includes('light') || t.includes('dark') || t.includes('drit') || t.includes('erret')) {
      setCategory('lighting');
      return 'Public Lighting';
    }
    if (t.includes('garbage') || t.includes('trash') || t.includes('waste') || t.includes('mbeturin') || t.includes('pis')) {
      setCategory('sanitation');
      return 'Sanitation';
    }
    if (t.includes('danger') || t.includes('safety') || t.includes('accident') || t.includes('siguri')) {
      setCategory('safety');
      return 'Safety';
    }
    if (t.includes('tree') || t.includes('green') || t.includes('park') || t.includes('mjedis')) {
      setCategory('environment');
      return 'Environment';
    }
    setCategory('other');
    return 'Other';
  };

  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Location permission is required to report issues.');
      setLoading(false);
      return null;
    }

    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Get address from coordinates
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      setLocationDetails({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Current Location'
      });

      Alert.alert('Location Captured', 'Your location has been successfully captured.');
      return location;
    } catch (error) {
      Alert.alert('Error', 'Unable to get location. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please provide a title for your report.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue in detail.');
      return false;
    }
    if (!image) {
      Alert.alert('Missing Photo', 'Please add a photo of the issue.');
      return false;
    }
    if (!category) {
      Alert.alert('Missing Category', 'Please select a category for the issue.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);

    // Get location if not already captured
    let locationData = locationDetails;
    if (!locationData) {
      const location = await getLocation();
      if (!location) {
        setLoading(false);
        return;
      }
      locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: 'Current Location'
      };
    }

    const newReport = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      image,
      location: {
        lat: locationData.latitude,
        lng: locationData.longitude,
        address: locationData.address
      },
      category,
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    try {
      await saveReport(newReport);
      setLoading(false);
      
      Alert.alert(
        'Report Submitted!',
        'Your urban issue report has been successfully submitted and is under review.',
        [
          {
            text: 'View Report',
            onPress: () => {
              router.replace('/');
            }
          },
          {
            text: 'Report Another',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setImage(null);
              setCategory(null);
              setPriority('normal');
              setLocationDetails(null);
            }
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save report. Please try again.');
    }
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Urban Issue</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Photo Evidence</Text>
            <Text style={styles.sectionSubtitle}>A clear photo helps us understand the issue better</Text>
            
            <TouchableOpacity 
              style={styles.imagePicker}
              onPress={pickImage}
              disabled={isTakingPhoto}
            >
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <TouchableOpacity 
                    style={styles.replaceButton}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                    <Text style={styles.replaceText}>Replace</Text>
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
                      <Text style={styles.pickerText}>Tap to add photo</Text>
                      <Text style={styles.pickerHint}>Take a photo or choose from gallery</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Title</Text>
            <TextInput 
              style={styles.titleInput}
              placeholder="Brief title of the issue (e.g., 'Pothole on Main Street')"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (text.length > 0) classifyIssue(text);
              }}
              maxLength={60}
            />
            <Text style={styles.charCount}>{title.length}/60</Text>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContainer}
            >
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
                    <FontAwesome5 name={cat.icon} size={18} color={category === cat.id ? '#FFFFFF' : cat.color} />
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

          {/* Priority Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Level</Text>
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
                  <MaterialIcons 
                    name={pri.icon} 
                    size={20} 
                    color={priority === pri.id ? '#FFFFFF' : pri.color} 
                  />
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

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Description</Text>
            <TextInput 
              style={styles.descriptionInput}
              placeholder="Describe the issue in detail. Include any relevant information that might help us understand and resolve it faster..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (text.length > 0 && !category) {
                  classifyIssue(text);
                }
              }}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={getLocation}
              disabled={loading}
            >
              <View style={styles.locationIcon}>
                <MaterialIcons 
                  name={locationDetails ? "location-on" : "location-searching"} 
                  size={24} 
                  color={locationDetails ? "#10B981" : "#3B82F6"} 
                />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>
                  {locationDetails ? 'Location Captured' : 'Get Current Location'}
                </Text>
                <Text style={styles.locationSubtitle} numberOfLines={2}>
                  {locationDetails?.address || 'Tap to capture your current location'}
                </Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <MaterialIcons 
                  name="chevron-right" 
                  size={24} 
                  color="#9CA3AF" 
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
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
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.disclaimer}>
              By submitting, you confirm this is a genuine urban issue and agree to our reporting guidelines.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
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
  emptyImage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pickerHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
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
  replaceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
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
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryScroll: {
    marginHorizontal: -24,
  },
  categoryContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  categoryButtonActive: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#1F2937',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
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
  priorityButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityLabelActive: {
    color: '#FFFFFF',
  },
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
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
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
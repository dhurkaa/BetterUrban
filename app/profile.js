import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    joinDate: '',
    reportsCount: 0,
    resolvedCount: 0,
    points: 0,
    level: 'Citizen'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    urgent: 0
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userName = await AsyncStorage.getItem('userName') || 'Urban Guardian';
      const userEmail = await AsyncStorage.getItem('userEmail') || 'user@example.com';
      const joinDate = await AsyncStorage.getItem('joinDate') || new Date().toISOString();
      const savedImage = await AsyncStorage.getItem('profileImage');
      
      // Load reports to calculate stats
      const { getReports } = require('../utils/storage');
      const reports = await getReports();
      
      const userReports = reports; // In real app, filter by user
      const resolved = userReports.filter(r => r.status === 'resolved').length;
      const pending = userReports.filter(r => r.status === 'pending').length;
      const urgent = userReports.filter(r => r.priority === 'urgent').length;
      
      // Calculate points and level
      const points = (resolved * 10) + (userReports.length * 5);
      const level = calculateLevel(points);

      setUser({
        name: userName,
        email: userEmail,
        joinDate: new Date(joinDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        reportsCount: userReports.length,
        resolvedCount: resolved,
        points,
        level
      });

      setStats({
        total: userReports.length,
        pending,
        resolved,
        urgent
      });

      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (points) => {
    if (points >= 500) return 'Urban Hero';
    if (points >= 250) return 'City Champion';
    if (points >= 100) return 'Active Citizen';
    return 'Citizen';
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'Urban Hero': return '#8B5CF6';
      case 'City Champion': return '#3B82F6';
      case 'Active Citizen': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getLevelIcon = (level) => {
    switch(level) {
      case 'Urban Hero': return 'trophy';
      case 'City Champion': return 'award';
      case 'Active Citizen': return 'star';
      default: return 'user';
    }
  };

  const pickProfileImage = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to update your profile picture',
      [
        { text: 'Take Photo', onPress: takeProfilePhoto },
        { text: 'Choose from Gallery', onPress: pickProfileFromGallery },
        { text: 'Remove Photo', onPress: removeProfilePhoto, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takeProfilePhoto = async () => {
    setLoadingImage(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to take photos.');
      setLoadingImage(false);
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setLoadingImage(false);
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem('profileImage', result.assets[0].uri);
    }
  };

  const pickProfileFromGallery = async () => {
    setLoadingImage(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Gallery permission is required to select photos.');
      setLoadingImage(false);
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setLoadingImage(false);
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem('profileImage', result.assets[0].uri);
    }
  };

  const removeProfilePhoto = async () => {
    setProfileImage(null);
    await AsyncStorage.removeItem('profileImage');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userName');
            router.replace('/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const getBadges = () => {
    const badges = [];
    
    if (stats.resolved >= 10) {
      badges.push({ name: 'Problem Solver', icon: 'check-circle', color: '#10B981' });
    }
    if (stats.total >= 20) {
      badges.push({ name: 'Active Reporter', icon: 'flag', color: '#3B82F6' });
    }
    if (stats.urgent >= 5) {
      badges.push({ name: 'Emergency Hero', icon: 'alert-circle', color: '#EF4444' });
    }
    if (user.level === 'Urban Hero') {
      badges.push({ name: 'Top Contributor', icon: 'trophy', color: '#F59E0B' });
    }
    
    return badges;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Feather name="edit-2" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={pickProfileImage}
            disabled={loadingImage}
          >
            {loadingImage ? (
              <View style={styles.imageLoading}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={64} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.levelBadge}>
              <FontAwesome5 
                name={getLevelIcon(user.level)} 
                size={14} 
                color={getLevelColor(user.level)} 
              />
              <Text style={[styles.levelText, { color: getLevelColor(user.level) }]}>
                {user.level}
              </Text>
            </View>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.joinDate}>Member since {user.joinDate}</Text>
          </View>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsLeft}>
            <MaterialIcons name="workspace-premium" size={24} color="#F59E0B" />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsLabel}>Community Points</Text>
              <Text style={styles.pointsValue}>{user.points} pts</Text>
            </View>
          </View>
          <View style={styles.pointsRight}>
            <Text style={styles.nextLevelText}>
              {user.level === 'Urban Hero' 
                ? 'Max Level Achieved!' 
                : `${500 - user.points} pts to next level`}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Reporting Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialIcons name="description" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="pending" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialIcons name="warning" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{stats.urgent}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements & Badges</Text>
          <View style={styles.badgesContainer}>
            {getBadges().length > 0 ? (
              getBadges().map((badge, index) => (
                <View key={index} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: `${badge.color}20` }]}>
                    <Feather name={badge.icon} size={24} color={badge.color} />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noBadges}>
                <MaterialIcons name="emoji-events" size={48} color="#E5E7EB" />
                <Text style={styles.noBadgesText}>No badges yet</Text>
                <Text style={styles.noBadgesHint}>Keep reporting to earn badges!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-reports')}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="list-alt" size={22} color="#3B82F6" />
                <Text style={styles.menuItemText}>My Reports</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="notifications" size={22} color="#F59E0B" />
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <View style={styles.menuItemRight}>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="security" size={22} color="#10B981" />
                <Text style={styles.menuItemText}>Privacy & Security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="help-center" size={22} color="#8B5CF6" />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/about')}>
              <View style={styles.menuItemLeft}>
                <MaterialIcons name="info" size={22} color="#6B7280" />
                <Text style={styles.menuItemText}>About UrbanIssue Reporter</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>UrbanIssue Reporter v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  container: {
    flex: 1,
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  imageLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: -20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pointsInfo: {
    gap: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  pointsRight: {
    alignItems: 'flex-end',
  },
  nextLevelText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    width: (Dimensions.get('window').width - 80) / 2,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  badgeItem: {
    alignItems: 'center',
    width: (Dimensions.get('window').width - 104) / 3,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  noBadges: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
  },
  noBadgesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  noBadgesHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
import { Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Platform,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { getReports } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// Import i sigurt i Hartës
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    MapView = MapModule.default;
    Marker = MapModule.Marker;
  } catch (e) {
    console.log("Harta nuk mund të ngarkohet");
  }
}

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    urgent: 0
  });
  const [userName, setUserName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadUserData();
      loadReports();
    }
  }, [isFocused]);

  useEffect(() => {
    calculateStats();
  }, [reports]);

  const loadUserData = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };

  const loadReports = async () => {
    setRefreshing(true);
    const data = await getReports();
    setReports(data);
    setRefreshing(false);
  };

  const calculateStats = () => {
    const statsData = {
      total: reports.length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      pending: reports.filter(r => r.status === 'pending').length,
      urgent: reports.filter(r => r.priority === 'urgent').length
    };
    setStats(statsData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userName');
    router.replace('/login');
  };

  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'infrastructure', label: 'Infrastructure', icon: 'road' },
    { id: 'environment', label: 'Environment', icon: 'leaf' },
    { id: 'safety', label: 'Safety', icon: 'shield-alt' },
    { id: 'other', label: 'Other', icon: 'ellipsis-h' }
  ];

  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(report => report.category === selectedCategory);

  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'urgent': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'infrastructure': return 'road';
      case 'environment': return 'leaf';
      case 'safety': return 'shield-alt';
      default: return 'map-marker-alt';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <View style={[styles.priorityBadge, { backgroundColor: '#FEE2E2' }]}>
          <MaterialIcons name="warning" size={12} color="#DC2626" />
          <Text style={[styles.priorityText, { color: '#DC2626' }]}>URGENT</Text>
        </View>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderReportCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/report/${item.id}`)}
      activeOpacity={0.9}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.cardImage} />
      )}
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <FontAwesome5 
              name={getCategoryIcon(item.category)} 
              size={14} 
              color="#2563EB" 
              style={styles.categoryIcon}
            />
            <Text style={styles.cardCategory}>{item.category}</Text>
          </View>
          {getPriorityBadge(item.priority)}
        </View>
        
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || item.description?.substring(0, 60)}
        </Text>
        
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={14} color="#6B7280" />
            <Text style={styles.locationText}>
              {item.location?.address || 'Unknown location'}
            </Text>
          </View>
          
          <View style={styles.metaContainer}>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
            {getStatusBadge(item.status)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadReports}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.userGreeting}>
              <Text style={styles.greetingText}>Hello,</Text>
              <Text style={styles.userName}>
                {userName || 'Urban Guardian'}
              </Text>
            </View>
            <Text style={styles.welcomeText}>Welcome to your dashboard</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <MaterialIcons name="person" size={20} color="#1F2937" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialIcons name="notifications" size={24} color="#1F2937" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: '#2563EB' }]}>
            <MaterialIcons name="description" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <MaterialIcons name="pending" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
            <MaterialIcons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.urgent}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </ScrollView>

        {/* Interactive Map */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Reports Map</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View Full Map</Text>
              <MaterialIcons name="chevron-right" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
          
          {Platform.OS !== 'web' && MapView ? (
            <View style={styles.mapContainer}>
              <MapView 
                style={styles.map} 
                initialRegion={{
                  latitude: 41.3275, 
                  longitude: 19.8187, 
                  latitudeDelta: 0.05, 
                  longitudeDelta: 0.05 
                }}
              >
                {reports.map(r => r.location && (
                  <Marker 
                    key={r.id} 
                    coordinate={{ latitude: r.location.lat, longitude: r.location.lng }} 
                    title={r.category} 
                  >
                    <View style={styles.customMarker}>
                      <FontAwesome5 
                        name={getCategoryIcon(r.category)} 
                        size={16} 
                        color="#FFFFFF" 
                      />
                    </View>
                  </Marker>
                ))}
              </MapView>
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>
                  {reports.length} active reports in your area
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noMapContainer}>
              <MaterialIcons name="map" size={48} color="#94A3B8" />
              <Text style={styles.noMapText}>Interactive map available on mobile</Text>
            </View>
          )}
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Filter by Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainerScroll}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <FontAwesome5 
                  name={category.icon} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Reports */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity 
              style={styles.newReportButton}
              onPress={() => router.push('/report')}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newReportText}>New Report</Text>
            </TouchableOpacity>
          </View>
          
          {filteredReports.length > 0 ? (
            <FlatList
              data={filteredReports.slice(0, 5)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={renderReportCard}
              contentContainerStyle={styles.reportsList}
            />
          ) : (
            <View style={styles.emptyReports}>
              <MaterialIcons name="inbox" size={64} color="#E5E7EB" />
              <Text style={styles.emptyReportsTitle}>No reports yet</Text>
              <Text style={styles.emptyReportsText}>
                {selectedCategory !== 'all' 
                  ? `No reports in ${selectedCategory} category`
                  : 'Start by reporting an urban issue'
                }
              </Text>
              <TouchableOpacity 
                style={styles.firstReportButton}
                onPress={() => router.push('/report')}
              >
                <Text style={styles.firstReportButtonText}>Create First Report</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {filteredReports.length > 5 && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/reports')}
            >
              <Text style={styles.seeAllText}>See All Reports</Text>
              <MaterialIcons name="chevron-right" size={20} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/report')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialIcons name="add-circle" size={28} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>New Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <MaterialIcons name="person" size={28} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/analytics')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="analytics" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0E7FF' }]}>
                <MaterialIcons name="settings" size={28} color="#4F46E5" />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/report')}
        activeOpacity={0.9}
      >
        <View style={styles.fabGradient}>
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  },
  headerLeft: {
    flex: 1,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  welcomeText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsScroll: {
    marginTop: 8,
  },
  statsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  statCard: {
    width: 140,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  mapSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 4,
  },
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mapOverlayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  noMapContainer: {
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  categorySection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  categoryContainerScroll: {
    gap: 12,
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2563EB',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  reportsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  newReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  newReportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportsList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    marginRight: 4,
  },
  cardCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 120,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyReports: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginTop: 16,
  },
  emptyReportsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyReportsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  firstReportButton: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  firstReportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 4,
  },
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16,
  },
  quickAction: {
    width: (width - 64) / 2 - 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
});
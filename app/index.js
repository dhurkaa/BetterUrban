import React, { useState, useEffect, useMemo } from 'react';
import { Dimensions, Alert } from 'react-native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// ✅ NEW: GPS location (Expo)
import * as Location from 'expo-location';

import { useLanguage } from './utils/language';
import { useTheme } from './utils/theme';

const { width } = Dimensions.get('window');

// Komponent placeholder për web
const WebMapPlaceholder = ({ reports, getCategoryIcon, userLocation, t, theme }) => (
  <View style={[webMapStyles.container, { backgroundColor: theme.colors.cardBackground }]}>
    <MaterialIcons name="map" size={48} color={theme.colors.textSecondary} />
    <Text style={[webMapStyles.mapText, { color: theme.colors.textSecondary }]}>
      {t('webMapMessage')}
    </Text>
    <Text style={[webMapStyles.locationText, { color: theme.colors.textPrimary }]}>
      {userLocation?.city ? t('nearLocation', { location: userLocation.city }) : t('loadingLocation')}
    </Text>
    <Text style={[webMapStyles.reportCount, { color: theme.colors.textTertiary }]}>
      {t('reportsInArea', { count: reports.length })}
    </Text>
  </View>
);

// Komponent placeholder për mobile kur harta nuk është e disponueshme
const MobileMapPlaceholder = ({ userLocation, nearbyReports, t, theme }) => (
  <View style={[mobileMapStyles.container, { backgroundColor: theme.colors.cardBackground }]}>
    <MaterialIcons name="map" size={48} color={theme.colors.textSecondary} />
    <Text style={[mobileMapStyles.mapText, { color: theme.colors.textSecondary }]}>
      {t('mapNotAvailable')}
    </Text>
    {userLocation?.city && (
      <Text style={[mobileMapStyles.locationText, { color: theme.colors.textPrimary }]}>
        {t('yourLocation')}: {userLocation.city}
      </Text>
    )}
    <Text style={[mobileMapStyles.reportCount, { color: theme.colors.textTertiary }]}>
      {t('activeReportsNearby', { count: nearbyReports.length })}
    </Text>
  </View>
);

// Stilet për WebMapPlaceholder
const webMapStyles = StyleSheet.create({
  container: { height: 200, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mapText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  locationText: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  reportCount: { fontSize: 12, marginTop: 8 }
});

// Stilet për MobileMapPlaceholder
const mobileMapStyles = StyleSheet.create({
  container: { height: 200, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mapText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  locationText: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  reportCount: { fontSize: 12, marginTop: 8 }
});

// Funksion për marrjen e raporteve nga AsyncStorage
const getReportsFromStorage = async () => {
  try {
    const reportsJson = await AsyncStorage.getItem('reports');
    return reportsJson ? JSON.parse(reportsJson) : [];
  } catch (error) {
    console.error('Error loading reports from storage:', error);
    return [];
  }
};

export default function Dashboard() {
  // ===== Hooks =====
  const lang = useLanguage();
  const { theme } = useTheme();

  // SAFETY: nëse hook-u yt kthen vetëm t, ky fallback e mban gjallë
  const t = lang?.t || ((k) => k);
  const setLanguage = lang?.setLanguage;        // nëse ekziston në hook-un tënd
  const currentLanguage = lang?.language;       // nëse ekziston në hook-un tënd

  // theme hook mund të ketë emra të ndryshëm setteri
  const themeHook = useTheme();
  const themeObj = themeHook?.theme || theme;
  const setThemeMode = themeHook?.setThemeMode || themeHook?.setMode || themeHook?.setTheme || null;

  // IMPORTANT: styles duhet të marrin themeObj
  const styles = getStyles(themeObj);

  // ===== State =====
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, urgent: 0 });
  const [userName, setUserName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [MapComponent, setMapComponent] = useState(null);
  const [MarkerComponent, setMarkerComponent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ✅ NEW: Distance filter for nearby reports
  const [distanceKm, setDistanceKm] = useState(5); // 5 | 10 | 0 (0 = all)

  // ✅ NEW: Sorting
  const [sortMode, setSortMode] = useState('newest'); // newest | urgent | nearest

  // force rerender kur settings ndryshohen
  const [settingsVersion, setSettingsVersion] = useState(0);

  const router = useRouter();
  const isFocused = useIsFocused();

  // ✅ KATEGORITË tani rifreskohen kur ndryshon gjuha
  const categories = useMemo(() => ([
    { id: 'all', label: t('all'), icon: 'dashboard', iconFamily: 'material' },
    { id: 'infrastructure', label: t('infrastructure'), icon: 'road', iconFamily: 'fontawesome' },
    { id: 'environment', label: t('environment'), icon: 'leaf', iconFamily: 'fontawesome' },
    { id: 'security', label: t('security'), icon: 'security', iconFamily: 'material' },
    { id: 'other', label: t('other'), icon: 'more-horiz', iconFamily: 'material' }
  ]), [t, settingsVersion]);

  // ✅ Kjo është “fix” kryesor: lexon appSettings kur kthehesh nga settings
  const applySavedPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('appSettings');
      if (!saved) return;

      const parsed = JSON.parse(saved);

      const savedLang = parsed?.preferences?.language; // p.sh. 'sq' | 'en'
      const savedTheme = parsed?.preferences?.theme;   // p.sh. 'light' | 'dark' | 'system'

      // Language
      if (savedLang && typeof setLanguage === 'function') {
        if (!currentLanguage || currentLanguage !== savedLang) {
          setLanguage(savedLang);
        }
      }

      // Theme
      if (savedTheme && typeof setThemeMode === 'function') {
        setThemeMode(savedTheme);
      }

      // Force rerender i Dashboard-it
      setSettingsVersion(v => v + 1);
    } catch (e) {
      console.error('applySavedPreferences error:', e);
    }
  };

  // =========================
  // ✅ MAP LOCATION IMPROVEMENT (GPS + Web Geo + IP fallback)
  // =========================
  const LOCATION_KEY = 'userLocation';

  const saveLocation = async (loc) => {
    try {
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch {}
  };

  // Web geolocation (browser) - nëse ekziston
  const getWebLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator?.geolocation) return reject(new Error('No geolocation'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'web_geolocation',
          timestamp: Date.now(),
        }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 }
      );
    });

  // Marr lokacionin nga IP (fallback)
  const getLocationFromIP = async () => {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      country: data.country_name,
      ip: data.ip,
      source: 'ip_api',
      timestamp: Date.now(),
    };
  };

  // ✅ Kryesorja: GPS në mobile, web geolocation në web, fallback IP
  const getBestLocation = async () => {
    // 1) provo cached (shfaq menjëherë)
    try {
      const cached = await AsyncStorage.getItem(LOCATION_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setUserLocation(parsed);
        setLoadingLocation(false);
      }
    } catch {}

    // 2) merr lokacion të freskët
    try {
      setLoadingLocation(true);

      // WEB
      if (Platform.OS === 'web') {
        try {
          const webLoc = await getWebLocation();
          setUserLocation(prev => ({
            ...prev,
            ...webLoc,
            city: prev?.city,
            country: prev?.country,
          }));
          await saveLocation({
            ...(userLocation || {}),
            ...webLoc,
          });
          return;
        } catch {
          const ipLoc = await getLocationFromIP();
          setUserLocation(ipLoc);
          await saveLocation(ipLoc);
          return;
        }
      }

      // MOBILE (Expo GPS)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const ipLoc = await getLocationFromIP();
        setUserLocation(ipLoc);
        await saveLocation(ipLoc);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode (city/country) – opsionale
      let city, country;
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        city = geo?.[0]?.city || geo?.[0]?.subregion || geo?.[0]?.region;
        country = geo?.[0]?.country;
      } catch {}

      const gpsLoc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        city: city || userLocation?.city,
        country: country || userLocation?.country,
        source: 'gps',
        timestamp: Date.now(),
      };

      setUserLocation(gpsLoc);
      await saveLocation(gpsLoc);

    } catch (error) {
      console.error(t('locationError'), error);
      // fallback final
      try {
        const ipLoc = await getLocationFromIP();
        setUserLocation(ipLoc);
        await saveLocation(ipLoc);
      } catch {
        setUserLocation({
          latitude: 42.6629,
          longitude: 21.1655,
          city: t('pristina'),
          country: t('kosovo'),
          ip: t('unknown'),
          source: 'fallback',
          timestamp: Date.now(),
        });
      }
    } finally {
      setLoadingLocation(false);
    }
  };
  // =========================
  // END MAP LOCATION IMPROVEMENT
  // =========================

  // ✅ NEW: Draft helpers (Dashboard hook only)
  const DRAFT_KEY = 'reportDraft';

  const loadDraft = async () => {
    try {
      const d = await AsyncStorage.getItem(DRAFT_KEY);
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  };

  // Lazy load map components ONLY for mobile me error handling
  useEffect(() => {
    const loadMapComponents = async () => {
      if (Platform.OS !== 'web') {
        try {
          const MapModule = require('react-native-maps');
          setMapComponent(() => MapModule.default);
          setMarkerComponent(() => MapModule.Marker);
          setMapError(false);
        } catch (error) {
          console.log("Maps module not available:", error?.message);
          setMapComponent(null);
          setMarkerComponent(null);
          setMapError(true);
        }
      }
    };

    loadMapComponents();
    // ✅ NEW: përdor GPS/Web/Ip fallback
    getBestLocation();
  }, []);

  // ✅ Këtu: sa herë dashboard vjen në fokus -> apliko settings + rifresko të dhënat
  useEffect(() => {
    if (isFocused) {
      setShowNotifications(false);
      applySavedPreferences(); // <-- FIX
      loadUserData();
      loadReports();
      // ✅ optional: rifresko lokacionin kur kthehesh (nëse do, lëre)
      getBestLocation();

      // ✅ NEW: show "continue draft" notification if exists
      loadDraft().then(d => {
        if (d?.title || d?.description) {
          setShowNotifications(true);
        }
      });
    }
  }, [isFocused]);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) setUserName(name);
    } catch (error) {
      console.error(t('userDataError'), error);
    }
  };

  const loadReports = async () => {
    try {
      setRefreshing(true);
      const data = await getReportsFromStorage();
      setReports(data);

      const statsData = {
        total: data.length,
        resolved: data.filter(r => r.status === 'resolved').length,
        pending: data.filter(r => r.status === 'pending').length,
        urgent: data.filter(r => r.priority === 'urgent').length
      };
      setStats(statsData);
    } catch (error) {
      console.error(t('reportsLoadError'), error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userName');
              await AsyncStorage.removeItem('userLocation');
              router.replace('/login');
            } catch (error) {
              console.error(t('logoutError'), error);
            }
          }
        }
      ]
    );
  };

  // Funksioni për të hapur hartën e plotë
  const handleViewFullMap = () => {
    if (Platform.OS === 'web') {
      alert(t('webMapOnly'));
    } else if (mapError || !MapComponent) {
      alert(t('mapNotAvailableAlert'));
    } else {
      router.push('/full-map');
    }
  };

  const filteredReports = selectedCategory === 'all'
    ? reports
    : reports.filter(report => report.category === selectedCategory);

  const getStatusColor = (status) => {
    switch(status) {
      case 'resolved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'urgent': return '#EF4444';
      default: return themeObj.colors.textSecondary;
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'infrastructure': return 'road';
      case 'environment': return 'leaf';
      case 'security': return 'shield-alt';
      default: return 'map-marker-alt';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <View style={[styles.priorityBadge, { backgroundColor: themeObj.colors.urgentBackground || '#FEE2E2' }]}>
          <MaterialIcons name="warning" size={12} color={themeObj.colors.urgent || '#EF4444'} />
          <Text style={[styles.priorityText, { color: themeObj.colors.urgent || '#EF4444' }]}>
            {t('urgent').toUpperCase()}
          </Text>
        </View>
      );
    }
    return null;
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const statusText = {
      'resolved': t('resolved'),
      'pending': t('pending'),
      'urgent': t('urgent')
    }[status] || status;

    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>
          {statusText.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderReportCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/report-details/${item.id}`)}
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
              color={themeObj.colors.primary}
              style={styles.categoryIcon}
            />
            <Text style={styles.cardCategory}>{t(item.category)}</Text>
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
            <MaterialIcons name="location-on" size={14} color={themeObj.colors.textSecondary} />
            <Text style={styles.locationText}>
              {item.location?.address || t('unknownLocation')}
            </Text>
          </View>

          <View style={styles.metaContainer}>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleDateString(t('locale') || 'en-US')}
            </Text>
            {getStatusBadge(item.status)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Llogaritje e distancës midis dy koordinatave
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  // ✅ UPDATED: distance filter dynamic (5km / 10km / all)
  const nearbyReports = userLocation
    ? reports.filter(report => {
        if (!report.location || !report.location.latitude) return false;
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          report.location.latitude,
          report.location.longitude
        );

        if (distanceKm === 0) return true; // all
        return parseFloat(distance) <= distanceKm;
      })
    : [];

  // ✅ NEW: Sorting helper + computed list
  const getSortedReports = (list) => {
    const arr = [...list];

    if (sortMode === 'urgent') {
      return arr.sort((a, b) => (b.priority === 'urgent') - (a.priority === 'urgent'));
    }

    if (sortMode === 'nearest' && userLocation) {
      return arr.sort((a, b) => {
        const da = a?.location?.latitude
          ? parseFloat(calculateDistance(userLocation.latitude, userLocation.longitude, a.location.latitude, a.location.longitude))
          : 9999;
        const db = b?.location?.latitude
          ? parseFloat(calculateDistance(userLocation.latitude, userLocation.longitude, b.location.latitude, b.location.longitude))
          : 9999;
        return da - db;
      });
    }

    // default newest
    return arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const displayedReports = useMemo(() => {
    return getSortedReports(filteredReports);
  }, [filteredReports, sortMode, userLocation]);

  const MapDisplay = () => {
    if (loadingLocation) {
      return (
        <View style={styles.noMapContainer}>
          <ActivityIndicator size="large" color={themeObj.colors.primary} />
          <Text style={styles.noMapText}>{t('loadingLocation')}</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <WebMapPlaceholder
          reports={reports}
          getCategoryIcon={getCategoryIcon}
          userLocation={userLocation}
          t={t}
          theme={themeObj}
        />
      );
    }

    if (mapError || !MapComponent || !MarkerComponent) {
      return (
        <MobileMapPlaceholder
          userLocation={userLocation}
          nearbyReports={nearbyReports}
          t={t}
          theme={themeObj}
        />
      );
    }

    if (MapComponent && MarkerComponent && userLocation) {
      try {
        return (
          <View style={styles.mapContainer}>
            {/* ✅ IMPROVEMENT: vetëm initialRegion (mos e “ngri” hartën) */}
            <MapComponent
              style={styles.map}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              }}
            >
              <MarkerComponent
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                }}
                title={t('youAreHere')}
              >
                <View style={styles.userMarker}>
                  <MaterialIcons name="person-pin-circle" size={28} color={themeObj.colors.primary} />
                </View>
              </MarkerComponent>

              {reports.slice(0, 20).map(r => r.location && (
                <MarkerComponent
                  key={r.id}
                  coordinate={{ latitude: r.location.latitude, longitude: r.location.longitude }}
                  title={t(r.category)}
                >
                  <View style={styles.customMarker}>
                    <FontAwesome5
                      name={getCategoryIcon(r.category)}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                </MarkerComponent>
              ))}
            </MapComponent>

            <View style={[styles.mapOverlay, { backgroundColor: (themeObj.colors.cardBackground || '#FFFFFF') + 'E6' }]}>
              <View style={styles.mapLocationInfo}>
                <MaterialIcons name="location-on" size={16} color={themeObj.colors.primary} />
                <Text style={styles.mapLocationText}>
                  {userLocation.city || t('yourLocation')}
                </Text>
              </View>
              <Text style={styles.mapOverlayText}>
                {t('activeReportsWithin', { count: nearbyReports.length, distance: `${distanceKm === 0 ? '∞' : distanceKm}km` })}
              </Text>
            </View>
          </View>
        );
      } catch (error) {
        console.error(t('mapRenderError'), error);
        return (
          <MobileMapPlaceholder
            userLocation={userLocation}
            nearbyReports={nearbyReports}
            t={t}
            theme={themeObj}
          />
        );
      }
    }

    return (
      <MobileMapPlaceholder
        userLocation={userLocation}
        nearbyReports={nearbyReports}
        t={t}
        theme={themeObj}
      />
    );
  };

  const CategoryIcon = ({ category }) => {
    const cat = categories.find(c => c.id === category.id);

    if (cat?.iconFamily === 'fontawesome') {
      return (
        <FontAwesome5
          name={cat.icon}
          size={16}
          color={selectedCategory === category.id ? '#FFFFFF' : themeObj.colors.textSecondary}
        />
      );
    }
    return (
      <MaterialIcons
        name={cat?.icon}
        size={16}
        color={selectedCategory === category.id ? '#FFFFFF' : themeObj.colors.textSecondary}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadReports}
            colors={[themeObj.colors.primary]}
            tintColor={themeObj.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.userGreeting}>
              <Text style={styles.greetingText}>{t('hello')},</Text>
              <Text style={styles.userName}>
                {userName || t('urbanSupervisor')}
              </Text>
            </View>
            <Text style={styles.welcomeText}>{t('welcomeToDashboard')}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <MaterialIcons name="notifications" size={24} color={themeObj.colors.textPrimary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <MaterialIcons name="person" size={20} color={themeObj.colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color={themeObj.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Popup për njoftimet */}
        {showNotifications && (
          <View style={styles.notificationsPopup}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>{t('notifications')}</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <MaterialIcons name="close" size={20} color={themeObj.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationItem}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
              <Text style={styles.notificationText}>{t('reportAccepted')}</Text>
            </View>

            <View style={styles.notificationItem}>
              <MaterialIcons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.notificationText}>{t('newReportsInArea')}</Text>
            </View>

            {/* ✅ NEW: Continue Draft */}
            <TouchableOpacity
              style={styles.notificationItem}
              onPress={() => router.push('/report')}
            >
              <MaterialIcons name="edit" size={16} color={themeObj.colors.primary} />
              <Text style={styles.notificationText}>{t('continueDraft')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistikat */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContainer}
        >
          <View style={[styles.statCard, { backgroundColor: themeObj.colors.primary }]}>
            <MaterialIcons name="description" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('totalReports')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>{t('resolved')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <MaterialIcons name="pending" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{t('pending')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
            <MaterialIcons name="warning" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.urgent}</Text>
            <Text style={styles.statLabel}>{t('urgent')}</Text>
          </View>
        </ScrollView>

        {/* Harta Interaktive */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('activeReportsMap')}</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewFullMap}
            >
              <Text style={styles.viewAllText}>{t('viewFullMap')}</Text>
              <MaterialIcons name="chevron-right" size={20} color={themeObj.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ✅ NEW: Distance Filter Toggle */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[5, 10, 0].map(km => (
              <TouchableOpacity
                key={km}
                onPress={() => setDistanceKm(km)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: distanceKm === km ? themeObj.colors.primary : themeObj.colors.surface,
                }}
              >
                <Text style={{
                  fontWeight: '700',
                  color: distanceKm === km ? '#fff' : themeObj.colors.textSecondary
                }}>
                  {km === 0 ? t('all') : `${km}km`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <MapDisplay />
        </View>

        {/* Filtri sipas Kategorisë */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>{t('filterByCategory')}</Text>
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
                <CategoryIcon category={category} />
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

        {/* Raportet e Fundit */}
        <View style={styles.reportsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('latestReports')}</Text>
            <TouchableOpacity
              style={styles.newReportButton}
              onPress={() => router.push('/report')}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.newReportText}>{t('newReport')}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ NEW: Sort Controls */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { id: 'newest', label: t('newest') },
              { id: 'urgent', label: t('urgentFirst') },
              { id: 'nearest', label: t('nearest') },
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSortMode(opt.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: sortMode === opt.id ? themeObj.colors.primary : themeObj.colors.surface,
                }}
              >
                <Text style={{
                  fontWeight: '700',
                  color: sortMode === opt.id ? '#fff' : themeObj.colors.textSecondary
                }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {displayedReports.length > 0 ? (
            <FlatList
              data={displayedReports.slice(0, 5)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={renderReportCard}
              contentContainerStyle={styles.reportsList}
            />
          ) : (
            <View style={styles.emptyReports}>
              <MaterialIcons name="inbox" size={64} color={themeObj.colors.border} />
              <Text style={styles.emptyReportsTitle}>{t('noReports')}</Text>
              <Text style={styles.emptyReportsText}>
                {selectedCategory !== 'all'
                  ? t('noReportsInCategory', { category: t(selectedCategory) })
                  : t('startByReporting')
                }
              </Text>
              <TouchableOpacity
                style={styles.firstReportButton}
                onPress={() => router.push('/report')}
              >
                <Text style={styles.firstReportButtonText}>{t('createFirstReport')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {displayedReports.length > 5 && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/reports')}
            >
              <Text style={styles.seeAllText}>{t('seeAllReports')}</Text>
              <MaterialIcons name="chevron-right" size={20} color={themeObj.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Veprimet e Shpejta */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/report')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: themeObj.colors.primary + '15' }]}>
                <MaterialIcons name="add-circle" size={28} color={themeObj.colors.primary} />
              </View>
              <Text style={styles.quickActionText}>{t('newReport')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B98115' }]}>
                <MaterialIcons name="person" size={28} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>{t('profile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/analytics')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F59E0B15' }]}>
                <MaterialIcons name="analytics" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>{t('analytics')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4F46E515' }]}>
                <MaterialIcons name="settings" size={28} color="#4F46E5" />
              </View>
              <Text style={styles.quickActionText}>{t('settings')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Butoni Fluturues */}
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

// Krijo theme context dhe styles dinamike
function getStyles(theme) {
  const safeTheme = {
    colors: {
      ...theme.colors,
      urgent: theme.colors.urgent || '#EF4444',
      urgentBackground: theme.colors.urgentBackground || '#FEE2E2',
      surface: theme.colors.surface || '#F3F4F6',
    }
  };

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: safeTheme.colors.background },
    container: { flex: 1 },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 10 : 30,
      paddingBottom: 20,
      backgroundColor: safeTheme.colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: safeTheme.colors.border,
    },
    headerLeft: { flex: 1 },
    userGreeting: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    greetingText: { fontSize: 16, color: safeTheme.colors.textSecondary, marginRight: 8 },
    userName: { fontSize: 24, fontWeight: '700', color: safeTheme.colors.textPrimary },
    welcomeText: { fontSize: 14, color: safeTheme.colors.textTertiary },

    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    notificationButton: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: safeTheme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: safeTheme.colors.danger,
      borderWidth: 1,
      borderColor: safeTheme.colors.cardBackground,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: safeTheme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: safeTheme.colors.danger + '10',
      justifyContent: 'center',
      alignItems: 'center',
    },

    notificationsPopup: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 110 : 130,
      right: 24,
      backgroundColor: safeTheme.colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 10,
      zIndex: 1000,
      width: 280,
      borderWidth: 1,
      borderColor: safeTheme.colors.border,
    },
    notificationsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: safeTheme.colors.border,
    },
    notificationsTitle: { fontSize: 16, fontWeight: '700', color: safeTheme.colors.textPrimary },
    notificationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
    notificationText: { fontSize: 14, color: safeTheme.colors.textSecondary, flex: 1 },

    statsScroll: { marginTop: 8 },
    statsContainer: { paddingHorizontal: 24, paddingVertical: 16, gap: 16 },
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
    statNumber: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginVertical: 8 },
    statLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', opacity: 0.9 },

    mapSection: { marginTop: 24, paddingHorizontal: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: safeTheme.colors.textPrimary },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: safeTheme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    viewAllText: { fontSize: 14, fontWeight: '600', color: safeTheme.colors.primary, marginRight: 2 },

    mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', position: 'relative' },
    map: { flex: 1 },

    userMarker: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    customMarker: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#10B981',
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
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    mapLocationInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    mapLocationText: { fontSize: 12, fontWeight: '600', color: safeTheme.colors.textPrimary, marginLeft: 4 },
    mapOverlayText: { fontSize: 12, fontWeight: '500', color: safeTheme.colors.textSecondary, textAlign: 'center' },

    noMapContainer: {
      height: 200,
      borderRadius: 20,
      backgroundColor: safeTheme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    noMapText: { marginTop: 12, fontSize: 14, color: safeTheme.colors.textSecondary, textAlign: 'center' },

    categorySection: { marginTop: 32, paddingHorizontal: 24 },
    categoryContainerScroll: { gap: 12, paddingVertical: 8 },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: safeTheme.colors.surface,
      gap: 8,
    },
    categoryButtonActive: { backgroundColor: safeTheme.colors.primary },
    categoryButtonText: { fontSize: 14, fontWeight: '600', color: safeTheme.colors.textSecondary },
    categoryButtonTextActive: { color: '#FFFFFF' },

    reportsSection: { marginTop: 32, paddingHorizontal: 24, paddingBottom: 32 },
    newReportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: safeTheme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 8,
    },
    newReportText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    reportsList: { gap: 16 },

    card: {
      backgroundColor: safeTheme.colors.cardBackground,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryIcon: { marginRight: 4 },
    cardCategory: { fontSize: 14, fontWeight: '600', color: safeTheme.colors.primary, textTransform: 'capitalize' },

    priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    cardTitle: { fontSize: 18, fontWeight: '700', color: safeTheme.colors.textPrimary, marginBottom: 8, lineHeight: 24 },
    cardDescription: { fontSize: 14, color: safeTheme.colors.textSecondary, lineHeight: 20, marginBottom: 16 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 12, color: safeTheme.colors.textSecondary, maxWidth: 120 },
    metaContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dateText: { fontSize: 12, color: safeTheme.colors.textTertiary },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    emptyReports: { alignItems: 'center', paddingVertical: 48, backgroundColor: safeTheme.colors.surface, borderRadius: 20, marginTop: 16 },
    emptyReportsTitle: { fontSize: 18, fontWeight: '600', color: safeTheme.colors.textPrimary, marginTop: 16 },
    emptyReportsText: { fontSize: 14, color: safeTheme.colors.textTertiary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },
    firstReportButton: { marginTop: 24, backgroundColor: safeTheme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    firstReportButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

    seeAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 16 },
    seeAllText: { fontSize: 14, fontWeight: '600', color: safeTheme.colors.primary, marginRight: 4 },

    quickActionsSection: { marginTop: 24, paddingHorizontal: 24, paddingBottom: 40 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16, gap: 16 },
    quickAction: {
      width: (width - 64) / 2 - 8,
      alignItems: 'center',
      backgroundColor: safeTheme.colors.cardBackground,
      padding: 20,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    quickActionText: { fontSize: 14, fontWeight: '600', color: safeTheme.colors.textPrimary, textAlign: 'center' },

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
      backgroundColor: safeTheme.colors.primary,
    },
  });
}

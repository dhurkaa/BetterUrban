import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// përdor storage utils (siç e ke)
import { getReportById, updateReportStatus, deleteReport } from '../utils/storage';

export default function ReportDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      // report
      const r = await getReportById(id);
      setReport(r || null);

      // userLocation (opsionale)
      const locRaw = await AsyncStorage.getItem('userLocation');
      setUserLocation(locRaw ? JSON.parse(locRaw) : null);
    } catch (e) {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'urgent': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'infrastructure': return 'road';
      case 'environment': return 'leaf';
      case 'security': return 'shield-alt';
      default: return 'map-marker-alt';
    }
  };

  const categoryLabel = (category) => {
    switch (category) {
      case 'infrastructure': return 'Infrastrukturë';
      case 'environment': return 'Mjedis / Pastërti';
      case 'security': return 'Siguri / Ndriçim';
      default: return 'Të Tjera';
    }
  };

  const priorityLabel = (p) => {
    switch (p) {
      case 'low': return 'I Ulët';
      case 'high': return 'I Lartë';
      case 'urgent': return 'Urgjent';
      default: return 'Normal';
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const distanceKm = useMemo(() => {
    if (!userLocation?.latitude || !report?.location?.latitude) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      report.location.latitude,
      report.location.longitude
    );
  }, [userLocation, report]);

  const handleResolved = async () => {
    if (!report?.id) return;
    try {
      await updateReportStatus(report.id, 'resolved');
      await load();
      Alert.alert('U Krye', 'Raporti u shënua si i zgjidhur.');
    } catch {
      Alert.alert('Gabim', 'Nuk u përditësua statusi.');
    }
  };

  const handleDelete = async () => {
    if (!report?.id) return;

    Alert.alert(
      'Fshi raportin?',
      'Kjo veprim nuk mund të kthehet mbrapa.',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteReport(report.id);
            if (ok) {
              Alert.alert('U fshi', 'Raporti u fshi me sukses.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } else {
              Alert.alert('Gabim', 'Nuk u fshi raporti.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Duke u ngarkuar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <MaterialIcons name="error-outline" size={40} color="#EF4444" />
          <Text style={styles.loadingText}>Raporti nuk u gjet.</Text>
          <TouchableOpacity style={styles.backPrimary} onPress={() => router.back()}>
            <Text style={styles.backPrimaryText}>Kthehu mbrapa</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(report.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>Detajet e Raportit</Text>

          <TouchableOpacity style={styles.headerBtn} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        {report.image ? (
          <View style={styles.heroWrap}>
            <Image source={{ uri: report.image }} style={styles.heroImage} />
            <View style={styles.heroOverlay}>
              <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
                <View style={[styles.dot, { backgroundColor: statusColor }]} />
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {(report.status || 'pending').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.categoryRow}>
              <FontAwesome5 name={getCategoryIcon(report.category)} size={14} color="#3B82F6" />
              <Text style={styles.categoryText}>{categoryLabel(report.category)}</Text>
            </View>

            <View style={[styles.priorityPill, report.priority === 'urgent' && styles.priorityUrgent]}>
              <MaterialIcons name="warning" size={14} color={report.priority === 'urgent' ? '#EF4444' : '#6B7280'} />
              <Text style={[styles.priorityText, report.priority === 'urgent' && { color: '#EF4444' }]}>
                {priorityLabel(report.priority)}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.desc}>{report.description}</Text>

          <View style={styles.divider} />

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="location-on" size={18} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Lokacioni</Text>
                <Text style={styles.metaValue} numberOfLines={2}>
                  {report.location?.address || 'Lokacion i panjohur'}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={18} color="#6B7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Data</Text>
                <Text style={styles.metaValue}>
                  {new Date(report.timestamp).toLocaleString('en-GB')}
                </Text>
              </View>
            </View>

            {distanceKm ? (
              <View style={styles.metaItem}>
                <MaterialIcons name="near-me" size={18} color="#6B7280" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Distanca</Text>
                  <Text style={styles.metaValue}>{distanceKm} km</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, report.status === 'resolved' && { opacity: 0.5 }]}
            onPress={handleResolved}
            disabled={report.status === 'resolved'}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Marko si i zgjidhur</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => router.push('/reports')}>
            <MaterialIcons name="list" size={20} color="#111827" />
            <Text style={[styles.actionText, { color: '#111827' }]}>Shiko të gjitha</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingBottom: 28 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 18,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827'
  },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
  backPrimary: { marginTop: 14, backgroundColor: '#3B82F6', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  backPrimaryText: { color: '#FFFFFF', fontWeight: '700' },

  heroWrap: {
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroImage: { width: '100%', height: 220 },
  heroOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },

  card: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryText: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },

  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  priorityUrgent: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  priorityText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },

  title: { marginTop: 12, fontSize: 20, fontWeight: '900', color: '#111827' },
  desc: { marginTop: 8, fontSize: 14, color: '#374151', lineHeight: 20 },

  divider: { marginTop: 14, height: 1, backgroundColor: '#E5E7EB' },

  metaRow: { marginTop: 14, gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  metaValue: { marginTop: 2, fontSize: 13, color: '#111827', fontWeight: '700' },

  actions: { marginTop: 14, marginHorizontal: 20, gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0
  },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});

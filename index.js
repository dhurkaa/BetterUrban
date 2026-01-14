import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getReports } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => { if (isFocused) loadReports(); }, [isFocused]);

  const loadReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Urbana</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Dil</Text>
        </TouchableOpacity>
      </View>

      {/* Mini Harta për Vizualizim */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={{
          latitude: 41.3275, longitude: 19.8187, latitudeDelta: 0.05, longitudeDelta: 0.05,
        }}>
          {reports.map(r => r.location && (
            <Marker key={r.id} coordinate={{ latitude: r.location.lat, longitude: r.location.lng }} title={r.category} />
          ))}
        </MapView>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImg} />
            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{item.category}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'Zgjidhur' ? '#dcfce7' : '#fee2e2' }]}>
                   <Text style={{ fontSize: 10, color: '#166534' }}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/report')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '900', color: '#1e40af' },
  logoutBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: 'bold' },
  mapContainer: { height: 180, margin: 15, borderRadius: 15, overflow: 'hidden', elevation: 2 },
  map: { flex: 1 },
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  cardImg: { width: '100%', height: 120 },
  cardContent: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cardDesc: { color: '#64748b', marginTop: 4, fontSize: 14 },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#2563eb', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.3 },
  fabText: { color: '#fff', fontSize: 32, fontWeight: '300' }
});
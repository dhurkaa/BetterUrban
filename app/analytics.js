import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

// NËSE e ke useLanguage (si në projektin tënd), lëre ON.
// Nëse jo, komento rreshtin poshtë dhe përdor tekst statik.
import { useLanguage } from './utils/language';

const REPORTS_KEY = 'reports';
const { width } = Dimensions.get('window');

const safeParse = (json, fallback) => {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeStatus = (r) => {
  const s = (r?.status ?? r?.state ?? '').toString().toLowerCase();
  if (['resolved', 'done', 'fixed', 'closed'].includes(s)) return 'resolved';
  if (['open', 'pending', 'new', 'submitted'].includes(s)) return 'open';
  return s || 'open';
};

const normalizeCategory = (r) => (r?.category ?? r?.type ?? 'Other').toString().trim() || 'Other';
const normalizeCity = (r) =>
  (r?.city ?? r?.location?.city ?? r?.address?.city ?? 'Unknown').toString().trim() || 'Unknown';

const normalizeCreatedAt = (r) => {
  const raw = r?.createdAt ?? r?.date ?? r?.timestamp;
  if (!raw) return null;

  const d1 = new Date(raw);
  if (!isNaN(d1.getTime())) return d1;

  const n = Number(raw);
  if (!isNaN(n)) {
    const d2 = new Date(n);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const formatDayLabel = (d) => d.toLocaleDateString(undefined, { weekday: 'short' });

const Card = ({ title, icon, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>
    {children}
  </View>
);

const StatPill = ({ label, value, tone = 'blue' }) => (
  <View
    style={[
      styles.pill,
      tone === 'green' ? styles.pillGreen : tone === 'red' ? styles.pillRed : styles.pillBlue,
    ]}
  >
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>{value}</Text>
  </View>
);

const MiniBarChart = ({ data, height = 140 }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[styles.chartWrap, { height }]}>
      {data.map((d, idx) => {
        const barH = Math.round((d.value / max) * (height - 34));
        return (
          <View key={`${d.label}-${idx}`} style={styles.chartCol}>
            <View style={[styles.bar, { height: barH }]} />
            <Text style={styles.chartLabel} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={styles.chartValue}>{d.value}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function Analytics() {
  const router = useRouter();
  const { t } = useLanguage(); // nëse s’e ke, hiqe dhe përdor tekst statik

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);

  const loadReports = useCallback(async () => {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const list = raw ? safeParse(raw, []) : [];
    setReports(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadReports();
      setLoading(false);
    })();
  }, [loadReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  const analytics = useMemo(() => {
    const total = reports.length;

    const byStatus = { open: 0, resolved: 0, other: 0 };
    const byCategory = new Map();
    const byCity = new Map();

    // last 7 days
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return d;
    });
    const dayCounts = new Map(days.map((d) => [d.getTime(), 0]));

    for (const r of reports) {
      const st = normalizeStatus(r);
      if (st === 'open') byStatus.open += 1;
      else if (st === 'resolved') byStatus.resolved += 1;
      else byStatus.other += 1;

      const cat = normalizeCategory(r);
      byCategory.set(cat, (byCategory.get(cat) || 0) + 1);

      const city = normalizeCity(r);
      byCity.set(city, (byCity.get(city) || 0) + 1);

      const created = normalizeCreatedAt(r);
      if (created) {
        const key = startOfDay(created).getTime();
        if (dayCounts.has(key)) dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      }
    }

    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const topCities = Array.from(byCity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const last7Days = days.map((d) => ({ label: formatDayLabel(d), value: dayCounts.get(d.getTime()) || 0 }));
    const topCity = topCities[0]?.label || '—';
    const resolvedRate = total ? Math.round((byStatus.resolved / total) * 100) : 0;

    return { total, byStatus, topCategories, topCities, last7Days, topCity, resolvedRate };
  }, [reports]);

  return (
    <View style={styles.container}>
      {/* ✅ Heq header-in e bardhë “analytics” */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>{t ? t('analytics') : 'Analytics'}</Text>
          <Text style={styles.topSub}>{t ? t('insights') : 'Insights from your reports'}</Text>
        </View>

        <TouchableOpacity style={styles.topBtn} onPress={onRefresh} activeOpacity={0.85}>
          <MaterialIcons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
          showsVerticalScrollIndicator={false}
        >
          <Card
            title={t ? t('overview') : 'Overview'}
            icon={<MaterialIcons name="insights" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />}
          >
            <View style={styles.pillsRow}>
              <StatPill label={t ? t('total_reports') : 'Total Reports'} value={analytics.total} tone="blue" />
              <StatPill label={t ? t('open') : 'Open'} value={analytics.byStatus.open} tone="red" />
              <StatPill label={t ? t('resolved') : 'Resolved'} value={analytics.byStatus.resolved} tone="green" />
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>{t ? t('resolved_rate') : 'Resolved rate'}</Text>
                <Text style={styles.metricValue}>{analytics.resolvedRate}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>{t ? t('top_city') : 'Top city'}</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {analytics.topCity}
                </Text>
              </View>
            </View>
          </Card>

          <Card
            title={t ? t('last_7_days') : 'Last 7 days'}
            icon={<MaterialIcons name="timeline" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />}
          >
            <MiniBarChart data={analytics.last7Days} height={150} />
          </Card>

          <Card
            title={t ? t('top_categories') : 'Top categories'}
            icon={<MaterialIcons name="category" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />}
          >
            {analytics.topCategories.length ? (
              <MiniBarChart data={analytics.topCategories} height={170} />
            ) : (
              <Text style={styles.emptyText}>{t ? t('no_data') : 'No data yet.'}</Text>
            )}
          </Card>

          <Card
            title={t ? t('top_cities') : 'Top cities'}
            icon={<MaterialIcons name="location-city" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />}
          >
            {analytics.topCities.length ? (
              <MiniBarChart data={analytics.topCities} height={170} />
            ) : (
              <Text style={styles.emptyText}>{t ? t('no_data') : 'No data yet.'}</Text>
            )}
          </Card>

          <View style={{ height: 18 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061A2B' },

  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 30, 60, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 12,
  },
  topTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  topSub: { color: 'rgba(255,255,255,0.7)', marginTop: 2, fontSize: 12, fontWeight: '600' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 30 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: (width - 16 * 2 - 10) / 2,
  },
  pillBlue: { backgroundColor: 'rgba(14,165,233,0.12)', borderWidth: 1, borderColor: 'rgba(14,165,233,0.25)' },
  pillGreen: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  pillRed: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  pillLabel: { color: '#334155', fontWeight: '700', fontSize: 12 },
  pillValue: { color: '#0f172a', fontWeight: '900', fontSize: 20, marginTop: 4 },

  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(2,132,199,0.07)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(2,132,199,0.15)',
  },
  metricLabel: { color: '#475569', fontWeight: '700', fontSize: 12 },
  metricValue: { color: '#0f172a', fontWeight: '900', fontSize: 16, marginTop: 6 },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, gap: 8 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 10, backgroundColor: 'rgba(14,165,233,0.85)' },
  chartLabel: { marginTop: 8, fontSize: 11, color: '#334155', fontWeight: '800' },
  chartValue: { marginTop: 2, fontSize: 11, color: '#0f172a', fontWeight: '900' },

  emptyText: { color: '#475569', fontWeight: '700' },
});

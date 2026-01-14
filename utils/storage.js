import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTS_KEY = '@urban_reports';

export const saveReport = async (report) => {
  try {
    const existingReports = await getReports();
    const updatedReports = [report, ...existingReports];
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
  } catch (e) {
    console.error("Gabim gjatë ruajtjes:", e);
  }
};

export const getReports = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(REPORTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    return [];
  }
};
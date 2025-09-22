import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';

export default function HomeScreen() {
  const {
    location,
    loading,
    permissionStatus,
    openSettings,
    getCurrentLocation,
    startWatching,
    stopWatching,
  } = useCurrentPosition();

  if (loading) return <LoadingScreen />;
  if (permissionStatus !== 'granted') return <UnauthorizedScreen openSettings={openSettings} />;

  return (
    <View style={styles.container}>
      {location ? (
        <View style={styles.card}>
          <Text style={styles.title}>📍 Position actuelle</Text>
          <Text style={styles.coords}>Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.coords}>Lng: {location.longitude.toFixed(6)}</Text>
          <Text style={styles.coords}>
            Précision: {location.accuracy ? `${location.accuracy.toFixed(0)} m` : 'N/A'}
          </Text>
          <Text style={styles.timestamp}>
            ⏰ {new Date(location.timestamp).toLocaleTimeString('fr-FR')}
          </Text>
        </View>
      ) : (
        <Text style={styles.noLocation}>Aucune position disponible</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.refresh]} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>🔄 Rafraîchir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.watch]} onPress={startWatching}>
          <Text style={styles.buttonText}>▶️ Suivi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.stop]} onPress={stopWatching}>
          <Text style={styles.buttonText}>⏹️ Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#2d5a3d' },
  coords: { fontSize: 16, marginBottom: 6, color: '#333' },
  timestamp: { fontSize: 14, color: '#666', marginTop: 8 },
  noLocation: { fontSize: 16, color: '#999', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  refresh: { backgroundColor: '#2d5a3d' },
  watch: { backgroundColor: '#4caf50' },
  stop: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

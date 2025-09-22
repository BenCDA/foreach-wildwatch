import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  openSettings: () => void;
}

export default function UnauthorizedScreen({ openSettings }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permission refusée</Text>
      <Text style={styles.subtitle}>
        L’application a besoin de la géolocalisation pour fonctionner.
      </Text>
      <TouchableOpacity style={styles.button} onPress={openSettings}>
        <Text style={styles.buttonText}>Ouvrir les paramètres</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#555' },
  button: { backgroundColor: '#2d5a3d', padding: 14, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

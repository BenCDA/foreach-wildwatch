import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Observation } from '../services/storage';

export default function ObservationModal({
  visible,
  onClose,
  onSave,
  initialCoords,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (obs: Omit<Observation, 'id' | 'createdAt'> & { id?: string }) => void;
  initialCoords: { latitude: number; longitude: number } | null;
}) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImageUri(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setImageUri(res.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!initialCoords) return;
    onSave({
      id: undefined,
      name: name || 'Observation',
      date,
      latitude: initialCoords.latitude,
      longitude: initialCoords.longitude,
      imageUri,
    });
    setName('');
    setImageUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Nouvelle observation</Text>
          <TextInput
            placeholder="Nom"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            style={styles.input}
          />
          <View style={styles.imageRow}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text>Pas d'image</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <TouchableOpacity style={styles.smallButton} onPress={takePhoto}>
                <Text style={styles.smallButtonText}>Appareil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
                <Text style={styles.smallButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.btnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.save]} onPress={handleSave}>
              <Text style={styles.btnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 12 },
  imageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  thumbPlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#fafafa', justifyContent: 'center', alignItems: 'center' },
  smallButton: { backgroundColor: '#2d5a3d', padding: 8, borderRadius: 8, marginBottom: 8 },
  smallButtonText: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#ddd', marginRight: 8 },
  save: { backgroundColor: '#2d5a3d' },
  btnText: { color: '#fff', fontWeight: '700' },
});

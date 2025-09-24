import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

MapboxGL.setAccessToken("pk.eyJ1Ijoic3JheW5hdWQtbGFtb2JpbGVyeSIsImEiOiJjbWZmdTRienQwb2F4MmtzYmprNWxieWZwIn0.mgySs3rW_6jA7hEKCF7ycw");

type WildlifeObservation = {
  id: string;
  coordinate: [number, number];
  species: string;
  description?: string;
  timestamp: Date;
  imageUri?: string;
  weather?: string;
};

export default function MapScreen() {
  const { location, loading, permissionStatus, openSettings } = useCurrentPosition();
  const [observations, setObservations] = useState<WildlifeObservation[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<WildlifeObservation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedObservation, setEditedObservation] = useState<{ species: string; description: string }>({ species: '', description: '' });
  const [newObservation, setNewObservation] = useState({
    species: '',
    description: '',
    imageUri: '',
    coordinate: [0, 0] as [number, number],
  });
  const cameraRef = useRef<MapboxGL.Camera>(null);

  if (loading) return <LoadingScreen />;
  if (permissionStatus !== 'granted') {
    return <UnauthorizedScreen openSettings={openSettings} />;
  }

  // Ouvrir le modal d'ajout avec la position actuelle
  const openAddObservation = () => {
    if (location) {
      setNewObservation({
        ...newObservation,
        coordinate: [location.longitude, location.latitude],
      });
      setShowAddModal(true);
    }
  };

  // Prendre une photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setNewObservation({ ...newObservation, imageUri: result.assets[0].uri });
    }
  };

  // Choisir depuis la galerie
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setNewObservation({ ...newObservation, imageUri: result.assets[0].uri });
    }
  };

  // Enregistrer l'observation
  const saveObservation = () => {
    if (!newObservation.species.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de l\'espèce');
      return;
    }

    const observation: WildlifeObservation = {
      id: Date.now().toString(),
      coordinate: newObservation.coordinate,
      species: newObservation.species,
      description: newObservation.description,
      timestamp: new Date(),
      imageUri: newObservation.imageUri,
    };

    setObservations([...observations, observation]);
    setShowAddModal(false);
    setNewObservation({
      species: '',
      description: '',
      imageUri: '',
      coordinate: [0, 0],
    });
  };

  // Supprimer une observation
  const deleteObservation = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette observation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setObservations(observations.filter(obs => obs.id !== id));
            setShowDetailModal(false);
          }
        }
      ]
    );
  };

  // Partager une observation
  const shareObservation = async (obs: WildlifeObservation) => {
    try {
      await Share.share({
        message: `J'ai observé: ${obs.species}\n${obs.description || ''}\nLe ${obs.timestamp.toLocaleDateString()}`,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  };

  // Entrer en mode édition
  const startEditMode = (obs: WildlifeObservation) => {
    setEditedObservation({
      species: obs.species,
      description: obs.description || '',
    });
    setIsEditMode(true);
  };

  // Sauvegarder les modifications
  const saveEditedObservation = () => {
    if (!selectedObservation) return;

    if (!editedObservation.species.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de l\'espèce');
      return;
    }

    const updatedObservations = observations.map(obs =>
      obs.id === selectedObservation.id
        ? { ...obs, species: editedObservation.species, description: editedObservation.description }
        : obs
    );

    setObservations(updatedObservations);
    setSelectedObservation({
      ...selectedObservation,
      species: editedObservation.species,
      description: editedObservation.description,
    });
    setIsEditMode(false);
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditedObservation({ species: '', description: '' });
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={location ? [location.longitude, location.latitude] : [2.3522, 48.8566]}
        />

        {/* Position actuelle */}
        {location && (
          <MapboxGL.PointAnnotation
            id="current-location"
            coordinate={[location.longitude, location.latitude]}
          >
            <View style={styles.currentLocation}>
              <View style={styles.currentLocationDot} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Observations */}
        {observations.map((obs) => (
          <MapboxGL.PointAnnotation
            key={obs.id}
            id={obs.id}
            coordinate={obs.coordinate}
            onSelected={() => {
              setSelectedObservation(obs);
              setShowDetailModal(true);
            }}
          >
            <View style={styles.observationMarker}>
              {obs.imageUri ? (
                <Image source={{ uri: obs.imageUri }} style={styles.markerImage} />
              ) : (
                <Text style={styles.markerEmoji}>🦌</Text>
              )}
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Bouton d'ajout flottant */}
      <TouchableOpacity style={styles.addButton} onPress={openAddObservation}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal d'ajout */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle Observation</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photo */}
              <View style={styles.photoSection}>
                {newObservation.imageUri ? (
                  <Image source={{ uri: newObservation.imageUri }} style={styles.observationImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={40} color="#ccc" />
                  </View>
                )}
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={20} color="white" />
                    <Text style={styles.photoButtonText}>Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Ionicons name="images" size={20} color="white" />
                    <Text style={styles.photoButtonText}>Galerie</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Espèce */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'espèce</Text>
                <TextInput
                  style={styles.input}
                  value={newObservation.species}
                  onChangeText={(text) => setNewObservation({ ...newObservation, species: text })}
                  placeholder="Ex: Écureuil roux"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newObservation.description}
                  onChangeText={(text) => setNewObservation({ ...newObservation, description: text })}
                  placeholder="Comportement observé, nombre d'individus..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Date et heure */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.infoText}>{new Date().toLocaleDateString('fr-FR')}</Text>
                <Ionicons name="time" size={16} color="#666" style={{ marginLeft: 15 }} />
                <Text style={styles.infoText}>{new Date().toLocaleTimeString('fr-FR')}</Text>
              </View>

              {/* Boutons */}
              <TouchableOpacity style={styles.saveButton} onPress={saveObservation}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal détail */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowDetailModal(false);
          setIsEditMode(false);
          setEditedObservation({ species: '', description: '' });
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Observation</Text>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setIsEditMode(false);
                setEditedObservation({ species: '', description: '' });
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedObservation && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedObservation.imageUri && (
                  <Image 
                    source={{ uri: selectedObservation.imageUri }} 
                    style={styles.detailImage} 
                  />
                )}
                
                <View style={styles.detailInfo}>
                  {isEditMode ? (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom de l'espèce</Text>
                        <TextInput
                          style={styles.input}
                          value={editedObservation.species}
                          onChangeText={(text) => setEditedObservation({ ...editedObservation, species: text })}
                          placeholder="Ex: Écureuil roux"
                          placeholderTextColor="#999"
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (optionnel)</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editedObservation.description}
                          onChangeText={(text) => setEditedObservation({ ...editedObservation, description: text })}
                          placeholder="Comportement observé, nombre d'individus..."
                          placeholderTextColor="#999"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.detailSpecies}>{selectedObservation.species}</Text>
                      {selectedObservation.description && (
                        <Text style={styles.detailDescription}>{selectedObservation.description}</Text>
                      )}
                    </>
                  )}

                  <View style={styles.detailMeta}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        {selectedObservation.timestamp.toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  {isEditMode ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={saveEditedObservation}
                      >
                        <Text style={styles.actionButtonText}>Sauvegarder</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={cancelEdit}
                      >
                        <Text style={styles.actionButtonText}>Annuler</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => startEditMode(selectedObservation)}
                      >
                        <Text style={styles.actionButtonText}>Modifier</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={() => shareObservation(selectedObservation)}
                      >
                        <Text style={styles.actionButtonText}>Partager</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteObservation(selectedObservation.id)}
                      >
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  currentLocation: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  currentLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  observationMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  markerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  markerEmoji: {
    fontSize: 28,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  observationImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  detailImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
  },
  detailInfo: {
    marginBottom: 20,
  },
  detailSpecies: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 15,
  },
  detailMeta: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  editButton: {
    backgroundColor: '#FF9500',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
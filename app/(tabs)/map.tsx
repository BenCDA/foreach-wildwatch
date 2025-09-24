import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as ImagePicker from 'expo-image-picker';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';
import { Ionicons } from '@expo/vector-icons';

MapboxGL.setAccessToken("pk.eyJ1Ijoic3JheW5hdWQtbGFtb2JpbGVyeSIsImEiOiJjbWZmdTRienQwb2F4MmtzYmprNWxieWZwIn0.mgySs3rW_6jA7hEKCF7ycw");

// Composant marqueur animé
const AnimatedMarker = ({ observation, onPress }: { observation: WildlifeObservation, onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'apparition
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Animation de pulsation continue
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.markerTouchable}>
      <Animated.View style={[
        styles.observationMarker,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim }
          ]
        }
      ]}>
        <View style={styles.markerShadow}>
          <View style={styles.markerContainer}>
            {observation.imageUri ? (
              <Image source={{ uri: observation.imageUri }} style={styles.markerImage} />
            ) : (
              <View style={styles.markerIconContainer}>
                <Text style={styles.markerEmoji}>🦌</Text>
              </View>
            )}
            <View style={styles.markerBadge}>
              <View style={styles.markerDot} />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Composant position actuelle animée
const AnimatedCurrentLocation = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <View style={styles.currentLocation}>
      <Animated.View style={[
        styles.currentLocationPulse,
        {
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        }
      ]} />
      <View style={styles.currentLocationDot} />
    </View>
  );
};

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
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Animation d'ouverture de modal
  useEffect(() => {
    if (showAddModal || showDetailModal) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    }
  }, [showAddModal, showDetailModal]);

  if (loading) return <LoadingScreen />;
  if (permissionStatus !== 'granted') {
    return <UnauthorizedScreen openSettings={openSettings} />;
  }

  // Ouvrir le modal d'ajout avec la position actuelle
  const openAddObservation = () => {
    // Animation du bouton
    Animated.sequence([
      Animated.timing(addButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
            <AnimatedCurrentLocation />
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
            <AnimatedMarker
              observation={obs}
              onPress={() => {
                setSelectedObservation(obs);
                setShowDetailModal(true);
              }}
            />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Bouton d'ajout flottant */}
      <Animated.View style={[styles.addButton, { transform: [{ scale: addButtonScale }] }]}>
        <TouchableOpacity style={styles.addButtonInner} onPress={openAddObservation}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal d'ajout */}
      <Modal
        visible={showAddModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <Animated.View style={[styles.modalContainer, { opacity: modalOpacity }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <Animated.View style={[
              styles.modalContent,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }
            ]}>
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
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* Modal détail */}
      <Modal
        visible={showDetailModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => {
          setShowDetailModal(false);
          setIsEditMode(false);
          setEditedObservation({ species: '', description: '' });
        }}
      >
        <Animated.View style={[styles.modalContainer, { opacity: modalOpacity }]}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            }
          ]}>
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
          </Animated.View>
        </Animated.View>
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    top: -10,
    left: -10,
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  observationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerTouchable: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  markerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  markerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 24,
  },
  markerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  addButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
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
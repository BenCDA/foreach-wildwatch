// app/(tabs)/map.tsx

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MapViewWrapper } from '@/components/MapViewWrapper';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';

MapboxGL.setAccessToken("pk.eyJ1Ijoic3JheW5hdWQtbGFtb2JpbGVyeSIsImEiOiJjbWZmdTRienQwb2F4MmtzYmprNWxieWZwIn0.mgySs3rW_6jA7hEKCF7ycw");

type WildlifeObservation = {
  id: string;
  coordinate: [number, number];
  species: string;
  timestamp: Date;
};

export default function MapScreen() {
  const { location, loading, permissionStatus, openSettings } = useCurrentPosition();
  const [observations, setObservations] = useState<WildlifeObservation[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);

  if (loading) return <LoadingScreen />;
  if (permissionStatus !== 'granted') {
    return <UnauthorizedScreen openSettings={openSettings} />;
  }

  const handleMapPress = (feature: any) => {
    if (!isAddMode) return;
    
    const coordinates = feature.geometry.coordinates;
    const newObservation: WildlifeObservation = {
      id: Date.now().toString(),
      coordinate: coordinates as [number, number],
      species: 'Nouvelle observation',
      timestamp: new Date(),
    };
    
    setObservations([...observations, newObservation]);
    setIsAddMode(false);
  };

  return (
    <View style={styles.container}>
      <MapViewWrapper onPress={handleMapPress}>
        {location && (
          <>
            <MapboxGL.Camera
              zoomLevel={14}
              centerCoordinate={[location.longitude, location.latitude]}
            />
            <MapboxGL.PointAnnotation
              id="current-location"
              coordinate={[location.longitude, location.latitude]}
            >
              <View style={styles.userLocation} />
            </MapboxGL.PointAnnotation>
          </>
        )}
        
        {observations.map((obs) => (
          <MapboxGL.PointAnnotation
            key={obs.id}
            id={obs.id}
            coordinate={obs.coordinate}
          >
            <View style={styles.observation} />
          </MapboxGL.PointAnnotation>
        ))}
      </MapViewWrapper>
      
      <TouchableOpacity 
        style={[styles.addButton, isAddMode && styles.addButtonActive]}
        onPress={() => setIsAddMode(!isAddMode)}
      >
        <Text style={styles.addButtonText}>
          {isAddMode ? '✕' : '+'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userLocation: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'blue',
  },
  observation: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'green',
    borderWidth: 2,
    borderColor: 'white',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: '#FF3B30',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
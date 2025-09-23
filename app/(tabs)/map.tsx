import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';

// Initialise la clé
MapboxGL.setAccessToken("pk.eyJ1Ijoic3JheW5hdWQtbGFtb2JpbGVyeSIsImEiOiJjbWZmdTRienQwb2F4MmtzYmprNWxieWZwIn0.mgySs3rW_6jA7hEKCF7ycw");

export default function MapScreen() {
  const { location, loading, permissionStatus, openSettings } = useCurrentPosition();

  if (loading) return <LoadingScreen />;
  if (permissionStatus !== 'granted') {
    return <UnauthorizedScreen openSettings={openSettings} />;
  }

  return (
    <View style={styles.page}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street} // obligatoire
      >
        {location && (
          <>
            <MapboxGL.Camera
              zoomLevel={14}
              centerCoordinate={[location.longitude, location.latitude]}
            />
            <MapboxGL.PointAnnotation
              id="current-location"
              coordinate={[location.longitude, location.latitude]}
            />
          </>
        )}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  map: { flex: 1 },
});

// components/MapViewWrapper.tsx

import React, { useState, useCallback } from 'react';
import { View, LayoutChangeEvent, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

interface MapViewWrapperProps {
  children: React.ReactNode;
  style?: any;
  onPress?: (feature: any) => void;
}

/**
 * Wrapper qui s'assure que Mapbox ne se rende qu'après avoir des dimensions valides
 * Résout l'erreur "Invalid size is used for setting the map view"
 */
export const MapViewWrapper: React.FC<MapViewWrapperProps> = ({ 
  children, 
  style,
  onPress 
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    
    // Ne définir les dimensions que si elles sont valides
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {dimensions && dimensions.width > 0 && dimensions.height > 0 ? (
        <MapboxGL.MapView
          style={[
            styles.map,
            {
              width: dimensions.width,
              height: dimensions.height,
            }
          ]}
          styleURL={MapboxGL.StyleURL.Street}
          onPress={onPress}
        >
          {children}
        </MapboxGL.MapView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
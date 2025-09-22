import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export const useCurrentPosition = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  // Demander permission
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.log('Erreur permission:', error);
      return false;
    }
  }, []);

  // Position actuelle
  const getCurrentLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    try {
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp,
      });
    } catch (e) {
      console.log('Erreur localisation:', e);
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  // Suivi temps réel
  const startWatching = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const locSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 10,
      },
      (loc) => {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        });
      }
    );
    setSubscription(locSub);
  }, [requestPermission]);

  const stopWatching = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  }, [subscription]);

  // Init
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        setLoading(false);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const openSettings = () => {
    Linking.openSettings();
  };

  return {
    location,
    loading,
    permissionStatus,
    getCurrentLocation,
    startWatching,
    stopWatching,
    openSettings,
  };
};

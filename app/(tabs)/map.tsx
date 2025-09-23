import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useCurrentPosition } from '@/hooks/useCurrentPosition';
import LoadingScreen from '@/components/LoadingScreen';
import UnauthorizedScreen from '@/components/UnauthorizedScreen';
import ObservationModal from '@/components/ObservationModal';

import { saveObservation, getObservations, Observation } from '../services/storage'
import { v4 as uuidv4 } from 'uuid';

// Utiliser la variable d'environnement au lieu de la clé en dur
MapboxGL.setAccessToken(process.env.MAP_KEY);

export default function MapScreen() {
    const { location, loading, permissionStatus, openSettings } = useCurrentPosition();
    const [modalVisible, setModalVisible] = useState(false);
    const [tapCoords, setTapCoords] = useState<{
        latitude: number; 
        longitude: number
    } | null>(null);
    const [observations, setObservations] = useState<Observation[]>([]);
    const animRefs = useRef<Record<string, Animated.Value>>({});

    useEffect(() => {
        (async () => {
            const list = await getObservations();
            setObservations(list);
            list.forEach((o) => {
                animRefs.current[o.id] = new Animated.Value(-100);
            });
        })();
    }, []);

    const onMapPress = (e: any) => {
        const [longitude, latitude] = e.geometry.coordinates;
        setTapCoords({ latitude, longitude });
        setModalVisible(true);
    };

    const handleSave = async (data: Omit<Observation, 'id' | 'createdAt'> & {
        id?: string
    }) => {
        const id = data.id ?? uuidv4();
        const obs: Observation = { ...data, id, createdAt: Date.now() } as Observation;
        await saveObservation(obs);
        setObservations((s) => [obs, ...s]);
        
        // prepare animation
        animRefs.current[id] = new Animated.Value(-150);
        Animated.timing(animRefs.current[id], {
            toValue: 0, 
            useNativeDriver: true, 
            duration: 600
        }).start();
    };

    if (loading) return <LoadingScreen />;
    if (permissionStatus !== 'granted') return <UnauthorizedScreen openSettings={openSettings} />;
    if (!location) return null;

    return (
        <View style={styles.container}>
            <MapboxGL.MapView style={styles.map} onPress={onMapPress}>
                <MapboxGL.Camera 
                    centerCoordinate={[location.longitude, location.latitude]} 
                    zoomLevel={14} 
                />
                
                {/* marker for current user */}
                <MapboxGL.PointAnnotation 
                    id="me" 
                    coordinate={[location.longitude, location.latitude]}
                >
                    <View style={styles.meMarker}>
                        <Text style={{ color: '#fff' }}>📍</Text>
                    </View>
                </MapboxGL.PointAnnotation>
                
                {/* observations */}
                {observations.map((o) => (
                    <MapboxGL.PointAnnotation 
                        key={o.id} 
                        id={o.id}
                        coordinate={[o.longitude, o.latitude]}
                    >
                        <Animated.View style={{
                            transform: [{
                                translateY: animRefs.current[o.id] ?? 0
                            }]
                        }}>
                            <View style={styles.obsMarker}>
                                <Text style={styles.obsText}>{o.name}</Text>
                            </View>
                        </Animated.View>
                    </MapboxGL.PointAnnotation>
                ))}
            </MapboxGL.MapView>
            
            <ObservationModal
                visible={modalVisible}
                initialCoords={tapCoords}
                onClose={() => setModalVisible(false)}
                onSave={(obs) => handleSave(obs as any)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    meMarker: { 
        backgroundColor: '#2d5a3d', 
        padding: 8, 
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    obsMarker: {
        backgroundColor: '#fff', 
        padding: 8, 
        borderRadius: 8,
        elevation: 3, 
        borderWidth: 1, 
        borderColor: '#eee',
        minWidth: 60,
        alignItems: 'center'
    },
    obsText: { 
        fontWeight: '700',
        fontSize: 12,
        color: '#2d5a3d'
    },
});
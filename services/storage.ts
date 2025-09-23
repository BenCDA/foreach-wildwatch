import AsyncStorage from '@react-native-async-storage/async-storage';
const OBS_KEY = '@observations_v1';
4
export type Observation = {
    id: string;
    name: string;
    date: string; // ISO
    latitude: number;
    longitude: number;
    imageUri?: string | null;
    createdAt: number;
};
export async function saveObservation(obs: Observation) {
    const list = await getObservations();
    list.unshift(obs);
    await AsyncStorage.setItem(OBS_KEY, JSON.stringify(list));
}
export async function getObservations() {
    const raw = await AsyncStorage.getItem(OBS_KEY);
    if (!raw) return [] as Observation[];
    try {
        return JSON.parse(raw) as Observation[];
    } catch {
        return [] as Observation[];
    }
}
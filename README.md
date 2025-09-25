# 🦌 WildWatch - Application de Suivi de la Faune

Une application mobile React Native développée avec Expo pour observer et cataloguer la faune sauvage. Enregistrez vos observations d'animaux avec photos, descriptions et géolocalisation sur une carte interactive.

## ✨ Fonctionnalités

### 🗺️ Carte Interactive
- **Carte Mapbox** avec navigation fluide
- **Géolocalisation** en temps réel avec animation pulsante
- **Marqueurs animés** pour chaque observation avec animations d'apparition et de pulsation
- **Interaction tactile** optimisée pour consulter les détails

### 📸 Gestion des Observations
- **Ajout d'observations** avec photo (caméra ou galerie)
- **Modification** des titres et descriptions existantes
- **Partage** des observations avec d'autres utilisateurs
- **Suppression** avec confirmation de sécurité
- **Stockage local** des données

### 🎨 Interface Utilisateur
- **Design moderne** avec animations fluides
- **Modaux animés** avec transitions élégantes
- **Marqueurs 3D** avec ombres et effets de profondeur
- **Bouton flottant** avec feedback tactile
- **Mode édition** intuitif avec validation

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone [URL_DU_REPO]
   cd foreach-wildwatch
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Mapbox**
   - Créer un compte sur [Mapbox](https://mapbox.com)
   - Remplacer le token d'accès dans `app/(tabs)/map.tsx`

4. **Lancer l'application**
   ```bash
   npx expo start
   ```

## 📱 Utilisation

### Ajouter une Observation
1. Appuyez sur le **bouton + flottant**
2. Prenez une photo ou sélectionnez depuis la galerie
3. Saisissez le **nom de l'espèce** et une **description**
4. Enregistrez - l'observation apparaît sur la carte avec animation

### Consulter une Observation
1. **Tapez sur un marqueur** sur la carte
2. Consultez les détails dans le modal qui s'ouvre
3. Options disponibles : **Modifier**, **Partager**, **Supprimer**

### Modifier une Observation
1. Dans le modal de détail, appuyez sur **"Modifier"**
2. Modifiez le nom et/ou la description
3. **Sauvegardez** ou **annulez** les changements

## 🛠️ Technologies Utilisées

- **React Native** avec **Expo**
- **TypeScript** pour la sécurité du code
- **Mapbox GL JS** pour la cartographie
- **Expo Image Picker** pour la gestion des photos
- **Expo Location** pour la géolocalisation
- **React Native Animated API** pour les animations
- **AsyncStorage** pour le stockage local

## 📁 Structure du Projet

```
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Écran d'accueil
│   │   ├── map.tsx           # Carte principale avec observations
│   │   └── explore.tsx       # Écran d'exploration
│   └── _layout.tsx           # Configuration de navigation
├── components/
│   ├── ObservationModal.tsx  # Modal d'ajout d'observations
│   └── ui/                   # Composants UI réutilisables
└── hooks/
    └── useCurrentPosition.ts  # Hook de géolocalisation
```

## 🎯 Fonctionnalités Clés

### Animations Avancées
- **Marqueurs animés** : Apparition en spring, pulsation continue
- **Position utilisateur** : Animation pulsante avec cercle expansif
- **Modaux** : Transitions fluides avec scale et opacity
- **Boutons** : Feedback tactile avec animations de pression

### Expérience Utilisateur
- **Interface intuitive** avec feedback visuel
- **Gestion d'erreurs** avec messages informatifs
- **Validation des données** avant sauvegarde
- **Confirmation** pour les actions destructives

### Performance
- **Optimisation native** avec `useNativeDriver: true`
- **Composants réutilisables** pour les marqueurs
- **Gestion mémoire** appropriée des animations
- **Zone tactile** optimisée pour mobile

## 🔧 Configuration

### Permissions Requises
- **Géolocalisation** : Pour centrer la carte et enregistrer les positions
- **Caméra** : Pour prendre des photos d'observations
- **Galerie** : Pour sélectionner des images existantes

### Variables d'Environnement
```javascript
// Dans app/(tabs)/map.tsx
MapboxGL.setAccessToken("VOTRE_TOKEN_MAPBOX");
```

## 🐛 Résolution de Problèmes

**Les marqueurs ne sont pas cliquables**
- Vérifiez que `TouchableOpacity` est correctement configuré
- Assurez-vous que les animations n'interceptent pas les touches

**La géolocalisation ne fonctionne pas**
- Vérifiez les permissions dans les paramètres de l'app
- Testez sur un appareil physique plutôt qu'un simulateur

**Les animations sont saccadées**
- Vérifiez que `useNativeDriver: true` est utilisé
- Réduisez la complexité des animations simultanées

## 🚀 Développement Futur

- [ ] **Synchronisation cloud** des observations
- [ ] **Identification automatique** d'espèces par IA
- [ ] **Mode hors ligne** avec cartes téléchargées
- [ ] **Partage social** avec autres utilisateurs
- [ ] **Statistiques** et graphiques d'observations
- [ ] **Export** des données en différents formats

## 📄 Licence

Ce projet est développé à des fins éducatives et de démonstration.

---

**Développé avec ❤️ pour la protection de la faune sauvage** 🦌🐻🦅
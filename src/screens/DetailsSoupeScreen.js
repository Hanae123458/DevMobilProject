import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { auth } from '../../backend/firebase-config';
import colors from '../constants/colors';
import { 
    addFavorite, 
    getFavoriteIds, 
    removeFavorite 
} from '../services/favorisService'; 

export default function DetailsSoupeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { soupe } = route.params;
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: soupe.nom });
    loadFavorites();
  }, [soupe.nom, navigation]);

  const loadFavorites = async () => {
    const user = auth.currentUser;
    if (user) {
      const favIds = await getFavoriteIds(user.uid);
      setFavoriteIds(favIds);
      setIsFavorite(favIds.includes(soupe.id));
    }
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(user.uid, soupe.id);
        setIsFavorite(false);
        setFavoriteIds(favoriteIds.filter(id => id !== soupe.id));
      } else {
        await addFavorite(user.uid, soupe.id);
        setIsFavorite(true);
        setFavoriteIds([...favoriteIds, soupe.id]);
      }
    } catch (error) {
      console.error('Erreur toggleFavorite:', error);
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const getSaisonColor = (saison) => {
    const saisonLower = saison.toLowerCase();
    return colors[saisonLower] || colors.primary;
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={toggleFavorite}
          style={{ marginRight: 15 }}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF0000" : colors.text} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isFavorite]);

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      {soupe.image && (
        <Image 
          source={soupe.image}
          style={styles.soupeImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        {/* Nom et saison */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.soupeName}>{soupe.nom}</Text>
            <View style={[styles.saisonBadge, { backgroundColor: getSaisonColor(soupe.saison) }]}>
              <Text style={styles.saisonText}>{soupe.saison}</Text>
            </View>
          </View>
        </View>

        {/* Ingrédients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Ingrédients</Text>
          <View style={styles.ingredientsContainer}>
            <Text style={styles.ingredientsText}>{soupe.ingredients}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Instructions</Text>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>{soupe.instructions}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  soupeImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  headerLeft: {
    flex: 1,
  },
  soupeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  saisonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  saisonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ingredientsContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredientsText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 16,
    color: colors.gray,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
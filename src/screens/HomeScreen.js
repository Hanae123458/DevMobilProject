import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../backend/firebase-config';
import colors from '../constants/colors';
import { getAllSoupes, getSaisons, getSoupesBySaison } from '../services/databaseService';
import { addFavorite, getFavoriteIds, removeFavorite } from '../services/favorisService';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [soupes, setSoupes] = useState([]);
  const [saisons, setSaisons] = useState([]);
  const [selectedSaison, setSelectedSaison] = useState('Toutes');
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [selectedSaisonColor, setSelectedSaisonColor] = useState(colors.primary);

  useEffect(() => {
    loadData();
  }, []);

  // 🆕 Recharger les favoris à chaque fois que l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        const user = auth.currentUser;
        if (user) {
          console.log('🔄 HomeScreen - Rechargement des favoris');
          const favIds = await getFavoriteIds(user.uid);
          setFavoriteIds(favIds);
          console.log('✅ Favoris rechargés:', favIds);
        }
      };
      
      loadFavorites();
    }, [])
  );

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      const [soupesData, saisonsData, favIds] = await Promise.all([
        getAllSoupes(),
        getSaisons(),
        user ? getFavoriteIds(user.uid) : []
      ]);
      
      setSoupes(soupesData);
      setSaisons(['Toutes', ...saisonsData]);
      setFavoriteIds(favIds);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setLoading(false);
    }
  };

  const handleFilterBySaison = async (saison) => {
    setSelectedSaison(saison);
    setLoading(true);

    try {
      if (saison === 'Toutes') {
        const data = await getAllSoupes();
        setSoupes(data);
        setSelectedSaisonColor(colors.primary);
      } else {
        const data = await getSoupesBySaison(saison);
        setSoupes(data);
        const color = colors[saison.toLowerCase()] || colors.primary;
        setSelectedSaisonColor(color);
      }
    } catch (error) {
      console.error('Erreur filtrage:', error);
    }

    setLoading(false);
  };

  const toggleFavorite = async (soupeId) => {
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    console.log('🔍 toggleFavorite - User UID:', user.uid, 'Soupe ID:', soupeId);
    
    const isFav = favoriteIds.includes(soupeId);
    console.log('❤️ Est déjà favori?', isFav);

    try {
      if (isFav) {
        console.log('🗑️ Suppression du favori...');
        const result = await removeFavorite(user.uid, soupeId);
        if (result) {
          setFavoriteIds(favoriteIds.filter(id => id !== soupeId));
        }
      } else {
        console.log('➕ Ajout du favori...');
        const result = await addFavorite(user.uid, soupeId);
        if (result) {
          setFavoriteIds([...favoriteIds, soupeId]);
        }
      }
    } catch (error) {
      console.error('❌ Erreur toggleFavorite:', error);
      Alert.alert('Erreur', 'Impossible de modifier les favoris: ' + error.message);
    }
  };

  const getSaisonColor = (saison) => {
    const saisonLower = saison.toLowerCase();
    return colors[saisonLower] || colors.primary;
  };

  const renderSoupeCard = ({ item }) => {
    const isFav = favoriteIds.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('DetailsSoupe', { soupe: item })}
      >
        {/* Image de la soupe */}
        {item.image && (
          <Image 
            source={item.image}
            style={styles.soupeImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.soupeName} numberOfLines={2}>{item.nom}</Text>
            <View style={styles.cardHeaderRight}>
              <View style={[styles.saisonBadge, { backgroundColor: getSaisonColor(item.saison) }]}>
                <Text style={styles.saisonText}>{item.saison}</Text>
              </View>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={isFav ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFav ? "#FF0000" : colors.gray} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSaisonFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedSaison === item && styles.filterButtonActive,
        { 
          borderColor: item !== 'Toutes' ? getSaisonColor(item) : colors.primary,
          backgroundColor: selectedSaison === item ? getSaisonColor(item) : colors.white,
        }
      ]}
      onPress={() => handleFilterBySaison(item)}
    >
      <Text style={[
        styles.filterText,
        selectedSaison === item && styles.filterTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  if (loading && soupes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={selectedSaisonColor} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BLOC SOUPES EN HAUT */}
      <View style={styles.soupesHeader}>
        <View style={styles.soupesHeaderContent}>
          <Ionicons name="restaurant" size={32} color={colors.white} />
          <View style={styles.soupesHeaderText}>
            <Text style={styles.soupesTitle}>SoupesApp</Text>
            <Text style={styles.soupesSubtitle}>
              {soupes.length} recettes disponibles
            </Text>
          </View>
        </View>
      </View>

      {/* Filtres par saison */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={saisons}
          renderItem={renderSaisonFilter}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Liste des soupes */}
      {loading ? (
        <ActivityIndicator size="large" color={selectedSaisonColor} />
      ) : soupes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucune soupe disponible pour cette saison
          </Text>
        </View>
      ) : (
        <FlatList
          data={soupes}
          renderItem={renderSoupeCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  soupesHeader: {
    backgroundColor: colors.primary,
    paddingTop: 45,
    paddingBottom: 25,
    paddingHorizontal: 95,
    paddingVertical: 35,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  soupesHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  soupesHeaderText: {
    flex: 1,
  },
  soupesTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  soupesSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filtersList: {
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  filterButtonActive: {
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  soupeImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soupeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  saisonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saisonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray,
    textAlign: 'center',
  },
});
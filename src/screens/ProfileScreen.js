// ProfileScreen.js - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../backend/firebase-config';
import colors from '../constants/colors';
import { logOut } from '../services/authService';
import { getAllSoupes } from '../services/databaseService';
import { getFavoriteIds, removeFavorite } from '../services/favorisService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    console.log('👤 ProfileScreen - Utilisateur:', currentUser?.uid);
  }, []);

  useEffect(() => {
    if (isFocused && user) {
      console.log('🔄 Écran Compte visible, rechargement des favoris...');
      loadFavorites(user.uid);
    }
  }, [isFocused, user]);

  // Fonction pour charger les favoris depuis Firebase
  const loadFavoritesFromFirebase = async (uid) => {
    try {
      console.log('📥 Chargement favoris depuis Firebase pour:', uid);
      
      // 1. Récupérer les IDs des favoris depuis Firebase
      const favoriteIds = await getFavoriteIds(uid);
      console.log('📋 IDs favoris Firebase:', favoriteIds);
      
      if (favoriteIds.length === 0) {
        console.log('ℹ️ Aucun favori trouvé dans Firebase');
        return [];
      }
      
      // 2. Récupérer toutes les soupes depuis SQLite
      const allSoupes = await getAllSoupes();
      console.log('🍲 Toutes les soupes SQLite:', allSoupes.length);
      
      // 3. Filtrer pour garder seulement les soupes favorites
      // Convertir les IDs en nombres pour la comparaison
      const favSoupes = allSoupes.filter(soupe => 
        favoriteIds.some(favId => Number(favId) === soupe.id)
      );
      
      console.log('✅ Favoris chargés:', favSoupes.length);
      return favSoupes;
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      return [];
    }
  };

  const loadFavorites = async (uid) => {
    try {
      setLoading(true);
      console.log('📥 Chargement favoris pour:', uid);
      const favSoupes = await loadFavoritesFromFirebase(uid);
      console.log('✅ Favoris chargés:', favSoupes.length);
      setFavorites(favSoupes);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            const result = await logOut();
            if (!result.success) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const handleRemoveFavorite = async (soupeId) => {
    Alert.alert(
      'Retirer des favoris',
      'Voulez-vous retirer cette soupe de vos favoris ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite(user.uid, soupeId);
              // Mettre à jour la liste locale
              setFavorites(favorites.filter(s => s.id !== soupeId));
              console.log('✅ Favori retiré de Firebase:', soupeId);
            } catch (error) {
              console.error('❌ Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de retirer le favori');
            }
          }
        }
      ]
    );
  };

  const getSaisonColor = (saison) => {
    const saisonLower = saison.toLowerCase();
    return colors[saisonLower] || colors.primary;
  };

   const renderFavoriteCard = ({ item }) => (
    <TouchableOpacity  // Changez View en TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => navigation.navigate('DetailsSoupe', { soupe: item })} // Ajoutez cette ligne
    >
      {/* Image de la soupe favorite */}
      {item.image && (
        <Image 
          source={item.image}
          style={styles.favoriteImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.favoriteCardContent}>
        <View style={styles.cardHeader}> 
          <Text style={styles.soupeName} numberOfLines={2}>{item.nom}</Text> 
          <View style={styles.cardHeaderRight}> 
            <View style={[styles.saisonBadge, { backgroundColor: getSaisonColor(item.saison) }]}>
              <Text style={styles.saisonText}>{item.saison}</Text>
            </View>
            <TouchableOpacity 
              onPress={(e) => { // Modifiez cette ligne
                e.stopPropagation(); // Empêche la navigation vers DetailsSoupe
                handleRemoveFavorite(item.id);
              }}
              style={styles.favoriteButton} 
            >
              <Ionicons name="heart" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity> // Changez la fermeture en TouchableOpacity
  );

  return (
    <View style={styles.container}>
      {/* En-tête du profil */}
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <Ionicons name="person" size={50} color={colors.white} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Section Favoris */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          ❤️ Mes Soupes Favorites ({favorites.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={60} color={colors.gray} />
            <Text style={styles.emptyText}>Aucune soupe favorite</Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.favoritesList}
          />
        )}
      </View>

      {/* Bouton de déconnexion */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    paddingTop: 40,
    paddingBottom: 25,
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 70,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  email: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  favoritesList: {
    paddingBottom: 20,
  },
favoriteCard: {
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
  
  favoriteImage: {
    width: '100%',
    height: 180, // Changez de 150 à 180
  },
  
  favoriteCardContent: {
    padding: 12, // Changé de 15 à 12 pour correspondre à HomeScreen
  },
  
  // STYLES COPIÉS DE HomeScreen.js (corrigés)
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
  
  favoriteIngredients: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  buttonsContainer: {
    padding: 20,
    gap: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
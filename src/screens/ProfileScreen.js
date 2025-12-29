import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../backend/firebase-config';
import colors from '../constants/colors';
import { logOut } from '../services/authService';
import {
  exportDatabaseToBackend,
  getFavoriteSoupes,
  removeFavorite
} from '../services/databaseService';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const isFocused = useIsFocused(); // Détecter quand l'écran est visible

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  }, []);

  // Recharger les favoris à chaque fois que l'écran devient visible
  useEffect(() => {
    if (isFocused && user) {
      console.log('🔄 Écran Compte visible, rechargement des favoris...');
      loadFavorites(user.uid);
    }
  }, [isFocused, user]);

  const loadFavorites = async (uid) => {
    try {
      setLoading(true);
      console.log('📥 Chargement favoris pour:', uid);
      const favSoupes = await getFavoriteSoupes(uid);
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

  const handleExportDatabase = async () => {
    setExporting(true);
    try {
      const exportPath = await exportDatabaseToBackend();
      Alert.alert(
        '✅ Export réussi!',
        `La base de données a été exportée.\n\nChemin: ${exportPath}\n\nVous pouvez récupérer ce fichier et le copier dans votre dossier backend/ sur votre PC.`,
        [
          {
            text: 'Partager',
            onPress: async () => {
              try {
                await Share.share({
                  message: `Base de données exportée: ${exportPath}`,
                  title: 'Export SQLite'
                });
              } catch (error) {
                console.error('Erreur partage:', error);
              }
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible d\'exporter la base de données');
    }
    setExporting(false);
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
            await removeFavorite(user.uid, soupeId);
            setFavorites(favorites.filter(s => s.id !== soupeId));
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
    <View style={styles.favoriteCard}>
      {/* Image de la soupe favorite */}
      {item.image && (
        <Image 
          source={item.image}
          style={styles.favoriteImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.favoriteCardContent}>
        <View style={styles.favoriteCardHeader}>
          <Text style={styles.favoriteName}>{item.nom}</Text>
          <TouchableOpacity 
            onPress={() => handleRemoveFavorite(item.id)}
            style={styles.removeButton}
          >
            <Ionicons name="heart" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
        <View style={[styles.saisonBadge, { backgroundColor: getSaisonColor(item.saison) }]}>
          <Text style={styles.saisonText}>{item.saison}</Text>
        </View>
        <Text style={styles.favoriteIngredients}>
          🥕 {item.ingredients}
        </Text>
      </View>
    </View>
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
        {/* Bouton Export */}
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={handleExportDatabase}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={24} color={colors.white} />
              <Text style={styles.buttonText}>Exporter la base de données</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bouton Déconnexion */}
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
    height: 150,
  },
  favoriteCardContent: {
    padding: 15,
  },
  favoriteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  removeButton: {
    padding: 5,
  },
  saisonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  saisonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
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
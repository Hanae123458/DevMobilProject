import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

// 📸 Import des images locales
import gaspacho from '../../assets/images/gaspacho.jpg';
import soupe_asperges from '../../assets/images/soupe_asperges.jpg';
import soupe_courgettes from '../../assets/images/soupe_courgettes.jpg';
import soupe_lentilles from '../../assets/images/soupe_lentilles.jpg';
import soupe_pois_casses from '../../assets/images/soupe_pois_casses.jpg';
import soupe_potiron from '../../assets/images/soupe_potiron.jpg';
import veloute_champignons from '../../assets/images/veloute_champignons.jpg';
import veloute_petits_pois from '../../assets/images/veloute_petits_pois.jpg';

let db = null;

// 🔗 Mapping image_url → Image importée
const imageMapping = {
  'gaspacho.jpg': gaspacho,
  'soupe_asperges.jpg': soupe_asperges,
  'soupe_courgettes.jpg': soupe_courgettes,
  'soupe_lentilles.jpg': soupe_lentilles,
  'soupe_pois_casses.jpg': soupe_pois_casses,
  'soupe_potiron.jpg': soupe_potiron,
  'veloute_champignons.jpg': veloute_champignons,
  'veloute_petits_pois.jpg': veloute_petits_pois,
};

// 🖼️ Utilitaire pour récupérer l'image depuis l'URL
export const getImageFromUrl = (url) => imageMapping[url] || null;

// 🗄️ Initialiser la base de données (CORRIGÉE)
export const initDatabase = async () => {
  try {
    console.log('📂 Initialisation de la base de données...');
    
    const dbName = 'soupesapp.db';
    const dbAsset = require('../../assets/soupesapp.db'); // ✅ Dans assets/
    const dbUri = Asset.fromModule(dbAsset).uri;
    const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

    // Créer le dossier SQLite
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`);
    if (!dirInfo.exists) {
      console.log('📁 Création du dossier SQLite...');
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
        intermediates: true
      });
    }

    // ✅ COPIER UNIQUEMENT SI LA DB N'EXISTE PAS (préserve données pré-remplies)
    const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
    if (!fileInfo.exists) {
      console.log('📥 Copie de la base pré-remplie...');
      await FileSystem.downloadAsync(dbUri, dbFilePath);
      console.log('✅ Base pré-remplie copiée');
    } else {
      console.log('✅ DB existe déjà (données préservées)');
    }

    // Ouvrir la base de données
    db = await SQLite.openDatabaseAsync(dbName);
    console.log('✅ Base de données ouverte');

    // 🔍 VÉRIFIER LES TABLES EXISTANTES (debug)
    const tables = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Tables trouvées:', tables.map(t => t.name));

    // ✅ CRÉER UNIQUEMENT les tables manquantes (ne supprime PAS les données)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS soupes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        saison TEXT NOT NULL,
        image_url TEXT,
        instructions TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favoris (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL,
        soupe_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(firebase_uid, soupe_id)
      );
    `);

    // Vérifier le contenu de la table soupes
    const soupesCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM soupes');
    console.log(`🍲 Nombre de soupes trouvées: ${soupesCount.count}`);

    // Première soupe pour debug
    if (soupesCount.count > 0) {
      const firstSoupe = await db.getFirstAsync('SELECT * FROM soupes LIMIT 1');
      console.log('🍲 Première soupe:', firstSoupe);
    }

    // Insérer UNIQUEMENT si table vide
    if (soupesCount.count === 0) {
      console.log('🌱 Insertion des 8 soupes de secours...');
      await insertSoupes();
    }

    return db;
  } catch (error) {
    console.error('❌ Erreur init DB:', error);
    throw error;
  }
};

// 🌱 Insérer les soupes de secours (seulement si table vide)
const insertSoupes = async () => {
  try {
    const soupes = [
      {
        nom: "Soupe de potiron",
        ingredients: "Potiron, Oignons, Crème, Beurre, Sel, Poivre",
        saison: "automne",
        image_url: "soupe_potiron.jpg",
        instructions: "Couper le potiron et les oignons. Faire revenir dans le beurre, ajouter de l'eau et cuire. Mixer et ajouter la crème."
      },
      {
        nom: "Velouté de champignons",
        ingredients: "Champignons, Oignons, Bouillon de légumes, Crème, Beurre, Sel, Poivre",
        saison: "automne",
        image_url: "veloute_champignons.jpg",
        instructions: "Faire revenir les champignons et oignons dans le beurre, ajouter le bouillon et cuire. Mixer et ajouter la crème."
      },
      {
        nom: "Soupe de lentilles",
        ingredients: "Lentilles, Carottes, Oignons, Ail, Bouillon de légumes, Sel, Poivre",
        saison: "hiver",
        image_url: "soupe_lentilles.jpg",
        instructions: "Cuire les lentilles avec les légumes et le bouillon jusqu'à tendreté. Mixer ou laisser tel quel selon préférence."
      },
      {
        nom: "Soupe aux pois cassés",
        ingredients: "Pois cassés, Carottes, Oignons, Bouillon, Sel, Poivre",
        saison: "hiver",
        image_url: "soupe_pois_casses.jpg",
        instructions: "Faire cuire les pois cassés avec les légumes et le bouillon jusqu'à tendreté. Mixer ou servir tel quel."
      },
      {
        nom: "Soupe aux asperges",
        ingredients: "Asperges, Pommes de terre, Oignons, Bouillon, Crème, Sel, Poivre",
        saison: "printemps",
        image_url: "soupe_asperges.jpg",
        instructions: "Cuire les asperges et pommes de terre dans le bouillon. Mixer et ajouter la crème."
      },
      {
        nom: "Velouté de petits pois",
        ingredients: "Petits pois, Oignons, Bouillon, Crème, Sel, Poivre",
        saison: "printemps",
        image_url: "veloute_petits_pois.jpg",
        instructions: "Cuire les petits pois et les oignons dans le bouillon. Mixer et ajouter la crème."
      },
      {
        nom: "Gaspacho",
        ingredients: "Tomates, Concombre, Poivron, Oignon, Ail, Huile d'olive, Vinaigre, Sel",
        saison: "ete",
        image_url: "gaspacho.jpg",
        instructions: "Mixer tous les légumes avec l'huile et le vinaigre. Servir frais."
      },
      {
        nom: "Soupe froide de courgettes",
        ingredients: "Courgettes, Oignons, Bouillon, Crème, Sel, Poivre",
        saison: "ete",
        image_url: "soupe_courgettes.jpg",
        instructions: "Cuire les courgettes et oignons dans le bouillon. Mixer et laisser refroidir avant de servir avec la crème."
      }
    ];

    for (const soupe of soupes) {
      await db.runAsync(
        'INSERT INTO soupes (nom, ingredients, saison, image_url, instructions) VALUES (?, ?, ?, ?, ?)',
        [soupe.nom, soupe.ingredients, soupe.saison, soupe.image_url, soupe.instructions]
      );
    }
    
    console.log('✅ 8 soupes insérées avec succès');
  } catch (error) {
    console.error('❌ Erreur insertion soupes:', error);
  }
};

// 📥 Récupérer toutes les soupes avec images
export const getAllSoupes = async () => {
  try {
    if (!db) await initDatabase();
    
    const soupes = await db.getAllAsync('SELECT * FROM soupes ORDER BY nom');
    
    // Ajouter l'image et formater les ingrédients
    return soupes.map(soupe => ({
      ...soupe,
      image: getImageFromUrl(soupe.image_url),
      ingredientsArray: soupe.ingredients.split(', ')
    }));
  } catch (error) {
    console.error('❌ Erreur récupération soupes:', error);
    return [];
  }
};

// 📥 Récupérer les soupes par saison avec images
export const getSoupesBySaison = async (saison) => {
  try {
    if (!db) await initDatabase();
    
    const soupes = await db.getAllAsync(
      'SELECT * FROM soupes WHERE saison = ? ORDER BY nom',
      [saison]
    );
    
    return soupes.map(soupe => ({
      ...soupe,
      image: getImageFromUrl(soupe.image_url),
      ingredientsArray: soupe.ingredients.split(', ')
    }));
  } catch (error) {
    console.error('❌ Erreur récupération soupes par saison:', error);
    return [];
  }
};

// 📥 Récupérer les saisons disponibles
export const getSaisons = async () => {
  try {
    if (!db) await initDatabase();
    
    const result = await db.getAllAsync('SELECT DISTINCT saison FROM soupes ORDER BY saison');
    return result.map(row => row.saison);
  } catch (error) {
    console.error('❌ Erreur récupération saisons:', error);
    return [];
  }
};

// ❤️ Ajouter aux favoris
export const addFavorite = async (firebaseUid, soupeId) => {
  try {
    if (!db) await initDatabase();
    
    await db.runAsync(
      'INSERT OR IGNORE INTO favoris (firebase_uid, soupe_id) VALUES (?, ?)',
      [firebaseUid, soupeId]
    );
    
    console.log('❤️ Favori ajouté');
    return true;
  } catch (error) {
    console.error('❌ Erreur ajout favori:', error);
    return false;
  }
};

// 💔 Retirer des favoris
export const removeFavorite = async (firebaseUid, soupeId) => {
  try {
    if (!db) await initDatabase();
    
    await db.runAsync(
      'DELETE FROM favoris WHERE firebase_uid = ? AND soupe_id = ?',
      [firebaseUid, soupeId]
    );
    
    console.log('💔 Favori retiré');
    return true;
  } catch (error) {
    console.error('❌ Erreur retrait favori:', error);
    return false;
  }
};

// 📋 Récupérer les IDs des favoris d'un utilisateur
export const getFavoriteIds = async (firebaseUid) => {
  try {
    if (!db) await initDatabase();
    
    const result = await db.getAllAsync(
      'SELECT soupe_id FROM favoris WHERE firebase_uid = ?',
      [firebaseUid]
    );
    
    return result.map(row => row.soupe_id);
  } catch (error) {
    console.error('❌ Erreur récupération IDs favoris:', error);
    return [];
  }
};

// ❤️ Récupérer les soupes favorites d'un utilisateur avec images
export const getFavoriteSoupes = async (firebaseUid) => {
  try {
    if (!db) await initDatabase();
    
    const soupes = await db.getAllAsync(
      `SELECT s.* FROM soupes s 
       INNER JOIN favoris f ON s.id = f.soupe_id 
       WHERE f.firebase_uid = ? 
       ORDER BY f.created_at DESC`,
      [firebaseUid]
    );
    
    return soupes.map(soupe => ({
      ...soupe,
      image: getImageFromUrl(soupe.image_url),
      ingredientsArray: soupe.ingredients.split(', ')
    }));
  } catch (error) {
    console.error('❌ Erreur récupération favoris:', error);
    return [];
  }
};

// 📤 Exporter la base de données (pour développement)
export const exportDatabaseToBackend = async () => {
  try {
    if (!db) await initDatabase();
    
    const dbPath = `${FileSystem.documentDirectory}SQLite/soupesapp.db`;
    const backendPath = FileSystem.documentDirectory + 'soupesapp_export.db';
    
    console.log('📤 Export de la base de données...');
    
    await FileSystem.copyAsync({
      from: dbPath,
      to: backendPath
    });
    
    console.log('✅ Export réussi!');
    console.log('📁 Fichier exporté vers:', backendPath);
    
    return backendPath;
  } catch (error) {
    console.error('❌ Erreur export:', error);
    throw error;
  }
};

// src/services/favorisService.js
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../backend/firebase-config';

// ❤️ Ajouter un favori
export const addFavorite = async (firebaseUid, soupeId) => {
  try {
    console.log('❤️ [Firestore] Ajout favori - UID:', firebaseUid, 'Soupe ID:', soupeId);
    
    // Vérifier si le favori existe déjà
    const q = query(
      collection(db, 'favoris'),
      where('firebase_uid', '==', firebaseUid),
      where('soupe_id', '==', soupeId)
    );
    
    const existingSnapshot = await getDocs(q);
    
    if (!existingSnapshot.empty) {
      console.log('⚠️ Favori déjà existant');
      return;
    }
    
    // Ajouter le nouveau favori
    await addDoc(collection(db, 'favoris'), {
      firebase_uid: firebaseUid,
      soupe_id: soupeId,
      created_at: serverTimestamp()
    });
    
    console.log('✅ Favori ajouté avec succès dans Firestore');
    return true;
  } catch (error) {
    console.error('❌ Erreur addFavorite:', error);
    console.error('Code erreur:', error.code);
    console.error('Message:', error.message);
    throw error;
  }
};

// 💔 Retirer un favori
export const removeFavorite = async (firebaseUid, soupeId) => {
  try {
    console.log('🗑️ [Firestore] Suppression favori - UID:', firebaseUid, 'Soupe ID:', soupeId);
    
    const q = query(
      collection(db, 'favoris'),
      where('firebase_uid', '==', firebaseUid),
      where('soupe_id', '==', soupeId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('ℹ️ Aucun favori à supprimer');
      return;
    }
    
    // Supprimer tous les documents correspondants
    const deletePromises = [];
    snapshot.forEach(doc => {
      console.log('🗑️ Suppression document ID:', doc.id);
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('✅ Favori(s) supprimé(s) avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur removeFavorite:', error);
    console.error('Code erreur:', error.code);
    console.error('Message:', error.message);
    throw error;
  }
};

// 📋 Récupérer IDs favoris
export const getFavoriteIds = async (firebaseUid) => {
  try {
    console.log('📋 [Firestore] Récupération IDs - UID:', firebaseUid);
    
    const q = query(
      collection(db, 'favoris'),
      where('firebase_uid', '==', firebaseUid)
    );

    const snapshot = await getDocs(q);
    const ids = snapshot.docs.map(d => {
      const data = d.data();
      console.log('📄 Document:', d.id, 'Data:', data);
      return data.soupe_id;
    });
    
    console.log('✅ IDs récupérés:', ids.length, 'favoris ->', ids);
    return ids;
  } catch (error) {
    console.error('❌ Erreur getFavoriteIds:', error);
    console.error('Code erreur:', error.code);
    console.error('Message:', error.message);
    return [];
  }
};
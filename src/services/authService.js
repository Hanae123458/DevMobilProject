import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../../backend/firebase-config';

// Inscription d'un nouvel utilisateur
export const signUp = async (email, password) => {
  try {
    console.log('🔐 Début de l\'inscription...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Utilisateur créé dans Firebase:', user.uid);
    console.log('📧 Email:', user.email);
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    let errorMessage = 'Une erreur est survenue';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Cet email est déjà utilisé';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email invalide';
        break;
      case 'auth/weak-password':
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        break;
      default:
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Connexion d'un utilisateur
export const signIn = async (email, password) => {
  try {
    console.log('🔐 Tentative de connexion...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Connexion réussie:', user.uid);
    console.log('📧 Email:', user.email);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    let errorMessage = 'Une erreur est survenue';
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Email ou mot de passe incorrect';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email invalide';
        break;
      default:
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Déconnexion
export const logOut = async () => {
  try {
    console.log('🚪 Déconnexion...');
    await signOut(auth);
    console.log('✅ Déconnexion réussie');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    return { success: false, error: error.message };
  }
};

// Observer l'état d'authentification
export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = () => {
  return auth.currentUser;
};
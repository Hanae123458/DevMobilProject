import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { observeAuthState } from '../services/authService';
import { initDatabase } from '../services/databaseService';

import colors from '../constants/colors';
import DetailsSoupeScreen from '../screens/DetailsSoupeScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack pour l'onglet Accueil
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerTitle: 'Accueil',
        }}
      />
      {/* Retirez DetailsSoupe d'ici */}
    </Stack.Navigator>
  );
}

// Tab Navigator pour les utilisateurs connectés
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Accueil') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Compte') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Accueil" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Compte" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Compte',
        }}
      />
    </Tab.Navigator>
  );
}

// Stack principal pour les utilisateurs connectés
function AuthenticatedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DetailsSoupe" 
        component={DetailsSoupeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Détails',
          headerStyle: { backgroundColor: colors.white },
          headerTintColor: colors.text,
          headerBackTitle: 'Retour',
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDatabase().catch(error => {
      console.error('Erreur initialisation DB:', error);
    });

    const unsubscribe = observeAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Utilisateur connecté - Utilisez AuthenticatedStack
          <Stack.Screen 
            name="AuthenticatedStack" 
            component={AuthenticatedStack}
            options={{ headerShown: false }}
          />
        ) : (
          // Utilisateur non connecté
          <>
            <Stack.Screen 
              name="SignIn" 
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
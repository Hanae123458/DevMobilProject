// src/contexts/FavoritesContext.js
import { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState([]);

  const updateFavorites = (ids) => {
    setFavoriteIds(ids);
  };

  const removeFavoriteId = (soupeId) => {
    setFavoriteIds(prev => prev.filter(id => id !== soupeId));
  };

  const addFavoriteId = (soupeId) => {
    setFavoriteIds(prev => [...prev, soupeId]);
  };

  return (
    <FavoritesContext.Provider value={{
      favoriteIds,
      updateFavorites,
      removeFavoriteId,
      addFavoriteId
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
const DEFAULT_FAVORITES = { stores: [], publics: [] };

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
}

export function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

export function getBackendUserId() {
  const currentUser = getCurrentUser();
  const fromUser = Number(currentUser.backendUserId ?? currentUser.id);

  if (Number.isInteger(fromUser) && fromUser > 0) {
    return fromUser;
  }

  const fromEnv = Number(import.meta.env.VITE_DEV_USER_ID || 1);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : 1;
}

export function getLocalFavorites() {
  const currentUser = getCurrentUser();
  return {
    stores: Array.isArray(currentUser.favorites?.stores) ? currentUser.favorites.stores : DEFAULT_FAVORITES.stores,
    publics: Array.isArray(currentUser.favorites?.publics) ? currentUser.favorites.publics : DEFAULT_FAVORITES.publics,
  };
}

export function updateLocalFavorite(type, placeId, favorited) {
  const currentUser = getCurrentUser();
  const favorites = getLocalFavorites();
  const targetId = String(placeId);
  const key = type === 'PUBLIC' ? 'publics' : 'stores';

  const nextValues = favorited
    ? Array.from(new Set([...(favorites[key] || []), targetId]))
    : (favorites[key] || []).filter((id) => String(id) !== targetId);

  const updatedUser = {
    ...currentUser,
    favorites: {
      ...favorites,
      [key]: nextValues,
    },
  };

  localStorage.setItem('currentUser', JSON.stringify(updatedUser));

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (Array.isArray(users) && currentUser?.id) {
    const updatedUsers = users.map((user) => (user.id === currentUser.id ? updatedUser : user));
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }

  window.dispatchEvent(new CustomEvent('favoritesChanged', {
    detail: {
      type,
      placeId: targetId,
      favorited,
    },
  }));

  return updatedUser;
}

export function updateLocalFavoriteStore(placeId, favorited) {
  return updateLocalFavorite('STORE', placeId, favorited);
}

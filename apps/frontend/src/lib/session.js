import { fetchMe, refreshToken as refreshTokenRequest } from './auth';

const DEFAULT_FAVORITES = { stores: [], publics: [] };
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CURRENT_USER_KEY = 'currentUser';
const LOGGED_IN_KEY = 'isLoggedIn';
const REMEMBER_ME_KEY = 'rememberMe';

function dispatchSessionEvent(type, detail = {}) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getCurrentUserRole() {
  return getCurrentUser().role || getCurrentUser().type || '';
}

export function isLoggedIn() {
  return Boolean(getAccessToken()) && localStorage.getItem(LOGGED_IN_KEY) === 'true';
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function getAuthHeaders() {
  const accessToken = getAccessToken();
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

export function persistAuthSession(authData, options = {}) {
  const { rememberMe = false } = options;
  const user = authData?.user || {};

  localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken || '');
  localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken || '');
  localStorage.setItem(LOGGED_IN_KEY, 'true');
  localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      ...getCurrentUser(),
      ...user,
      type: user.role,
    })
  );

  dispatchSessionEvent('authChanged', { loggedIn: true, user });
}

export function updateCurrentUser(fields) {
  const updatedUser = {
    ...getCurrentUser(),
    ...fields,
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  dispatchSessionEvent('authChanged', { loggedIn: isLoggedIn(), user: updatedUser });
  return updatedUser;
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LOGGED_IN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  dispatchSessionEvent('authChanged', { loggedIn: false });
}

export async function restoreAuthSession() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const user = await fetchMe(accessToken);
    updateCurrentUser({
      ...user,
      type: user.role,
    });
    return user;
  } catch {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthSession();
      return null;
    }

    try {
      const refreshed = await refreshTokenRequest(refreshToken);
      const user = await fetchMe(refreshed.accessToken);
      persistAuthSession(
        {
          ...refreshed,
          user,
        },
        { rememberMe: getRememberMe() }
      );
      return user;
    } catch {
      clearAuthSession();
      return null;
    }
  }
}

export function getLocalFavorites() {
  const currentUser = getCurrentUser();
  return {
    stores: Array.isArray(currentUser.favorites?.stores) ? currentUser.favorites.stores : DEFAULT_FAVORITES.stores,
    publics: Array.isArray(currentUser.favorites?.publics) ? currentUser.favorites.publics : DEFAULT_FAVORITES.publics,
  };
}

export function updateLocalFavorite(type, placeId, favorited) {
  const favorites = getLocalFavorites();
  const targetId = String(placeId);
  const key = type === 'PUBLIC' ? 'publics' : 'stores';

  const nextValues = favorited
    ? Array.from(new Set([...(favorites[key] || []), targetId]))
    : (favorites[key] || []).filter((id) => String(id) !== targetId);

  const updatedUser = updateCurrentUser({
    favorites: {
      ...favorites,
      [key]: nextValues,
    },
  });

  dispatchSessionEvent('favoritesChanged', {
    type,
    placeId: targetId,
    favorited,
  });

  return updatedUser;
}

export function updateLocalFavoriteStore(placeId, favorited) {
  return updateLocalFavorite('STORE', placeId, favorited);
}

export function updateLocalFavoritePublic(placeId, favorited) {
  return updateLocalFavorite('PUBLIC', placeId, favorited);
}

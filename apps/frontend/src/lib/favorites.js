import { apiRequest } from './api';
import { getAuthHeaders, updateLocalFavoriteStore } from './session';

const STORE_SOURCE = 'KAKAO';

function toResolveRequest(place) {
  return {
    externalSource: STORE_SOURCE,
    externalPlaceId: String(place.id),
    name: place.name,
    address: place.address,
    phone: place.contact || place.phone || '',
    latitude: Number(place.lat),
    longitude: Number(place.lng),
  };
}

export async function resolveStore(place) {
  return apiRequest('/api/v1/stores/resolve', {
    method: 'POST',
    body: toResolveRequest(place),
  });
}

export async function addFavoriteStore(place) {
  const resolved = await resolveStore(place);
  const data = await apiRequest(`/api/v1/favorites/stores/${resolved.storeId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  updateLocalFavoriteStore(place.id, true);

  return {
    ...data,
    externalPlaceId: String(place.id),
    storeId: resolved.storeId,
  };
}

export async function removeFavoriteStore(place) {
  const resolved = await resolveStore(place);
  const data = await apiRequest(`/api/v1/favorites/stores/${resolved.storeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  updateLocalFavoriteStore(place.id, false);

  return {
    ...data,
    externalPlaceId: String(place.id),
    storeId: resolved.storeId,
  };
}

export async function fetchFavoriteStores() {
  const data = await apiRequest('/api/v1/favorites/stores', {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return data.content || [];
}

import { apiRequest } from './api';
import { getAuthHeaders } from './session';

export async function fetchMyMap() {
  return apiRequest('/api/v1/my-map', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function updateMyMapProfile(payload) {
  return apiRequest('/api/v1/my-map/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: payload,
  });
}

export async function addMyMapStore(storeId) {
  return apiRequest(`/api/v1/my-map/stores/${storeId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function removeMyMapStore(storeId) {
  return apiRequest(`/api/v1/my-map/stores/${storeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function addMyMapPublic(publicInstitutionId) {
  return apiRequest(`/api/v1/my-map/publics/${publicInstitutionId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function removeMyMapPublic(publicInstitutionId) {
  return apiRequest(`/api/v1/my-map/publics/${publicInstitutionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function fetchPublicMap(publicMapId) {
  return apiRequest(`/api/v1/public-maps/${encodeURIComponent(publicMapId)}`, {
    method: 'GET',
  });
}

export function buildSharedMapUrl(publicMapId, web = false) {
  const path = web ? '/sharedweb/' : '/shared/';
  return `${window.location.origin}${path}${encodeURIComponent(publicMapId)}`;
}

import { apiRequest } from './api';
import { getAuthHeaders } from './session';

export async function createOwnerStoreApplication({ businessName, businessNumber, businessAddress, businessLicenseFile }) {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify({
    businessName,
    businessNumber,
    businessAddress,
  })], { type: 'application/json' }));
  formData.append('businessLicenseFile', businessLicenseFile);

  return apiRequest('/api/v1/owner/store-applications', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
}

export async function fetchMyOwnerStoreApplications() {
  return apiRequest('/api/v1/owner/store-applications', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function fetchMyOwnerStores() {
  return apiRequest('/api/v1/owner/stores', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function updateOwnerStoreStatus(storeId, payload) {
  return apiRequest(`/api/v1/owner/stores/${storeId}/status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: payload,
  });
}

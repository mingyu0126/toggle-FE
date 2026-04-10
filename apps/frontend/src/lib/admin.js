import { apiRequest } from './api';
import { getAuthHeaders } from './session';

export async function fetchAdminOwnerStoreApplications() {
  return apiRequest('/api/v1/admin/store-registration-requests', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function fetchAdminOwnerStoreApplicationDetail(applicationId) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}

export async function executeAdminBusinessVerification(applicationId) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}/business-verifications/execute`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}

export async function manualVerifyOwnerStoreBusiness(applicationId, verified, reason) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}/business-verifications/manual`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: { verified, reason },
  });
}

export async function executeAdminMapVerification(applicationId, forceRefresh = true) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}/map-verifications/execute`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: { forceRefresh },
  });
}

export async function approveOwnerStoreApplication(applicationId, adminConfirmed = true) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: {
      adminConfirmed,
    },
  });
}

export async function rejectOwnerStoreApplication(applicationId, reason) {
  return apiRequest(`/api/v1/admin/store-registration-requests/${applicationId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: { reason },
  });
}

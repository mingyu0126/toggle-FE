import { apiRequest } from './api';

export async function lookupPublicInstitutions(externalSource, externalPlaceIds) {
  const normalizedIds = [...new Set(
    (externalPlaceIds || [])
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  )];

  if (normalizedIds.length === 0) {
    return [];
  }

  const data = await apiRequest('/api/v1/public-institutions/lookup', {
    method: 'POST',
    body: {
      externalSource,
      externalPlaceIds: normalizedIds,
    },
  });

  return data.institutions || [];
}

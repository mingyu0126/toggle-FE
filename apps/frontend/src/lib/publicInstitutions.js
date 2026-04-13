import { apiRequest } from './api';

export async function lookupPublicInstitutions(externalSource, requestItems) {
  // requestItems can be string IDs or objects with metadata
  const normalizedItems = (requestItems || []).map(item => {
    if (typeof item === 'string') {
      return { externalPlaceId: item };
    }
    return item;
  });

  if (normalizedItems.length === 0) {
    return [];
  }

  const data = await apiRequest('/api/v1/public-institutions/lookup', {
    method: 'POST',
    body: {
      externalSource,
      items: normalizedItems,
    },
  });

  return data.institutions || [];
}

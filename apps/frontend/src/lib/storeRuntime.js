const DEFAULT_OPERATING_INFO = {
  openTime: '09:00',
  closeTime: '21:00',
  breakStart: '15:00',
  breakEnd: '17:00',
};

export function getStoreLiveStatus(storeId, fallbackStatus = '') {
  if (typeof window === 'undefined') {
    return fallbackStatus;
  }

  return localStorage.getItem(`storeStatus_${storeId}`) || fallbackStatus;
}

export function setStoreLiveStatus(storeId, status) {
  localStorage.setItem(`storeStatus_${storeId}`, status);
}

export function getStoreImages(storeId) {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(`storeImages_${storeId}`) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoreImages(storeId, images) {
  localStorage.setItem(`storeImages_${storeId}`, JSON.stringify(images || []));
}

export function getStoreOperatingInfo(storeId) {
  if (!storeId) {
    return DEFAULT_OPERATING_INFO;
  }

  if (typeof window === 'undefined') {
    return DEFAULT_OPERATING_INFO;
  }

  try {
    const parsed = JSON.parse(localStorage.getItem(`storeOperatingInfo_${storeId}`) || '{}');
    return {
      openTime: parsed.openTime || DEFAULT_OPERATING_INFO.openTime,
      closeTime: parsed.closeTime || DEFAULT_OPERATING_INFO.closeTime,
      breakStart: parsed.breakStart || DEFAULT_OPERATING_INFO.breakStart,
      breakEnd: parsed.breakEnd || DEFAULT_OPERATING_INFO.breakEnd,
    };
  } catch {
    return DEFAULT_OPERATING_INFO;
  }
}

export function getStoreOperatingInfoByCandidates(candidateIds = []) {
  if (typeof window === 'undefined') {
    return DEFAULT_OPERATING_INFO;
  }

  for (const candidateId of candidateIds) {
    if (!candidateId) {
      continue;
    }

    const rawValue = localStorage.getItem(`storeOperatingInfo_${candidateId}`);
    if (rawValue) {
      try {
        const parsed = JSON.parse(rawValue);
        return {
          openTime: parsed.openTime || DEFAULT_OPERATING_INFO.openTime,
          closeTime: parsed.closeTime || DEFAULT_OPERATING_INFO.closeTime,
          breakStart: parsed.breakStart || DEFAULT_OPERATING_INFO.breakStart,
          breakEnd: parsed.breakEnd || DEFAULT_OPERATING_INFO.breakEnd,
        };
      } catch {
        return DEFAULT_OPERATING_INFO;
      }
    }
  }

  return DEFAULT_OPERATING_INFO;
}

export function setStoreOperatingInfo(storeId, operatingInfo) {
  if (!storeId) {
    return;
  }

  localStorage.setItem(`storeOperatingInfo_${storeId}`, JSON.stringify(operatingInfo || {}));
}

export function getOwnerComment(storeId) {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(`ownerComment_${storeId}`) || '';
}

export function setOwnerComment(storeId, comment) {
  localStorage.setItem(`ownerComment_${storeId}`, comment);
}

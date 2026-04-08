export function getStoreLiveStatus(storeId, fallbackStatus = '') {
  if (typeof window === 'undefined') {
    return fallbackStatus;
  }

  return localStorage.getItem(`storeStatus_${storeId}`) || fallbackStatus;
}

export function setStoreLiveStatus(storeId, status) {
  localStorage.setItem(`storeStatus_${storeId}`, status);
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

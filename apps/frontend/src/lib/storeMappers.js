// Removed mockStores import
function createFallbackStore(item) {
  return {
    id: String(item.externalPlaceId || item.storeId),
    internalStoreId: item.storeId,
    name: item.name,
    category: item.categoryName || '매장',
    address: item.address,
    contact: item.phone || '전화번호 정보 없음',
    status: item.businessStatus,
    lastStatusUpdate: '서버 반영',
    businessHours: item.openTime && item.closeTime ? `${item.openTime} - ${item.closeTime}` : '영업시간 정보 없음',
    hasBreakTime: Boolean(item.breakStart),
    breakTime: item.breakStart && item.breakEnd ? `${item.breakStart} - ${item.breakEnd}` : null,
    notice: item.ownerNotice || '',
    rating: item.rating || null,
    images: item.imageUrls || [],
    favorites: 0,
    lat: Number(item.latitude ?? 37.5665),
    lng: Number(item.longitude ?? 126.9780),
  };
}

export function mapFavoriteStoreItemToPlace(item) {
  const externalPlaceId = String(item.externalPlaceId || item.storeId);
  const liveStatus = typeof window !== 'undefined'
    ? localStorage.getItem(`storeStatus_${externalPlaceId}`)
    : null;

  return {
    ...createFallbackStore(item),
    status: liveStatus || item.businessStatus,
  };
}

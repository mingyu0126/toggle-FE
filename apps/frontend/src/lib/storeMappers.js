import { mockStores } from '../mocks/stores.mock';

function createFallbackStore(item) {
  return {
    id: String(item.externalPlaceId || item.storeId),
    internalStoreId: item.storeId,
    name: item.name,
    category: '매장',
    address: item.address,
    contact: item.phone || '전화번호 정보 없음',
    status: item.businessStatus,
    lastStatusUpdate: '서버 반영',
    businessHours: '영업시간 정보 없음',
    hasBreakTime: false,
    breakTime: null,
    notice: '',
    rating: null,
    favorites: 0,
    lat: Number(item.latitude ?? 37.5665),
    lng: Number(item.longitude ?? 126.9780),
  };
}

export function mapFavoriteStoreItemToPlace(item) {
  const externalPlaceId = String(item.externalPlaceId || item.storeId);
  const matched = mockStores.find((store) => String(store.id) === externalPlaceId || store.name === item.name);

  if (!matched) {
    return createFallbackStore(item);
  }

  return {
    ...matched,
    id: externalPlaceId,
    internalStoreId: item.storeId,
    status: item.businessStatus || matched.status,
    address: item.address || matched.address,
    contact: item.phone || matched.contact,
    lat: Number(item.latitude ?? matched.lat),
    lng: Number(item.longitude ?? matched.lng),
  };
}

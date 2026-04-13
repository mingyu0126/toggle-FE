import { STATUS_TYPES } from '../constants/status';

function getKakaoPlaceId(kakaoData) {
  return kakaoData.id || `kakao-${kakaoData.y}-${kakaoData.x}`;
}

export function createSearchPreviewPlace(kakaoData, matchedStore, isLookupLoading = false) {
  const basePlace = {
    id: getKakaoPlaceId(kakaoData),
    name: matchedStore?.name || kakaoData.place_name,
    category: kakaoData.category_group_name || kakaoData.category_name?.split(' > ').pop() || '기타',
    address: matchedStore?.address || kakaoData.road_address_name || kakaoData.address_name,
    contact: kakaoData.phone || '전화번호 미제공',
    businessHours: kakaoData.phone || '전화번호 미제공',
    favorites: 0,
    rating: null,
    hasBreakTime: false,
    breakTime: null,
    notice: '',
    lat: Number(kakaoData.y || 37.5665),
    lng: Number(kakaoData.x || 126.9780),
    objType: 'STORE',
  };

  if (matchedStore) {
    return {
      ...basePlace,
      internalStoreId: matchedStore.storeId,
      status: matchedStore.liveBusinessStatus || matchedStore.businessStatus,
      lastStatusUpdate: '서버 반영',
      rating: matchedStore.rating || null,
      notice: matchedStore.ownerNotice || '',
      images: matchedStore.imageUrls || [],
    };
  }

  if (isLookupLoading) {
    return {
      ...basePlace,
      status: STATUS_TYPES.STORE.LOOKUP_PENDING,
      lastStatusUpdate: '상태 조회 중',
    };
  }

  return {
    ...basePlace,
    status: STATUS_TYPES.STORE.UNREGISTERED,
    lastStatusUpdate: 'Toggle 미등록',
  };
}

export function mergeLookupStoreIntoDetail(fallbackStore, matchedStore, operatingInfo = null) {
  const effectiveOpenTime = matchedStore?.openTime || operatingInfo?.openTime;
  const effectiveCloseTime = matchedStore?.closeTime || operatingInfo?.closeTime;
  const effectiveBreakStart = matchedStore?.breakStart || operatingInfo?.breakStart;
  const effectiveBreakEnd = matchedStore?.breakEnd || operatingInfo?.breakEnd;
  const hasManagedBreakTime = Boolean(effectiveBreakStart && effectiveBreakEnd);

  const safeFallback = fallbackStore || {};

  if (!matchedStore) {
    return operatingInfo
      ? {
          ...safeFallback,
          businessHours: `${operatingInfo.openTime} - ${operatingInfo.closeTime}`,
          hasBreakTime: true,
          breakTime: `${operatingInfo.breakStart} - ${operatingInfo.breakEnd}`,
        }
      : safeFallback;
  }

  return {
    ...safeFallback,
    source: matchedStore.externalSource || safeFallback.source || 'KAKAO',
    id: String(matchedStore.externalPlaceId || safeFallback.id),
    internalStoreId: matchedStore.storeId,
    name: matchedStore.name || safeFallback.name,
    category: matchedStore.categoryName || safeFallback.category,
    address: matchedStore.address || safeFallback.address,
    roadAddress: matchedStore.roadAddress || safeFallback.roadAddress,
    jibunAddress: matchedStore.jibunAddress || safeFallback.jibunAddress,
    contact: matchedStore.phone || safeFallback.contact,
    lat: Number(matchedStore.latitude ?? safeFallback.lat ?? 37.5665),
    lng: Number(matchedStore.longitude ?? safeFallback.lng ?? 126.9780),
    verifiedAt: matchedStore.verifiedAt || safeFallback.verifiedAt,
    rating: matchedStore.rating || safeFallback.rating,
    notice: matchedStore.ownerNotice || safeFallback.notice || '',
    images: matchedStore.imageUrls?.length ? matchedStore.imageUrls : (safeFallback.images || []),
    ownerNotice: matchedStore.ownerNotice || safeFallback.ownerNotice || '',
    ownerImages: matchedStore.imageUrls?.length ? matchedStore.imageUrls : (safeFallback.ownerImages || []),
    businessHours: effectiveOpenTime && effectiveCloseTime
      ? `${effectiveOpenTime} - ${effectiveCloseTime}`
      : safeFallback.businessHours,
    hasBreakTime: hasManagedBreakTime || safeFallback.hasBreakTime,
    breakTime: hasManagedBreakTime
      ? `${effectiveBreakStart} - ${effectiveBreakEnd}`
      : safeFallback.breakTime,
    status: matchedStore.liveBusinessStatus || matchedStore.businessStatus || safeFallback.status,
    lastStatusUpdate: '서버 반영',
  };
}

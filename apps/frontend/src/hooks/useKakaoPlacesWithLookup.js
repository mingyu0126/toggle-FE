import { useEffect, useState } from 'react';
import { lookupStoresByExternalPlaceIds } from '../lib/stores';
import { lookupPublicInstitutions } from '../lib/publicInstitutions';
import { createMergedPreviewPlace } from '../lib/mappers';

// 카카오 카테고리 매핑 테이블
const KAKAO_CATEGORY_MAP = {
  '음식점': 'FD6',
  '카페': 'CE7',
  '편의점': 'CS2',
  '대형마트': 'MT1',
  '약국': 'PM9',
  '병원': 'HP8',
  '공공기관': 'PO3',
  '문화시설': 'CT1',
  '학교': 'SC4',
  '지하철역': 'SW8',
  '주차장': 'PK6',
};

/**
 * 카카오 플레이스 검색 결과를 가져오고, 바로 Toggle Backend의 lookup API를 통해
 * 라이브 영업 상태(liveBusinessStatus) 또는 공공기관 혼잡도 정보를 병합하여 리스트로 반환하는 훅입니다.
 */
export function useKakaoPlacesWithLookup(center, keyword, category, options = { radius: 2000, size: 15 }) {
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // init check
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services || !center) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const ps = new window.kakao.maps.services.Places();
    const searchOptions = {
      location: new window.kakao.maps.LatLng(center.lat, center.lng),
      sort: window.kakao.maps.services.SortBy.DISTANCE,
      radius: options.radius,
      size: options.size, // default 15
    };

    const handlePlacesSearch = async (data, status) => {
      if (cancelled) return;

      if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
        try {
          let matchedStores = [];
          let matchedPublics = [];

          if (category === '공공기관') {
            const requestItems = data.map(item => ({
              externalPlaceId: item.id,
              name: item.place_name,
              address: item.road_address_name || item.address_name,
              latitude: Number(item.y),
              longitude: Number(item.x)
            }));
            matchedPublics = await lookupPublicInstitutions('KAKAO', requestItems);
          } else {
            const externalPlaceIds = data.map(item => item.id);
            matchedStores = await lookupStoresByExternalPlaceIds('KAKAO', externalPlaceIds);
          }
          
          if (cancelled) return;

          // Merge Kakao data with Toggle Backend data
          const mergedPlaces = data.map(kakaoItem => {
            const storeMatch = matchedStores.find(s => s.externalPlaceId === kakaoItem.id);
            const publicMatch = matchedPublics.find(p => p.externalPlaceId === kakaoItem.id);
            
            return createMergedPreviewPlace(kakaoItem, storeMatch, publicMatch, false);
          });

          // 내부 카테고리 필터링 (가벼운 프론트엔드 필터)
          let finalFiltered = mergedPlaces;
          if (category && category !== '전체') {
             finalFiltered = mergedPlaces.filter(p => p.category.includes(category) || (p.originalData.category_name || '').includes(category));
          }

          setPlaces(finalFiltered);
        } catch (error) {
          console.error("Lookup failed:", error);
          if (!cancelled) setPlaces(data.map(item => createMergedPreviewPlace(item, null, null, false)));
        }
      } else {
        if (!cancelled) setPlaces([]);
      }
      if (!cancelled) setIsLoading(false);
    };

    // 카테고리 맵핑
    const categoryCode = KAKAO_CATEGORY_MAP[category];
    if (categoryCode) {
      searchOptions.category_group_code = categoryCode;
    }

    if (keyword && keyword.trim()) {
      ps.keywordSearch(keyword, handlePlacesSearch, searchOptions);
    } else {
      if (categoryCode) {
        ps.categorySearch(categoryCode, handlePlacesSearch, searchOptions);
      } else {
        ps.categorySearch('FD6', handlePlacesSearch, searchOptions);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [center?.lat, center?.lng, keyword, category, options.radius, options.size]);

  return { places, isLoading };
}

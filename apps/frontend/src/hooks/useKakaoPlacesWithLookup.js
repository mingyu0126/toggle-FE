import { useEffect, useState } from 'react';
import { fetchNearbyVerifiedStores, lookupStoresByExternalPlaceIds } from '../lib/stores';
import { lookupPublicInstitutions } from '../lib/publicInstitutions';
import { createMergedPreviewPlace } from '../lib/mappers';
import {
  getAggregateCategoryCodes,
  getAggregateSearchKeywords,
  getSearchMode,
  KAKAO_CATEGORY_MAP,
  matchesUiCategory,
  normalizeUiCategory,
} from '../lib/placeCategories';

function runCategorySearch(placesService, categoryCode, searchOptions) {
  return new Promise((resolve) => {
    placesService.categorySearch(categoryCode, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data) {
        resolve(data);
        return;
      }

      resolve([]);
    }, searchOptions);
  });
}

function runKeywordSearch(placesService, query, searchOptions) {
  return new Promise((resolve) => {
    placesService.keywordSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data) {
        resolve(data);
        return;
      }

      resolve([]);
    }, searchOptions);
  });
}

function dedupePlaces(items) {
  const seen = new Map();

  items.forEach((item) => {
    const key = item?.id || `${item?.place_name}-${item?.x}-${item?.y}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  });

  return [...seen.values()];
}

function sortPlacesByDistance(items) {
  return [...items].sort((a, b) => Number(a.distance || Number.MAX_SAFE_INTEGER) - Number(b.distance || Number.MAX_SAFE_INTEGER));
}

/**
 * 카카오 플레이스 검색 결과를 가져오고, 바로 Toggle Backend의 lookup API를 통해
 * 라이브 영업 상태(liveBusinessStatus) 또는 공공기관 혼잡도 정보를 병합하여 리스트로 반환하는 훅입니다.
 */
export function useKakaoPlacesWithLookup(center, keyword, category, options = { radius: 2000, size: 15 }) {
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const centerLat = center?.lat;
  const centerLng = center?.lng;

  useEffect(() => {
    // init check
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services || centerLat == null || centerLng == null) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const ps = new window.kakao.maps.services.Places();
    const baseSearchOptions = {
      location: new window.kakao.maps.LatLng(centerLat, centerLng),
      sort: window.kakao.maps.services.SortBy.DISTANCE,
      radius: options.radius,
      size: options.size, // default 15
    };

    const fetchPlaces = async () => {
      let rawPlaces = [];

      try {
        const searchMode = getSearchMode(category, keyword);
        const categoryCode = KAKAO_CATEGORY_MAP[category];

        if (!keyword?.trim() && category === '전체') {
          const nearbyStores = await fetchNearbyVerifiedStores({
            latitude: centerLat,
            longitude: centerLng,
            radiusMeters: options.radius,
            limit: options.size,
          });

          if (cancelled) return;

          setPlaces(nearbyStores.map((store) => createMergedPreviewPlace({
            id: store.externalPlaceId,
            place_name: store.name,
            category_group_name: store.categoryName,
            category_name: store.categoryName,
            road_address_name: store.roadAddress || store.address,
            address_name: store.address,
            phone: store.phone,
            y: String(store.latitude),
            x: String(store.longitude),
            distance: 0,
          }, store, null, false)));
          return;
        }

        if (searchMode === 'keyword') {
          const keywordOptions = categoryCode
            ? { ...baseSearchOptions, category_group_code: categoryCode }
            : baseSearchOptions;
          rawPlaces = await runKeywordSearch(ps, keyword.trim(), keywordOptions);
        } else if (searchMode === 'single-category' && categoryCode) {
          rawPlaces = await runCategorySearch(ps, categoryCode, baseSearchOptions);
        } else if (searchMode === 'keyword-seed') {
          const keywordResults = await Promise.all(
            getAggregateSearchKeywords('기타').map((seed) =>
              runKeywordSearch(ps, seed, { ...baseSearchOptions, size: Math.min(options.size, 10) })
            )
          );
          rawPlaces = dedupePlaces(keywordResults.flat());
        } else {
          const categoryResults = await Promise.all(
            getAggregateCategoryCodes().map((code) => runCategorySearch(ps, code, baseSearchOptions))
          );
          rawPlaces = dedupePlaces(categoryResults.flat());
        }

        if (cancelled) return;

        if (!rawPlaces.length) {
          setPlaces([]);
          return;
        }

        const publicCandidates = rawPlaces.filter((item) => normalizeUiCategory(item) === '공공기관');
        const storeCandidates = rawPlaces.filter((item) => normalizeUiCategory(item) !== '공공기관');

        const publicRequestItems = publicCandidates.map((item) => ({
          externalPlaceId: item.id,
          name: item.place_name,
          address: item.road_address_name || item.address_name,
          latitude: Number(item.y),
          longitude: Number(item.x),
        }));

        const [matchedStores, matchedPublics] = await Promise.all([
          storeCandidates.length
            ? lookupStoresByExternalPlaceIds('KAKAO', storeCandidates.map((item) => item.id))
            : Promise.resolve([]),
          publicRequestItems.length
            ? lookupPublicInstitutions('KAKAO', publicRequestItems)
            : Promise.resolve([]),
        ]);

        if (cancelled) return;

        const mergedPlaces = rawPlaces.map((kakaoItem) => {
          const storeMatch = matchedStores.find((store) => store.externalPlaceId === kakaoItem.id);
          const publicMatch = matchedPublics.find((institution) => institution.externalPlaceId === kakaoItem.id);

          return createMergedPreviewPlace(kakaoItem, storeMatch, publicMatch, false);
        });

        const finalFiltered = sortPlacesByDistance(
          mergedPlaces.filter((place) => matchesUiCategory(place, category))
        ).slice(0, options.size);

        setPlaces(finalFiltered);
      } catch (error) {
        console.error('Lookup failed:', error);
        if (!cancelled) {
          setPlaces([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, [centerLat, centerLng, keyword, category, options.radius, options.size]);

  return { places, isLoading };
}

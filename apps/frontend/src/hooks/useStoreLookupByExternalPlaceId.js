import { useEffect, useState } from 'react';
import { lookupStoresByExternalPlaceIds } from '../lib/stores';

export function useStoreLookupByExternalPlaceId(externalPlaceId) {
  const [storeMatch, setStoreMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const normalizedExternalPlaceId = String(externalPlaceId || '').trim();

    if (!normalizedExternalPlaceId) {
      setStoreMatch(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const run = async () => {
      try {
        const stores = await lookupStoresByExternalPlaceIds('KAKAO', [normalizedExternalPlaceId]);
        if (!cancelled) {
          setStoreMatch(stores[0] || null);
        }
      } catch {
        if (!cancelled) {
          setStoreMatch(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [externalPlaceId]);

  return {
    storeMatch,
    isLoading,
  };
}

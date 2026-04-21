import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, User, Map as MapIcon } from 'lucide-react';
import PlaceCard from '../components/common/PlaceCard';
import { fetchStoresByIds } from '../lib/stores';
import { fetchPublicInstitutionsByIds } from '../lib/publicInstitutions';
import { mapStoreToPlace, mapPublicToPlace } from '../lib/mappers';
import { fetchPublicMap } from '../lib/myMap';
import styles from './SharedMap.module.css';

export default function SharedMap() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [searchId, setSearchId] = useState(id || '');
  const [sharedMap, setSharedMap] = useState(null);
  const [sharedPlaces, setSharedPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadSharedMap = async (publicMapId) => {
    if (!publicMapId) {
      setSharedMap(null);
      setSharedPlaces([]);
      setNotFound(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    try {
      const data = await fetchPublicMap(publicMapId);
      const [stores, publics] = await Promise.all([
        fetchStoresByIds(data.stores || []),
        fetchPublicInstitutionsByIds(data.publics || []),
      ]);

      setSharedMap(data);
      setSharedPlaces([
        ...stores.map(mapStoreToPlace).map((item) => ({ ...item, type: 'STORE' })),
        ...publics.map(mapPublicToPlace).map((item) => ({ ...item, type: 'CONGESTION' })),
      ]);
      navigate(`/shared/${publicMapId}`, { replace: true });
    } catch {
      setSharedMap(null);
      setSharedPlaces([]);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      return;
    }

    loadSharedMap(searchId.trim());
  };

  useEffect(() => {
    if (id) {
      setSearchId(id);
      loadSharedMap(id);
    }
    // Shared map loading is route-driven here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>공개 지도 탐색</h1>
        </div>

        <form className={styles.searchBox} onSubmit={handleSearch}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="공개 지도 ID 검색 (ex. user-12)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            검색
          </button>
        </form>
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.emptyState}>검색 중...</div>
        ) : sharedMap ? (
          <>
            <div className={styles.profileCard}>
              <div
                className={styles.avatar}
                style={{
                  backgroundImage: sharedMap.profileImageUrl ? `url(${sharedMap.profileImageUrl})` : 'none',
                  backgroundSize: 'cover',
                }}
              >
                {!sharedMap.profileImageUrl && <User size={24} />}
              </div>
              <div className={styles.userInfo}>
                <h2>{sharedMap.title || `${sharedMap.nickname}님의 지도`}</h2>
                <p>@{sharedMap.publicMapId}</p>
              </div>
            </div>

            <div className={styles.listHeader}>
              <h3 className={styles.listTitle}>공개된 저장 장소</h3>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                총 {sharedPlaces.length}개
              </span>
            </div>

            <div className={styles.placeGrid}>
              {sharedPlaces.length > 0 ? (
                sharedPlaces.map((place) => (
                  <PlaceCard key={`${place.type}-${place.internalStoreId || place.internalId || place.id}`} place={place} type={place.type} />
                ))
              ) : (
                <div className={styles.emptyState}>공개된 장소가 없습니다.</div>
              )}
            </div>
          </>
        ) : notFound ? (
          <div className={styles.emptyState}>
            <User size={48} opacity={0.3} />
            <p>존재하지 않거나 비공개 설정된 지도입니다.</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <MapIcon size={48} opacity={0.3} />
            <p>공개 지도 ID를 검색해 다른 사용자의 저장 장소를 확인해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

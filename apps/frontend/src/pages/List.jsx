import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, MapPin, List as ListIcon, Heart, User } from 'lucide-react';
import SearchBar from '../components/home/SearchBar';
import PlaceCard from '../components/common/PlaceCard';
import { CATEGORIES } from '../constants/status';
import { useKakaoPlacesWithLookup } from '../hooks/useKakaoPlacesWithLookup';
import styles from './List.module.css';

export default function List() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortOrder, setSortOrder] = useState('distance'); // distance, rating, favorites
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  const { places, isLoading: isPlacesLoading } = useKakaoPlacesWithLookup(mapCenter, searchQuery, activeCategory);

  // 모든 장소 태그 병합용
  const allCategories = ['전체', ...new Set([...CATEGORIES.STORE, ...CATEGORIES.PUBLIC])];

  const filteredPlaces = places.filter(p => {
    const matchesOpen = onlyOpen ? p.status === 'OPEN' : true;
    return matchesOpen;
  });

  // 별점/찜 모의 정렬 로직
  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    if (sortOrder === 'favorites') return (b.favorites || 0) - (a.favorites || 0);
    if (sortOrder === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // 거리는 현재 데이터에 임의 로직이 없으므로 그대로
  });

  return (
    <div className={styles.container}>
      {/* 고정 헤더 */}
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button className={styles.backBtn} onClick={() => navigate('/map')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.pageTitle}>통합 리스트</h1>
        </div>
        
        <SearchBar 
           placeholder="이름, 카테고리 검색" 
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           onFilterClick={() => setOnlyOpen(!onlyOpen)}
           isFilterActive={onlyOpen}
        />

        <div className={styles.categoryFilter}>
          {allCategories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* 정렬 및 요약 바 */}
      <div className={styles.filterBar}>
        <div className={styles.totalCount}>
          총 <strong>{sortedPlaces.length}</strong>건
        </div>
        <select 
          className={styles.sortSelect}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="distance">가까운 순</option>
          <option value="favorites">찜 많은 순</option>
          <option value="rating">별점 순</option>
        </select>
      </div>

      {/* 리스트 영역 */}
      <main className={styles.content}>
        {isLocating || isPlacesLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            장소를 찾는 중입니다...
          </div>
        ) : sortedPlaces.length > 0 ? (
          sortedPlaces.map(place => (
            <PlaceCard 
              key={`${place.objType}-${place.id}`} 
              place={place} 
              type={place.objType} 
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            검색 결과가 없습니다.
          </div>
        )}
      </main>

      {/* 하단 네비게이션 (고정) */}
      <div className={styles.bottomNavWrapper}>
        <div className={styles.bottomNav}>
          <button className={styles.navBtn} onClick={() => navigate('/map')}>
            <MapPin size={24} />
            <span>주변</span>
          </button>
          <button className={`${styles.navBtn} ${styles.active}`}>
            <ListIcon size={24} />
            <span>리스트</span>
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/favorites')}>
            <Heart size={24} />
            <span>저장</span>
          </button>
          <button className={styles.navBtn} onClick={() => navigate('/my-map')}>
            <User size={24} />
            <span>마이</span>
          </button>
        </div>
      </div>
    </div>
  );
}

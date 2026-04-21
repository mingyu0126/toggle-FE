import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store as StoreIcon, Heart, User, MapPin, List as ListIcon, Search, Crosshair
} from 'lucide-react';
import { CATEGORIES } from '../constants/status';
import PlaceCard from '../components/common/PlaceCard';
import { useKakaoPlacesWithLookup } from '../hooks/useKakaoPlacesWithLookup';
import styles from './ListWeb.module.css';

const DEFAULT_CENTER = { lat: 37.5065, lng: 127.0536 };
const LAST_LIST_SEARCH_CENTER_KEY = 'toggle:last-list-search-center';

function readStoredSearchCenter() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LAST_LIST_SEARCH_CENTER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistSearchCenter(center) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_LIST_SEARCH_CENTER_KEY, JSON.stringify(center));
}

export default function ListWeb() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [sortOrder, setSortOrder] = useState('distance'); // distance, favorites, rating
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCenter, setSearchCenter] = useState(() => readStoredSearchCenter() || DEFAULT_CENTER);
  const [isLocating, setIsLocating] = useState(false);

  const { places, isLoading: isPlacesLoading } = useKakaoPlacesWithLookup(searchCenter, searchQuery, activeCategory);

  const allCategories = ['전체', ...new Set([...CATEGORIES.STORE, ...CATEGORIES.PUBLIC])];

  const filteredPlaces = places;

  const sortedPlaces = [...filteredPlaces].sort((a, b) => {
    if (sortOrder === 'favorites') return (b.favorites || 0) - (a.favorites || 0);
    if (sortOrder === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // distance is mock
  });

  const handleSearchNearCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSearchCenter(nextCenter);
        persistSearchCenter(nextCenter);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('현위치를 가져올 수 없습니다. 권한을 확인해주세요.');
      }
    );
  };

  return (
    <div className={styles.webContainer}>
      {/* 1. Header */}
      <header className={styles.webHeader}>
        <div className={styles.logoGroup} onClick={() => navigate('/mapweb')}>
          <StoreIcon size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Toggle PC</span>
        </div>
        
        <div className={styles.searchContainer}>
          <div className={styles.headerSearch}>
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <input 
              type="text" 
              placeholder="장소 이름, 주소 검색" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <nav className={styles.navLinks}>
          <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>점주 로그인</button>
          <button className={styles.iconBtn} onClick={() => navigate('/favoritesweb')}><Heart size={20} /></button>
          <button className={styles.iconBtn} onClick={() => navigate('/my-mapweb')}><User size={20} /></button>
        </nav>
      </header>

      {/* 2. Body */}
      <div className={styles.webBody}>
        {/* Left Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>카테고리</h3>
            <div className={styles.categoryList}>
              {allCategories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryItem} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>정렬 기준</h3>
            <div className={styles.sortOptions}>
              <button 
                className={`${styles.sortOption} ${sortOrder === 'distance' ? styles.active : ''}`}
                onClick={() => setSortOrder('distance')}
              >
                가까운 순
              </button>
              <button 
                className={`${styles.sortOption} ${sortOrder === 'favorites' ? styles.active : ''}`}
                onClick={() => setSortOrder('favorites')}
              >
                찜 많은 순
              </button>
              <button 
                className={`${styles.sortOption} ${sortOrder === 'rating' ? styles.active : ''}`}
                onClick={() => setSortOrder('rating')}
              >
                별점 순
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content (Grid Grid) */}
        <main className={styles.contentArea}>
          <div className={styles.gridWrapper}>
            <div className={styles.contentHeader}>
              <div className={styles.summaryText}>
                총 <strong className={styles.countText}>{sortedPlaces.length}</strong>개의 장소
              </div>
              <button
                type="button"
                className={styles.locationSearchBtn}
                onClick={handleSearchNearCurrentLocation}
                disabled={isLocating}
              >
                <Crosshair size={16} />
                <span>{isLocating ? '위치 확인 중' : '현위치로 다시 검색'}</span>
              </button>
            </div>

            {isLocating || isPlacesLoading ? (
              <div className={styles.emptyState}>장소를 찾는 중입니다...</div>
            ) : sortedPlaces.length > 0 ? (
              <div className={styles.gridContainer}>
                {sortedPlaces.map(place => (
                  <PlaceCard 
                    key={`${place.objType}-${place.id}`} 
                    place={place} 
                    type={place.objType} 
                    isWeb={true} 
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                검색 결과가 없습니다.
              </div>
            )}
          </div>

          {/* 3. Footer Navigation Bar */}
          <div className={styles.webBottomNav}>
            <div className={styles.navTabs}>
              <button className={styles.webNavBtn} onClick={() => navigate('/mapweb')}>
                <MapPin size={22} />
                <span>주변</span>
              </button>
              <button className={`${styles.webNavBtn} ${styles.active}`} onClick={() => navigate('/listweb')}>
                <ListIcon size={22} />
                <span>리스트</span>
              </button>
              <button className={styles.webNavBtn} onClick={() => navigate('/favoritesweb')}>
                <Heart size={22} />
                <span>저장</span>
              </button>
              <button className={styles.webNavBtn} onClick={() => navigate('/my-mapweb')}>
                <User size={22} />
                <span>마이</span>
              </button>
            </div>
            <div className={styles.webFooter}>
              <span>&copy; 2026 Toggle PC. All rights reserved.</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

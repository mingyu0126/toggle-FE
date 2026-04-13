import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Store, Users, User, MapPin, List as ListIcon } from 'lucide-react';
import PlaceCard from '../components/common/PlaceCard';
import { fetchFavoriteStores } from '../lib/favorites';
import { lookupPublicInstitutions } from '../lib/publicInstitutions';
import { mapStoreToPlace, mapPublicToPlace } from '../lib/mappers';
import { getCurrentUser, getLocalFavorites, isLoggedIn as getIsLoggedIn, updateCurrentUser } from '../lib/session';
import styles from './Favorites.module.css';

export default function Favorites() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [isLoggedIn, setIsLoggedIn] = useState(() => getIsLoggedIn());
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [favoritePublics, setFavoritePublics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFavorites = async () => {
    if (!getIsLoggedIn()) {
      setFavoriteStores([]);
      setFavoritePublics([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [storeItems, latestFavorites] = await Promise.all([
        fetchFavoriteStores().catch(err => {
          console.error('Stores load failed:', err);
          return []; // 부분 실패 허용
        }),
        Promise.resolve(getLocalFavorites())
      ]);
      
      setFavoriteStores(storeItems.map(mapStoreToPlace));
      
      if (latestFavorites.publics?.length > 0) {
        try {
          const publicItems = await lookupPublicInstitutions('KAKAO', latestFavorites.publics);
          setFavoritePublics(publicItems.map(mapPublicToPlace));
        } catch (err) {
          console.error('Publics load failed:', err);
          setFavoritePublics([]);
        }
      } else {
        setFavoritePublics([]);
      }
    } catch (loadError) {
      setError('장소를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFavoritesChanged = () => {
      setIsLoggedIn(getIsLoggedIn());
      loadFavorites();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, []);

  const totalCount = favoriteStores.length + favoritePublics.length;

  const handleAddToMyMap = (itemId, type) => {
    const latestUser = getCurrentUser();
    const myMap = latestUser.myMap || { stores: [], publics: [] };
    const key = type === 'STORE' ? 'stores' : 'publics';
    const value = String(itemId);

    if ((myMap[key] || []).map(String).includes(value)) {
      alert('이미 내 지도에 추가된 장소입니다.');
      return;
    }

    const updatedMyMap = {
      ...myMap,
      [key]: [...(myMap[key] || []), value],
    };

    updateCurrentUser({ ...latestUser, myMap: updatedMyMap });

    alert('내 지도에 성공적으로 추가되었습니다.');
  };

  const showStoreSection = activeTab === 'ALL' || activeTab === 'STORE';
  const showPublicSection = activeTab === 'ALL' || activeTab === 'PUBLIC';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>저장한 장소</h1>
      </header>

      <div className={styles.tabWrapper}>
        <div className={styles.tabContainer}>
          <button className={`${styles.tab} ${activeTab === 'ALL' ? styles.active : ''}`} onClick={() => setActiveTab('ALL')}>
            기본 전체 {isLoggedIn ? `(${totalCount})` : ''}
          </button>
          <button className={`${styles.tab} ${activeTab === 'STORE' ? styles.active : ''}`} onClick={() => setActiveTab('STORE')}>
            매장 {isLoggedIn ? `(${favoriteStores.length})` : ''}
          </button>
          <button className={`${styles.tab} ${activeTab === 'PUBLIC' ? styles.active : ''}`} onClick={() => setActiveTab('PUBLIC')}>
            공공기관 {isLoggedIn ? `(${favoritePublics.length})` : ''}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {!isLoggedIn ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Heart size={48} strokeWidth={1} />
            </div>
            <h3>로그인 후 저장한 장소를 확인할 수 있습니다</h3>
            <p>하트 버튼과 저장 목록은 로그인한 사용자 기준으로 동기화됩니다.</p>
            <button className={styles.goMapBtn} onClick={() => navigate('/login')}>
              로그인하러 가기
            </button>
          </div>
        ) : (
          <>
            {isLoading && <div className={styles.emptyState}><p>저장한 장소를 불러오는 중입니다...</p></div>}
            {!isLoading && error && <div className={styles.emptyState}><p>{error}</p></div>}

            {!isLoading && !error && showStoreSection && favoriteStores.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Store size={18} className={styles.iconStore} />
                  <h2 className={styles.sectionTitle}>저장한 매장</h2>
                </div>
                <div className={styles.grid}>
                  {favoriteStores.map((store) => (
                    <div key={store.id} style={{ position: 'relative' }}>
                      <PlaceCard place={store} type="STORE" />
                      <button className={styles.myMapBtn} onClick={() => handleAddToMyMap(store.id, 'STORE')}>
                        내 지도에 추가
                      </button>
                    </div>
                  ))}
                </div>
              </section> section
            )}

            {!isLoading && !error && showPublicSection && favoritePublics.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Users size={18} className={styles.iconPublic} />
                  <h2 className={styles.sectionTitle}>저장한 공공기관</h2>
                </div>
                <div className={styles.grid}>
                  {favoritePublics.map((place) => (
                    <div key={place.id} style={{ position: 'relative' }}>
                      <PlaceCard place={place} type="CONGESTION" />
                      <button className={styles.myMapBtn} onClick={() => handleAddToMyMap(place.id, 'PUBLIC')}>
                        내 지도에 추가
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isLoading && !error && (
              ((activeTab === 'ALL' && totalCount === 0) ||
              (activeTab === 'STORE' && favoriteStores.length === 0) ||
              (activeTab === 'PUBLIC' && favoritePublics.length === 0))
            ) && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Heart size={48} strokeWidth={1} />
                </div>
                <h3>저장한 장소가 없습니다</h3>
                <p>마음에 드는 장소의 하트를 눌러보세요.</p>
                <button className={styles.goMapBtn} onClick={() => navigate('/map')}>
                  <MapPin size={18} /> 지도에서 찾아보기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.bottomNavWrapper}>
        <nav className={styles.bottomNav}>
          <button style={navBtnStyle(false)} onClick={() => navigate('/map')}>
            <MapPin size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>주변</span>
          </button>
          <button style={navBtnStyle(false)} onClick={() => navigate('/list')}>
            <ListIcon size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>리스트</span>
          </button>
          <button style={navBtnStyle(true)}>
            <Heart size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>저장</span>
          </button>
          <button style={navBtnStyle(false)} onClick={() => navigate('/my-map')}>
            <User size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>마이</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

const navBtnStyle = (isActive) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
  background: 'none',
  border: 'none',
  outline: 'none',
  fontWeight: isActive ? 700 : 500,
  cursor: 'pointer',
});

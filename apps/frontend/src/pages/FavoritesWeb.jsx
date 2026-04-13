import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import {
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon,
} from 'lucide-react';
import PlaceCard from '../components/common/PlaceCard';
import { fetchFavoriteStores } from '../lib/favorites';
import { lookupPublicInstitutions } from '../lib/publicInstitutions';
import { mapStoreToPlace, mapPublicToPlace } from '../lib/mappers';
import { clearAuthSession, getCurrentUser, getLocalFavorites, isLoggedIn as getIsLoggedIn } from '../lib/session';
import styles from './FavoritesWeb.module.css';

export default function FavoritesWeb() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [favoritePublics, setFavoritePublics] = useState([]);
  const [favoritePublicIds, setFavoritePublicIds] = useState(() => getLocalFavorites().publics || []);
  const [myLocation, setMyLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
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
          return [];
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
      setCurrentUser(getCurrentUser());
      setFavoritePublicIds(getLocalFavorites().publics || []);
      loadFavorites();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(getIsLoggedIn());
      setCurrentUser(getCurrentUser());
      setFavoritePublicIds(getLocalFavorites().publics || []);
      loadFavorites();
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  const favStoresMapped = favoriteStores.map((store, index) => ({
    ...store,
    type: 'STORE',
    position: { lat: Number(store.lat) || 37.5065 + (index * 0.001), lng: Number(store.lng) || 127.0536 + (index * 0.001) },
    color: '#10b981',
  }));

  const favPublicsMapped = favoritePublics
    .map((place, index) => ({
      ...place,
      type: 'CONGESTION',
      position: { lat: Number(place.lat) || 37.5050 - (index * 0.001), lng: Number(place.lng) || 127.0520 + (index * 0.001) },
      color: '#3b82f6',
    }));

  const allItems = [...favStoresMapped, ...favPublicsMapped];
  const filteredItems = allItems.filter((item) => {
    if (activeTab === 'STORE') return item.type === 'STORE';
    if (activeTab === 'PUBLIC') return item.type === 'CONGESTION';
    return true;
  });

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(location);
          setMyLocation(location);
        },
        () => alert('현위치를 가져올 수 없습니다.'),
      );
    }
  };

  const focusPlace = (item) => {
    if (item.position) {
      setMapCenter(item.position);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/loginweb');
  };

  return (
    <div className={styles.webContainer}>
      <header className={styles.webHeader}>
        <div className={styles.logoGroup} onClick={() => navigate('/mapweb')}>
          <StoreIcon size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Toggle PC</span>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.headerSearch} onClick={() => navigate('/mapweb')}>
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '0.75rem', fontSize: '1rem' }}>
              장소, 주소 검색
            </span>
          </div>
        </div>

        <nav className={styles.navLinks}>
          {isLoggedIn ? (
            <button className={styles.navBtn} onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>로그인</button>
          )}
          <button className={styles.iconBtn} onClick={() => navigate('/favoritesweb')}><Heart size={20} /></button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate(isLoggedIn ? '/my-mapweb' : '/loginweb')}
            title={currentUser.email || '마이페이지'}
          >
            <User size={20} />
          </button>
        </nav>
      </header>

      <div className={styles.webBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitleWrap}>
              <h1 className={styles.sidebarTitle}>저장한 장소</h1>
              <p className={styles.sidebarSubtitle}>서버에 저장된 매장 즐겨찾기와 공공기관 저장 목록을 함께 보여줍니다.</p>
            </div>
          </div>

          <div className={styles.tabContainer}>
            <button className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.activeTab : ''}`} onClick={() => setActiveTab('ALL')}>전체</button>
            <button className={`${styles.tabBtn} ${activeTab === 'STORE' ? styles.activeTab : ''}`} onClick={() => setActiveTab('STORE')}>매장</button>
            <button className={`${styles.tabBtn} ${activeTab === 'PUBLIC' ? styles.activeTab : ''}`} onClick={() => setActiveTab('PUBLIC')}>공공기관</button>
          </div>

          <div className={styles.placeList}>
            {!isLoggedIn && <div className={styles.emptyState}>로그인 후 저장한 장소를 확인할 수  있습니다.</div>}
            {isLoggedIn && isLoading && <div className={styles.emptyState}>저장한 장소를 불러오는 중입니다.</div>}
            {isLoggedIn && !isLoading && error && <div className={styles.emptyState}>{error}</div>}
            {isLoggedIn && !isLoading && !error && filteredItems.length === 0 && (
              <div className={styles.emptyState}>
                저장한 장소가 없습니다.
              </div>
            )}

            {isLoggedIn && !isLoading && !error && filteredItems.map((item) => (
              <div key={`${item.type}-${item.internalStoreId || item.id}`} onClick={() => focusPlace(item)}>
                <PlaceCard place={item} type={item.type} isWeb />
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
            >
              {filteredItems.map((item) => (
                <CustomOverlayMap key={`marker-${item.type}-${item.internalStoreId || item.id}`} position={item.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div
                      className={styles.markerBaloon}
                      onClick={() => navigate(item.type === 'CONGESTION' ? `/publicweb/${item.id}` : `/storeweb/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ width: 8, height: 8, background: item.color, borderRadius: '50%' }} />
                      <span style={{ color: item.color }}>{item.name || item.title}</span>
                      <span style={{ color: 'var(--color-primary)', marginLeft: '0.25rem', fontWeight: 800 }}>&rsaquo;</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} style={{ color: item.color }} />
                  </div>
                </CustomOverlayMap>
              ))}

              {myLocation && (
                <CustomOverlayMap position={myLocation} zIndex={50}>
                  <div className={styles.myLocationMarker}>
                    <div className={styles.myLocationCore} />
                    <div className={styles.myLocationPulse} />
                  </div>
                </CustomOverlayMap>
              )}
            </Map>

            <button className={styles.myLocationBtn} onClick={handleMyLocation}>
              <Crosshair size={24} />
            </button>
          </main>

          <div className={styles.webBottomNav}>
            <div className={styles.navTabs}>
              <button className={styles.webNavBtn} onClick={() => navigate('/mapweb')}>
                <MapPin size={22} />
                <span>주변</span>
              </button>
              <button className={styles.webNavBtn} onClick={() => navigate('/listweb')}>
                <ListIcon size={22} />
                <span>리스트</span>
              </button>
              <button className={`${styles.webNavBtn} ${styles.active}`} onClick={() => navigate('/favoritesweb')}>
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
              <div className={styles.footerLinks}>
                <a href="#">이용약관</a>
                <a href="#">개인정보처리방침</a>
                <a href="#">고객센터</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

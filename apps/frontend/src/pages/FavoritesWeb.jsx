import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon 
} from 'lucide-react';
import { mockUser } from '../mocks/users.mock';
import { mockStores } from '../mocks/stores.mock';
import { mockPublicInstitutions } from '../mocks/public.mock';
import PlaceCard from '../components/common/PlaceCard';
import styles from './FavoritesWeb.module.css';

export default function FavoritesWeb() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'STORE' | 'PUBLIC'
  
  // Map control states
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  // Mock user's favorites
  const favStoreIds = mockUser.favorites.stores;
  const favPublicIds = mockUser.favorites.publics;

  const favStores = mockStores
    .filter(s => favStoreIds.includes(s.id))
    .map((s, idx) => ({
      ...s,
      type: 'STORE',
      position: { lat: 37.5065 + (idx * 0.001), lng: 127.0536 + (idx * 0.001) },
      color: '#10b981' // Green for stores
    }));

  const favPublics = mockPublicInstitutions
    .filter(p => favPublicIds.includes(p.id))
    .map((p, idx) => ({
      ...p,
      type: 'CONGESTION',
      position: { lat: 37.5050 - (idx * 0.001), lng: 127.0520 + (idx * 0.001) },
      color: '#3b82f6' // Blue for public
    }));

  const allItems = [...favStores, ...favPublics];

  const filteredItems = allItems.filter(item => {
    if (activeTab === 'STORE') return item.type === 'STORE';
    if (activeTab === 'PUBLIC') return item.type === 'CONGESTION';
    return true;
  });

  // Handle My Location Click
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(loc);
          setMyLocation(loc);
        },
        () => alert('현위치를 가져올 수 없습니다.')
      );
    }
  };

  return (
    <div className={styles.webContainer}>
      {/* 바깥 상단 헤더 */}
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
          <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>점주 로그인</button>
          <button className={styles.iconBtn}><Heart size={20} /></button>
          <button className={styles.iconBtn}><User size={20} /></button>
        </nav>
      </header>
 
      <div className={styles.webBody}>
        {/* Left Sidebar: Favorites list */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.titleSec}>
               <Heart size={24} fill="var(--color-status-red)" color="var(--color-status-red)" />
               <h2>저장한 장소</h2>
            </div>
            
            <div className={styles.tabContainer}>
              <button 
                className={`${styles.tab} ${activeTab === 'ALL' ? styles.active : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                전체 ({allItems.length})
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'STORE' ? styles.active : ''}`}
                onClick={() => setActiveTab('STORE')}
              >
                매장 ({favStores.length})
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'PUBLIC' ? styles.active : ''}`}
                onClick={() => setActiveTab('PUBLIC')}
              >
                공공기관 ({favPublics.length})
              </button>
            </div>
          </div>

          <div className={styles.listContainer}>
            {filteredItems.length > 0 ? (
              <div className={styles.cardsWrapper}>
                {filteredItems.map(item => (
                  <div 
                     key={`${item.type}-${item.id}`} 
                     className={styles.cardItem} 
                     onClick={() => {
                        setMapCenter(item.position);
                        setSelectedPlace(item);
                     }}
                  >
                    <PlaceCard 
                      place={item} 
                      type={item.type} 
                      isWeb={true}
                    />
                  </div>
                ))}
              </div>
             ) : (
                <div className={styles.emptyState}>
                   저장한 장소가 없습니다.
                </div>
             )}
          </div>
        </aside>

        {/* Right Content: Map */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
              onCreate={() => setIsMapLoaded(true)}
            >
              {/* 즐겨찾기 목록 마커들 (스마트 핀 구조) */}
              {filteredItems.map((item) => (
                <CustomOverlayMap key={`marker-${item.id}`} position={item.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div 
                      className={styles.markerBaloon} 
                      onClick={() => navigate(item.type === 'CONGESTION' ? `/publicweb/${item.id}` : `/storeweb/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{width: 8, height: 8, background: item.color, borderRadius: '50%'}} /> 
                      <span style={{color: item.color}}>{item.name || item.title}</span>
                      <span style={{ color: 'var(--color-primary)', marginLeft: '0.25rem', fontWeight: 800 }}>&rsaquo;</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} style={{ color: item.color }} />
                  </div>
                </CustomOverlayMap>
              ))}

              {/* 내 위치 마커 */}
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

          {/* 데스크탑 맵 하단 네비게이션 & 푸터 */}
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

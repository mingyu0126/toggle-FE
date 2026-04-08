import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon,
  ChevronLeft, Clock, BarChart2, Share2, Navigation
} from 'lucide-react';
import { mockPublicInstitutions } from '../mocks/public.mock';
import StatusBadge from '../components/common/StatusBadge';
import { clearAuthSession, getCurrentUser, isLoggedIn as getIsLoggedIn } from '../lib/session';
import styles from './PublicWeb.module.css';

export default function PublicWeb() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  
  // mock data lookup
  const place = mockPublicInstitutions.find(p => p.id === id) || mockPublicInstitutions[0]; 

  // Map control states
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [myLocation, setMyLocation] = useState(null);

  // Search State
  const [keyword, setKeyword] = useState('');
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 스크롤 상태
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(getIsLoggedIn());
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  useEffect(() => {
    if (place && place.lat && place.lng) {
      setMapCenter({ lat: place.lat, lng: place.lng });
    }
  }, [place]);

  const handleDirections = () => {
    if (place && place.lat && place.lng) {
      window.open(`https://map.kakao.com/link/to/${place.name},${place.lat},${place.lng}`, '_blank');
    } else {
      alert('위치 정보가 없습니다.');
    }
  };

  const handleShare = () => {
    const shareData = {
      title: place.name,
      text: `[Toggle] ${place.name} (${place.category}) 현재 혼잡도를 확인해 보세요!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('주소가 클립보드에 복사되었습니다! 친구에게 공유해 보세요. 📋');
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // 실시간 연관 검색어 (디바운스)
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const ps = new window.kakao.maps.services.Places();
        const center = myLocation || mapCenter;
        ps.keywordSearch(keyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setSuggestions(data);
            setIsDropdownOpen(true);
          }
        }, { location: new window.kakao.maps.LatLng(center.lat, center.lng) });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const handleSelectPlace = (placeData) => {
    const pos = { lat: Number(placeData.y), lng: Number(placeData.x) };
    setMapCenter(pos);
    setSelectedPlace({ id: placeData.id, position: pos, title: placeData.place_name });
    setKeyword(placeData.place_name);
    setIsDropdownOpen(false);
  };

  if (!place) return <div style={{color: 'white', padding: '2rem'}}>Institution not found</div>;

  const coverImageUrl = "https://images.unsplash.com/photo-1577985051167-0d49eec21977?auto=format&fit=crop&w=800&q=80";

  const handleLogout = () => {
    clearAuthSession();
    navigate('/loginweb');
  };

  return (
    <div className={styles.webContainer}>
      {/* 글로벌 헤더 */}
      <header className={styles.webHeader}>
        <div className={styles.logoGroup} onClick={() => navigate('/mapweb')}>
          <StoreIcon size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Toggle PC</span>
        </div>
        
        <div className={styles.searchContainer}>
          <div className={styles.headerSearch}>
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <input 
              type="text" placeholder="장소, 주소 검색" className={styles.headerInput}
              value={keyword} onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => { if(suggestions.length > 0) setIsDropdownOpen(true); }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />
          </div>
          {isDropdownOpen && suggestions.length > 0 && (
            <ul className={styles.suggestionList}>
              {suggestions.map((item) => (
                <li key={item.id} className={styles.suggestionItem} onClick={() => handleSelectPlace(item)}>
                  <MapPin size={16} color="var(--color-primary)" className={styles.suggestionIcon} />
                  <div className={styles.suggestionText}>
                    <span className={styles.suggestionName}>{item.place_name}</span>
                    <span className={styles.suggestionAddress}>{item.address_name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className={styles.navLinks}>
          {isLoggedIn ? (
            <button className={styles.navBtn} onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>로그인</button>
          )}
          <button className={styles.iconBtn} onClick={() => navigate(isLoggedIn ? '/favoritesweb' : '/loginweb')}><Heart size={20} /></button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate(isLoggedIn ? '/my-mapweb' : '/loginweb')}
            title={currentUser.email || '마이페이지'}
          >
            <User size={20} />
          </button>
        </nav>
      </header>

      {/* 메인 2단 레이아웃 */}
      <div className={styles.webBody}>
        <aside className={styles.sidebar}>
          <div className={`${styles.detailHeader} ${isScrolled ? styles.headerSolid : ''}`}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
            <div className={styles.headerTitle}>{place.name}</div>
            <button className={styles.headerActionBtn}><Heart size={22} color={isScrolled ? '#1e293b' : 'white'} /></button>
          </div>

          <div className={styles.scrollArea} onScroll={handleScroll}>
            <div className={styles.coverArea}>
              <img src={coverImageUrl} alt={place.name} className={styles.coverImage} />
              <div className={styles.coverOverlay} />
            </div>

            <div className={styles.content}>
              <h1 className={styles.title}>{place.name}</h1>
              <span className={styles.category}>{place.category}</span>
                
              <div className={styles.statusWrapper}>
                <StatusBadge status={place.status} type="CONGESTION" size="md" />
                <span className={styles.updateTime}>{place.lastStatusUpdate} 업데이트</span>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoItem}><MapPin size={18} className={styles.icon} /><span>{place.address}</span></div>
                <div className={styles.infoItem}>
                  <Clock size={18} className={styles.icon} />
                  <div>
                    <div>운영시간: {place.businessHours}</div>
                    <div style={{ color: 'var(--color-status-orange)', marginTop: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      예상 대기시간 {place.estimatedWaitTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* 시간대별 예상 혼잡도 차트 */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart2 size={20} /> 시간대별 예상 혼잡도 추이
                </h2>
                <div className={styles.chartContainer}>
                  {place.hourlyCongestion && place.hourlyCongestion.map((hour, idx) => {
                    let barColor = 'linear-gradient(180deg, var(--color-status-green) 0%, rgba(16, 185, 129, 0.1) 100%)';
                    if (hour.level > 80) barColor = 'linear-gradient(180deg, var(--color-status-red) 0%, rgba(2ef, 68, 68, 0.1) 100%)';
                    else if (hour.level > 50) barColor = 'linear-gradient(180deg, var(--color-status-orange) 0%, rgba(245, 158, 11, 0.1) 100%)';

                    return (
                      <div key={idx} className={styles.chartBarWrapper}>
                        <div className={styles.chartBar} style={{ height: `${hour.level}%`, background: barColor }} />
                        <span className={styles.chartLabel}>{hour.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ paddingBottom: '100px' }}></div>
            </div>
          </div>
          
          <div className={styles.floatingActionBar}>
            <button className={styles.shareBtn} onClick={handleShare}><Share2 size={22} /></button>
            <button className={styles.navBtnFloat} onClick={handleDirections}><Navigation size={20} /> 길찾기</button>
          </div>
        </aside>

        {/* 우측 지도 컨텐츠 영역 */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map center={mapCenter} style={{ width: '100%', height: '100%', borderRadius: '16px' }} level={4} onCreate={() => setIsMapLoaded(true)}>
              {searchMarkers.length === 0 && !selectedPlace && (
                <CustomOverlayMap position={mapCenter} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div className={styles.markerBaloon}>
                      <div style={{width: 8, height: 8, background: '#10b981', borderRadius: '50%'}} /> 
                      <span>{place.status}</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} />
                  </div>
                </CustomOverlayMap>
              )}
              {/* 내 위치 시뮬레이션 생략 */}
            </Map>
          </main>
        </div>
      </div>
    </div>
  );
}

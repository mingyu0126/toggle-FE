import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon,
  ChevronLeft, Phone, Clock, AlertCircle, Share2, Navigation
} from 'lucide-react';
import { mockStores } from '../mocks/stores.mock';
import StatusBadge from '../components/common/StatusBadge';
import ImageCarousel from '../components/common/ImageCarousel';
import { addFavoriteStore, removeFavoriteStore } from '../lib/favorites';
import { clearAuthSession, getCurrentUser, getLocalFavorites, isLoggedIn as getIsLoggedIn } from '../lib/session';
import { getOwnerComment, getStoreLiveStatus } from '../lib/storeRuntime';
import styles from './StoreWeb.module.css';

export default function StoreWeb() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // mock data lookup
  const initialStore = mockStores.find(s => s.id === id) || mockStores[0];
  const store = {
    ...initialStore,
    status: getStoreLiveStatus(initialStore.id, initialStore.status),
  };
  const ownerComment = getOwnerComment(initialStore.id);
  const [isFavorite, setIsFavorite] = useState(() => getLocalFavorites().stores.map(String).includes(String(store.id)));
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

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
    // 해당 가게 위치로 지도 중심 이동
    if (store && store.lat && store.lng) {
      setMapCenter({ lat: store.lat, lng: store.lng });
    } else {
      // 위치 데이터가 mock에 없을 경우 임시 위치
      setMapCenter({ lat: 37.5065, lng: 127.0536 });
    }
  }, [store]);

  useEffect(() => {
    const syncFavoriteState = () => {
      setIsFavorite(getLocalFavorites().stores.map(String).includes(String(store.id)));
    };

    syncFavoriteState();
    window.addEventListener('favoritesChanged', syncFavoriteState);
    return () => window.removeEventListener('favoritesChanged', syncFavoriteState);
  }, [store.id]);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(getIsLoggedIn());
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  const handleDirections = () => {
    if (store && store.lat && store.lng) {
      window.open(`https://map.kakao.com/link/to/${store.name},${store.lat},${store.lng}`, '_blank');
    } else {
      alert('위치 정보가 없습니다.');
    }
  };

  const handleShare = () => {
    const shareData = {
      title: store.name,
      text: `[Toggle] ${store.name} (${store.category}) 현재 상태를 확인해 보세요!`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('주소가 클립보드에 복사되었습니다! 친구에게 공유해 보세요. 📋');
    }
  };

  const handleFavoriteClick = async () => {
    if (!isLoggedIn) {
      alert('로그인 후 이용할 수 있습니다.');
      return;
    }

    if (isFavoriteSubmitting) {
      return;
    }

    setIsFavoriteSubmitting(true);

    try {
      if (isFavorite) {
        await removeFavoriteStore(store);
        setIsFavorite(false);
      } else {
        await addFavoriteStore(store);
        setIsFavorite(true);
      }
    } catch (error) {
      alert(error.message || '즐겨찾기 처리 중 오류가 발생했습니다.');
    } finally {
      setIsFavoriteSubmitting(false);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // 실시간 연관 검색어 (디바운스 처리)
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
        const searchOptions = {
          size: 5,
          location: new window.kakao.maps.LatLng(center.lat, center.lng),
          sort: window.kakao.maps.services.SortBy.DISTANCE 
        };

        ps.keywordSearch(keyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setSuggestions(data);
            setIsDropdownOpen(true);
          } else {
            setSuggestions([]);
            setIsDropdownOpen(false);
          }
        }, searchOptions);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // 장소 클릭 처리 공통함수
  const handleSelectPlace = (placeData) => {
    const pos = { lat: Number(placeData.y), lng: Number(placeData.x) };
    setMapCenter(pos);
    setSelectedPlace({
      id: placeData.id,
      position: pos,
      title: placeData.place_name,
      status: '검색위치',
      color: '#3b82f6'
    });
    setKeyword(placeData.place_name);
    setIsDropdownOpen(false);
  };

  // 카카오 장소 검색 API 호출 (엔터)
  const handleSearch = (e) => {
    if (e.key === 'Enter' && keyword.trim()) {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        alert('카카오 지도 설정이 로드되지 않았습니다.');
        return;
      }
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(keyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
          const bounds = new window.kakao.maps.LatLngBounds();
          let markers = [];
          
          for (var i = 0; i < data.length; i++) {
            markers.push({
              position: { lat: Number(data[i].y), lng: Number(data[i].x) },
              title: data[i].place_name,
              id: data[i].id
            });
            bounds.extend(new window.kakao.maps.LatLng(data[i].y, data[i].x));
          }
          
          setSearchMarkers(markers);
          handleSelectPlace(data[0]);
        } else {
          alert('검색 결과가 존재하지 않습니다.');
        }
      });
    }
  };

  if (!store) return <div style={{color: 'white', padding: '2rem'}}>Store not found</div>;

  // 임시 커버 이미지
  const coverImages = store.images && store.images.length > 0
    ? store.images
    : ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"];

  // HTML5 현위치 기능
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(loc);
          setMyLocation(loc);
        },
        (error) => {
          alert('현위치를 가져올 수 없습니다. 권한을 확인해주세요.');
        }
      );
    } else {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/loginweb');
  };

  return (
    <div className={styles.webContainer}>
      {/* 웹 전용 글로벌 헤더 */}
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
              placeholder="장소, 주소 검색" 
              className={styles.headerInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => { if(suggestions.length > 0) setIsDropdownOpen(true); }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />
          </div>
          
          {/* 연관 검색어 드롭다운 */}
          {isDropdownOpen && suggestions.length > 0 && (
            <ul className={styles.suggestionList}>
              {suggestions.map((item) => {
                let distanceText = '';
                if (item.distance) {
                  const d = parseInt(item.distance, 10);
                  distanceText = d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`;
                }
                return (
                  <li 
                    key={item.id} 
                    className={styles.suggestionItem}
                    onClick={() => handleSelectPlace(item)}
                  >
                    <MapPin size={16} color="var(--color-primary)" className={styles.suggestionIcon} />
                    <div className={styles.suggestionText}>
                      <span className={styles.suggestionName}>{item.place_name}</span>
                      <span className={styles.suggestionAddress}>
                        {distanceText && <span style={{color: 'var(--color-primary)', fontWeight: 600, marginRight: '4px'}}>{distanceText} ·</span>}
                        {item.address_name}
                      </span>
                    </div>
                  </li>
                )
              })}
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

      {/* 메인 2단 레이아웃 (좌 사이드바 - 상세정보, 우 지도) */}
      <div className={styles.webBody}>
        
        {/* 좌측 사이드바: 모바일 상세 페이지의 컨텐츠를 그대로 이식 */}
        <aside className={styles.sidebar}>
          {/* 동적 헤더 (모바일의 뒤로가기 액션 바 역할) */}
          <div className={`${styles.detailHeader} ${isScrolled ? styles.headerSolid : ''}`}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <div className={styles.headerTitle}>{store.name}</div>
            <button className={styles.headerActionBtn} onClick={handleFavoriteClick} disabled={isFavoriteSubmitting}>
              <Heart size={22} color={isFavorite ? '#ef4444' : (isScrolled ? '#1e293b' : 'white')} fill={isFavorite ? '#ef4444' : 'none'} />
            </button>
          </div>

          <div className={styles.scrollArea} onScroll={handleScroll}>
            {/* 커버 이미지 영역 */}
            <div className={styles.coverArea}>
              <ImageCarousel images={coverImages} alt={store.name} />
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{store.name}</h1>
              </div>
              <span className={styles.category}>{store.category}</span>
                
              <div className={styles.statusWrapper}>
                <StatusBadge status={store.status} type="STORE" size="md" />
                <span className={styles.updateTime}>{store.lastStatusUpdate} 업데이트</span>
              </div>

              {ownerComment && (
                <div className={styles.noticeBox} style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
                  <span style={{ fontWeight: 800, marginRight: '0.4rem' }}>📢 사장님 알림:</span>
                  <span>"{ownerComment}"</span>
                </div>
              )}

              {store.notice && (
                <div className={styles.noticeBox}>
                  <AlertCircle size={18} />
                  <span>{store.notice}</span>
                </div>
              )}

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <MapPin size={18} className={styles.icon} />
                  <span>{store.address}</span>
                </div>
                <div className={styles.infoItem}>
                  <Phone size={18} className={styles.icon} />
                  <span>{store.contact}</span>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={18} className={styles.icon} />
                  <div>
                    <div>{store.businessHours}</div>
                    {store.hasBreakTime && (
                      <div style={{ color: 'var(--color-status-orange)', marginTop: '0.25rem', fontSize: 'var(--font-size-sm)' }}>
                        휴게시간: {store.breakTime}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ paddingBottom: '80px' }}></div> {/* 플로팅 바 여백 */}
            </div>
          </div>
          
          {/* 하단 고정 플로팅 바 (사이드바 내부) */}
          <div className={styles.floatingActionBar}>
            <button className={styles.shareBtn} onClick={handleShare}>
              <Share2 size={22} />
            </button>
            <button className={styles.navBtnFloat} onClick={handleDirections}>
              <Navigation size={20} /> 길찾기
            </button>
          </div>
        </aside>

        {/* 우측 메인 컨텐츠 영역 (지도) */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
              onCreate={() => setIsMapLoaded(true)}
            >
              {/* Store 마커 (스마트 핀) - 검색 결과가 없을 때만 현재 상점 렌더링 */}
              {searchMarkers.length === 0 && !selectedPlace && (
                <CustomOverlayMap position={mapCenter} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div className={styles.markerBaloon} style={{ cursor: 'default' }}>
                      <div style={{width: 8, height: 8, background: '#10b981', borderRadius: '50%'}} /> 
                      <span style={{color: '#10b981'}}>{store.status === 'OPEN' || store.status === '영업중' ? '영업중' : store.status}</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} />
                  </div>
                </CustomOverlayMap>
              )}

              {/* 검색 결과 마커 */}
              {searchMarkers.map((marker) => (
                <MapMarker 
                  key={`search-${marker.id}`}
                  position={marker.position}
                  title={marker.title}
                  image={{
                    src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                    size: { width: 24, height: 35 }
                  }}
                  onClick={() => {
                    setSelectedPlace({
                      id: marker.id,
                      position: marker.position,
                      title: marker.title,
                      status: '검색결과',
                      color: '#f59e0b'
                    });
                    setMapCenter(marker.position);
                  }}
                />
              ))}

              {/* 검색/선택된 곳의 스마트 핀 */}
              {selectedPlace && (
                <CustomOverlayMap position={selectedPlace.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div 
                      className={styles.markerBaloon} 
                      onClick={() => navigate(selectedPlace.status === '검색결과' ? `/publicweb/${selectedPlace.id}` : `/storeweb/${selectedPlace.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{width: 8, height: 8, background: selectedPlace.color, borderRadius: '50%'}} /> 
                      <span style={{color: selectedPlace.color}}>{selectedPlace.status}</span>
                      <span style={{ color: 'var(--color-primary)', marginLeft: '0.25rem', fontWeight: 800 }}>&rsaquo;</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} />
                  </div>
                </CustomOverlayMap>
              )}

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

          {/* 데스크탑 맵 하단 네비게이션 & 푸터 (지도 바깥의 하얀 여백 영역) */}
          <div className={styles.webBottomNav}>
            <div className={styles.navTabs}>
              <button className={`${styles.webNavBtn} ${styles.active}`} onClick={() => navigate('/mapweb')}>
                <MapPin size={22} />
                <span>주변</span>
              </button>
              <button className={styles.webNavBtn} onClick={() => navigate('/listweb')}>
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

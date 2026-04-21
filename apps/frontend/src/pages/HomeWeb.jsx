import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon 
} from 'lucide-react';
import { CATEGORIES, STATUS_TYPES, normalizeStoreStatus } from '../constants/status';
import PlaceCard from '../components/common/PlaceCard';
import { clearAuthSession, getCurrentUser, isLoggedIn as getIsLoggedIn } from '../lib/session';
import { useStoreLookupByExternalPlaceId } from '../hooks/useStoreLookupByExternalPlaceId';
import { useKakaoPlacesWithLookup } from '../hooks/useKakaoPlacesWithLookup';
import { createMergedPreviewPlace } from '../lib/mappers';
import styles from './HomeWeb.module.css';

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

function hasStoredSearchCenter() {
  return Boolean(readStoredSearchCenter());
}

export default function HomeWeb() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  
  // Map control states
  const [mapCenter, setMapCenter] = useState(() => readStoredSearchCenter() || DEFAULT_CENTER);
  const [searchCenter, setSearchCenter] = useState(() => readStoredSearchCenter() || DEFAULT_CENTER); // 별도 관리 되는 탐색 기준 위치
  const [isMapDragged, setIsMapDragged] = useState(false); // 현 지도에서 검색 노출용
  const [keyword, setKeyword] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const selectedExternalPlaceId = selectedPlace?.originalData?.id;
  const { storeMatch: selectedPlaceStoreMatch, isLoading: isSelectedPlaceLookupLoading } =
    useStoreLookupByExternalPlaceId(selectedExternalPlaceId);

  // Search Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(getIsLoggedIn());
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  // 마운트 시 내 위치 자동 동기화
  useEffect(() => {
    if (!hasStoredSearchCenter()) {
      handleMyLocation({ syncSearchCenter: true, persist: true });
    }
  }, []);

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
        
        const center = myLocation || searchCenter || mapCenter;
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
    setCommittedQuery(placeData.place_name);
    setSelectedPlace({
      position: pos,
      title: placeData.place_name,
      status: '검색위치',
      color: '#3b82f6',
      originalData: placeData
    });
    setKeyword(placeData.place_name);
    setIsDropdownOpen(false);
  };

  // 카카오 장소 검색 API 호출 (엔터)
  const handleSearch = (e) => {
    if (e.key === 'Enter' && keyword.trim()) {
      const baseCenter = myLocation || searchCenter;
      if (baseCenter) {
        setMapCenter(baseCenter);
        setSearchCenter(baseCenter);
        persistSearchCenter(baseCenter);
      }
      setCommittedQuery(keyword.trim());
      setSelectedPlace(null);
      setSearchMarkers([]);
      setIsDropdownOpen(false);
    }
  };

  // HTML5 현위치 기능
  const handleMyLocation = ({ syncSearchCenter = false, persist = false } = {}) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(loc);
          if (syncSearchCenter) {
            setSearchCenter(loc);
          }
          if (persist) {
            persistSearchCenter(loc);
          }
          setIsMapDragged(false);
          setMyLocation(loc);
        },
        () => {
          alert('현위치를 가져올 수 없습니다. 권한을 확인해주세요.');
        }
      );
    } else {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  };

  // Preview data for list
  const { places: nearbyPlaces } = useKakaoPlacesWithLookup(searchCenter, committedQuery, activeCategory, { radius: 2000, size: 8 });

  let rawPreviewItems = nearbyPlaces;

  // 선택된 카카오 검색 장소가 있다면 최상단에 주입
  if (selectedPlace && selectedPlace.originalData) {
    const kakaoData = selectedPlace.originalData;
    const mappedPlace = createMergedPreviewPlace(
      kakaoData,
      selectedPlaceStoreMatch,
      null, // matchedPublic
      isSelectedPlaceLookupLoading
    );
    rawPreviewItems = [mappedPlace, ...rawPreviewItems.filter(item => item.id !== mappedPlace.id)];
  }

  const filteredPreviewItems = rawPreviewItems.filter((item) => {
    if (!onlyOpen) {
      return true;
    }

    return item.objType === 'STORE' && normalizeStoreStatus(item.status) === STATUS_TYPES.STORE.OPEN;
  });

  const previewItems = filteredPreviewItems.slice(0, 8); // 데스크톱에서는 조금 더 많이 표시

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
              onChange={(e) => {
                const nextValue = e.target.value;
                setKeyword(nextValue);
                if (!nextValue.trim()) {
                  setCommittedQuery('');
                  setSelectedPlace(null);
                  setSearchMarkers([]);
                }
              }}
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
          <button className={styles.iconBtn} onClick={() => navigate(isLoggedIn ? '/favoritesweb' : '/loginweb')}>
            <Heart size={20} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate(isLoggedIn ? '/my-mapweb' : '/loginweb')}
            title={currentUser.email || '마이페이지'}
          >
            <User size={20} />
          </button>
        </nav>
      </header>

      {/* 메인 2단 레이아웃 (좌 사이드바, 우 지도) */}
      <div className={styles.webBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.filterScroll}>
              {['전체', ...CATEGORIES.STORE, ...CATEGORIES.PUBLIC].map(cat => (
                <button 
                  key={cat}
                  className={`${styles.filterChip} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              <div className={styles.listTitleGroup}>
                <h3>{committedQuery ? `"${committedQuery}" 검색 결과` : '주변 추천 장소'}</h3>
                <button
                  type="button"
                  className={`${styles.openFilterBtn} ${onlyOpen ? styles.active : ''}`}
                  onClick={() => setOnlyOpen((current) => !current)}
                >
                  영업중만
                </button>
              </div>
              <span className={styles.listCount}>{previewItems.length}개</span>
            </div>
            <div className={styles.cardsWrapper}>
              {previewItems.map(item => (
                <PlaceCard 
                  key={item.id} 
                  place={item} 
                  type={item.objType === 'PUBLIC' ? 'CONGESTION' : 'STORE'} 
                  isWeb={true}
                  onClick={() => {
                    const detailPath = item.objType === 'PUBLIC' ? `/publicweb/${item.id}` : `/storeweb/${item.id}`;
                    navigate(detailPath, { state: { placePreview: item } });
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* 우측 메인 컨텐츠 영역 (지도 + 하단 네비게이션) */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea} style={{ position: 'relative' }}>
            {isMapDragged && (
              <div className={styles.mapSearchButtonWrap}>
                <button
                  type="button"
                  className={styles.mapSearchButton}
                  onClick={() => {
                    setSearchCenter(mapCenter);
                    persistSearchCenter(mapCenter);
                    setIsMapDragged(false);
                  }}
                >
                  <Search size={16} />
                  현 지도에서 검색
                </button>
              </div>
            )}

            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
              onDragEnd={(map) => {
                const latlng = map.getCenter();
                setMapCenter({
                  lat: latlng.getLat(),
                  lng: latlng.getLng(),
                });
                setIsMapDragged(true);
              }}
            >
              {/* 리스트 매칭 마커 */}
              {previewItems.map((item) => {
                if (!item.lat || !item.lng) return null;
                
                const isToggleRegistered = item.status !== 'UNREGISTERED';
                
                if (isToggleRegistered) {
                  return (
                    <CustomOverlayMap 
                      key={`preview-${item.id}`} 
                      position={{ lat: item.lat, lng: item.lng }} 
                      yAnchor={1} 
                      zIndex={10}
                    >
                      <div 
                        onClick={() => {
                          setSelectedPlace({
                            id: item.id,
                            position: { lat: item.lat, lng: item.lng },
                            title: item.name,
                            status: item.status === 'OPEN' || item.status === '영업중' ? '영업중' : item.status,
                            color: item.objType === 'PUBLIC' ? '#3b82f6' : '#10b981',
                            originalData: item.originalData
                          });
                          setMapCenter({ lat: item.lat, lng: item.lng });
                        }}
                        style={{
                          cursor: 'pointer',
                          background: item.objType === 'PUBLIC' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          color: 'white',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          border: '2px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transform: 'translateY(12px)',
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                        {item.name.substring(0, 5)}{item.name.length > 5 ? '..' : ''}
                      </div>
                    </CustomOverlayMap>
                  );
                }
                return (
                  <MapMarker 
                    key={`preview-${item.id}`} 
                    position={{ lat: item.lat, lng: item.lng }} 
                    title={item.name} 
                    onClick={() => {
                      setSelectedPlace({
                        id: item.id,
                        position: { lat: item.lat, lng: item.lng },
                        title: item.name,
                        status: item.status === 'OPEN' || item.status === '영업중' ? '영업중' : item.status,
                        color: '#10b981',
                        originalData: item.originalData
                      });
                      setMapCenter({ lat: item.lat, lng: item.lng });
                    }}
                  />
                );
              })}
              
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

              {/* 내 위치 마커 */}
              {myLocation && (
                <CustomOverlayMap position={myLocation} zIndex={50}>
                  <div className={styles.myLocationMarker}>
                    <div className={styles.myLocationCore} />
                    <div className={styles.myLocationPulse} />
                  </div>
                </CustomOverlayMap>
              )}

              {/* 스마트 핀 */}
              {selectedPlace && (
                <CustomOverlayMap position={selectedPlace.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div 
                      className={styles.markerBaloon} 
                      onClick={() => navigate(
                        selectedPlace.status === '검색결과' ? `/publicweb/${selectedPlace.id}` : `/storeweb/${selectedPlace.id}`, 
                        { state: { placePreview: selectedPlace.originalData || selectedPlace } }
                      )}
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
            </Map>

            <button className={styles.myLocationBtn} onClick={() => handleMyLocation()}>
              <Crosshair size={24} />
            </button>
          </main>

          {/* 데스크탑 맵 하단 네비게이션 & 푸터 (지도 바깥의 하얀 여백 영역) */}
          <div className={styles.webBottomNav}>
            <div className={styles.navTabs}>
              <button className={`${styles.webNavBtn} ${styles.active}`}>
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

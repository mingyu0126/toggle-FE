import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Crosshair, Store as StoreIcon, Heart, User, MapPin, List as ListIcon 
} from 'lucide-react';
import { mockStores } from '../mocks/stores.mock';
import { mockPublicInstitutions } from '../mocks/public.mock';
import { CATEGORIES } from '../constants/status';
import PlaceCard from '../components/common/PlaceCard';
import styles from './HomeWeb.module.css';

export default function HomeWeb() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  
  // Map control states
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [keyword, setKeyword] = useState('');
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  // Search Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Preview data for list
  const previewItems = [...mockStores.slice(0, 5), ...mockPublicInstitutions.slice(0, 3)];

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
          <button className={styles.navBtn} onClick={() => navigate('/login')}>점주 로그인</button>
          <button className={styles.iconBtn}><Heart size={20} /></button>
          <button className={styles.iconBtn}><User size={20} /></button>
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
              <h3>주변 추천 장소</h3>
              <span className={styles.listCount}>{previewItems.length}개</span>
            </div>
            <div className={styles.cardsWrapper}>
              {previewItems.map(item => (
                <PlaceCard 
                  key={item.id} 
                  place={item} 
                  type={item.status === 'RELAXED' || item.status === 'NORMAL' || item.status === 'BUSY' || item.status === 'VERY_BUSY' ? 'CONGESTION' : 'STORE'} 
                  isWeb={true}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* 우측 메인 컨텐츠 영역 (지도 + 하단 네비게이션) */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
              onCreate={() => setIsMapLoaded(true)}
            >
              {/* 리스트 매칭 마커 */}
              {previewItems.map((item, idx) => {
                const tempLat = 37.5065 + (idx * 0.002) - 0.001; 
                const tempLng = 127.0536 + (idx * 0.002) - 0.001;
                return (
                  <MapMarker 
                    key={`preview-${item.id}`} 
                    position={{ lat: tempLat, lng: tempLng }} 
                    title={item.name} 
                    onClick={() => {
                      setSelectedPlace({
                        id: item.id,
                        position: { lat: tempLat, lng: tempLng },
                        title: item.name,
                        status: '영업중',
                        color: '#10b981'
                      });
                      setMapCenter({ lat: tempLat, lng: tempLng });
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
            </Map>

            <button className={styles.myLocationBtn} onClick={handleMyLocation}>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Search, Menu, Crosshair, ListFilter, 
  Store as StoreIcon, Heart, User, MapPin, List as ListIcon 
} from 'lucide-react';
import { mockStores } from '../mocks/stores.mock';
import { mockPublicInstitutions } from '../mocks/public.mock';
import { CATEGORIES } from '../constants/status';
import PlaceCard from '../components/common/PlaceCard';
import styles from './MainMap.module.css';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('전체');
  
  // Map control states
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [keyword, setKeyword] = useState('');
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null); // 사용자가 선택한/검색한 장소
  const [myLocation, setMyLocation] = useState(null); // 내 위치 좌표
  
  // Search Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Sheet drag state
  const [sheetHeight, setSheetHeight] = useState(35); // in vh or percent
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [startHeight, setStartHeight] = useState(null);

  const handleDragStart = (e) => {
    // ... 기존 드래그 핸들 (생략하지 않고 복구)
    const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    setDragStartY(y);
    setStartHeight(sheetHeight);
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging || dragStartY === null) return;
    const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    const deltaY = y - dragStartY;
    
    const deltaVh = (deltaY / window.innerHeight) * 100;
    let newHeight = startHeight - deltaVh;
    
    if (newHeight > 85) newHeight = 85;
    if (newHeight < 20) newHeight = 20;
    
    setSheetHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStartY(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove]);

  // 마운트 시 내 위치 자동 동기화 (조건부)
  useEffect(() => {
    if (location.state?.autoGps) {
      handleMyLocation();
    }
  }, [location.state]);

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
        
        // 내 위치가 있으면 내 위치, 없으면 지도 중심
        const center = myLocation || mapCenter;
        const searchOptions = {
          size: 5,
          location: new window.kakao.maps.LatLng(center.lat, center.lng),
          sort: window.kakao.maps.services.SortBy.DISTANCE 
        };

        ps.keywordSearch(keyword, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setSuggestions(data); // size: 5 옵션으로 5개만 옴
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
  }, [keyword]); // myLocation, mapCenter는 의도적으로 제외 (지도 이동 시 매번 재검색 방지)

  // 장소 선택 헨들러 (엔터 및 연관검색어 클릭 공유)
  const handleSelectPlace = (placeData) => {
    const lat = Number(placeData.y);
    const lng = Number(placeData.x);
    const pos = { lat, lng };
    setMapCenter(pos);
    setSelectedPlace({
      position: pos,
      title: placeData.place_name,
      status: '검색위치',
      color: '#3b82f6' // Blue for search 
    });
    setKeyword(placeData.place_name); // 검색창 이름 업데이트
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
          // 검색된 첫 번째 장소로 지도 이동
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
          setMyLocation(loc); // 내 위치 마커 표시용
        },
        (error) => {
          alert('현위치를 가져올 수 없습니다. 권한을 확인해주세요.');
        }
      );
    } else {
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
    }
  };

  // Preview data for bottom sheet (필터링 적용)
  const allPlaces = [
    ...mockStores.map(s => ({ ...s, objType: 'STORE' })),
    ...mockPublicInstitutions.map(p => ({ ...p, objType: 'CONGESTION' }))
  ];

  const previewItems = allPlaces
    .filter(place => activeCategory === '전체' || place.category === activeCategory)
    .slice(0, 5); // 5개 노출

  return (
    <div className={styles.mapContainer}>
      {/* 맵 배경 (카카오 지도 렌더링) */}
      <div className={styles.mapBackground}>
        <Map
          center={mapCenter} // 상태로 관리되는 중심 좌표
          style={{ width: '100%', height: '100%' }}
          level={4} // 확대 레벨
        >
          {/* 바텀시트에 표시될 추천 장소들 임시 마커 */}
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
          
          {/* 카카오 장소 검색을 통해 반환된 실제 검색 결과 마커 */}
          {searchMarkers.map((marker) => (
            <MapMarker 
              key={`search-${marker.id}`}
              position={marker.position}
              title={marker.title}
              image={{
                src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 마커 이미지
                size: { width: 24, height: 35 } // 사이즈 
              }}
              onClick={() => {
                setSelectedPlace({
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

          {/* 동적 스마트 핀 (선택된/검색된 장소 위에 렌더링) */}
          {selectedPlace && (
            <CustomOverlayMap position={selectedPlace.position} yAnchor={1} zIndex={100}>
              <div className={styles.markerPlaceholder}>
                <div className={styles.markerBaloon}>
                  <div style={{width: 8, height: 8, background: selectedPlace.color, borderRadius: '50%'}} /> 
                  <span style={{color: selectedPlace.color}}>{selectedPlace.status}</span>
                </div>
                <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" className={styles.markerPin} />
              </div>
            </CustomOverlayMap>
          )}
        </Map>
      </div>

      <div className={styles.mapContent}>
        {/* 상단 UI (검색 & 카테고리 칩) */}
        <div className={styles.topUi}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <button className={styles.hamburgerBtn}>
                <Menu size={20} />
              </button>
              <div className={styles.searchInputBox}>
                <Search size={18} color="rgba(255, 255, 255, 0.6)" />
                <input 
                  type="text" 
                  placeholder="장소, 버스, 지하철, 주소 검색" 
                  className={styles.searchInput} 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleSearch}
                  onFocus={() => { if(suggestions.length > 0) setIsDropdownOpen(true); }}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
              </div>
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

          <div className={styles.filterScroll}>
            {['전체', ...new Set([...CATEGORIES.STORE, ...CATEGORIES.PUBLIC])].map(cat => (
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

        {/* 우측 맵 컨트롤 */}
        <div className={styles.mapControls}>
          <button className={styles.controlBtn} onClick={handleMyLocation}>
            <Crosshair size={20} />
          </button>
        </div>

        {/* 하단 바텀 시트 (미리보기 목록) */}
        <div 
          className={styles.bottomSheet} 
          style={{ 
            height: `${sheetHeight}dvh`,
            transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div 
            className={styles.dragWrapper}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className={styles.dragHandle} />
          </div>
          
          <div className={styles.sheetHeader}>
            <h2 className={styles.sheetTitle}>주변 추천 장소</h2>
            <button 
              style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 600, fontSize: '0.85rem' }}
              onClick={() => navigate('/list')}
            >
              전체보기
            </button>
          </div>

          <div className={styles.sheetList}>
            {previewItems.map(item => (
              <PlaceCard 
                key={item.id} 
                place={item} 
                type={item.status === 'RELAXED' || item.status === 'NORMAL' || item.status === 'BUSY' || item.status === 'VERY_BUSY' ? 'CONGESTION' : 'STORE'} 
              />
            ))}
          </div>
        </div>

        {/* 하단 네비게이션 (고정) */}
        <div className={styles.bottomNavWrapper}>
          <nav className={styles.bottomNav} style={{ 
            display: 'flex', 
            background: 'rgba(15, 23, 42, 0.95)', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            padding: '0.75rem 1.5rem',
            justifyContent: 'space-between'
          }}>
            <button style={navBtnStyle(true)}>
              <MapPin size={24} />
              <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>주변</span>
            </button>
            <button style={navBtnStyle(false)} onClick={() => navigate('/list')}>
              <ListIcon size={24} />
              <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>리스트</span>
            </button>
            <button style={navBtnStyle(false)} onClick={() => navigate('/favorites')}>
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
    </div>
  );
}

const navBtnStyle = (isActive) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
  background: 'none',
  border: 'none',
  outline: 'none',
  fontWeight: isActive ? 700 : 500
});

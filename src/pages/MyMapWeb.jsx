import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { 
  Store as StoreIcon, Heart, User, MapPin, List as ListIcon, Share2, Search, Crosshair 
} from 'lucide-react';
import { mockUser } from '../mocks/users.mock';
import { mockStores } from '../mocks/stores.mock';
import { CATEGORIES, STATUS_TYPES } from '../constants/status';
import { mockPublicInstitutions } from '../mocks/public.mock';
import PlaceCard from '../components/common/PlaceCard';
import { Edit2, Camera } from 'lucide-react';
import styles from './MyMapWeb.module.css';



export default function MyMapWeb() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('STORE'); // 'STORE' | 'PUBLIC'
  
  // 편집 기능용 상태
  const [mapTitle, setMapTitle] = useState('토글러님의 지도');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  // 검색 모드 상태
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  const [isPublic, setIsPublic] = useState(mockUser.myMapSettings.isPublic);

  // Map control states
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  // 현재 사용자 나만의 지도 에 등록된 항목들
  const favStores = mockStores.filter(s => mockUser.favorites.stores.includes(s.id));
  const favPublics = mockPublicInstitutions.filter(p => mockUser.favorites.publics.includes(p.id));

  const currentStores = searchedUser ? mockStores.filter(s => searchedUser.favorites.stores.includes(s.id)) : favStores;
  const currentPublics = searchedUser ? mockPublicInstitutions.filter(p => searchedUser.favorites.publics.includes(p.id)) : favPublics;

  const mappedStores = currentStores.map((s, idx) => ({
    ...s,
    type: 'STORE',
    position: { lat: 37.5065 + (idx * 0.0012), lng: 127.0536 + (idx * 0.0012) },
    color: '#10b981'
  }));

  const mappedPublics = currentPublics.map((p, idx) => ({
    ...p,
    type: 'CONGESTION',
    position: { lat: 37.5050 - (idx * 0.0010), lng: 127.0520 + (idx * 0.0010) },
    color: '#3b82f6'
  }));

  const filteredStores = mappedStores.filter(store => {
    const passCategory = activeCategory === '전체' || store.category === activeCategory;
    const passOpen = onlyOpen ? store.status === STATUS_TYPES.STORE.OPEN : true;
    return passCategory && passOpen;
  });

  const filteredPublics = mappedPublics.filter(pub => {
    return activeCategory === '전체' || pub.category === activeCategory;
  });

  const allFilteredItems = activeTab === 'STORE' ? filteredStores : filteredPublics;

  const handleSearchUser = (e) => {
    e.preventDefault();
    if (!searchId) return;
    if (searchId === 'toggle_user_1' || searchId === 'test') {
      setSearchedUser({ nickname: '토글러', username: 'toggle_user_1', favorites: { stores: [1, 2], publics: [1] } });
    } else if (searchId === 'friend' || searchId === '친구') {
      setSearchedUser({ nickname: '코딩마스터', username: 'friend_map', favorites: { stores: [3, 4], publics: [1, 2] } });
    } else {
      alert('공개된 사용자가 아닙니다.');
      setSearchedUser(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
      {/* 1. Header */}
      <header className={styles.webHeader}>
        <div className={styles.logoGroup} onClick={() => navigate('/mapweb')}>
          <StoreIcon size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Toggle PC</span>
        </div>
        
        <div className={styles.searchContainer}>
          <form className={styles.headerSearch} onSubmit={handleSearchUser}>
            <Search size={18} color="rgba(255,255,255,0.5)" />
            <input 
               type="text" 
               placeholder="친구 아이디 검색 (ex. toggle_user_1)" 
               value={searchId}
               onChange={(e) => setSearchId(e.target.value)}
              className={styles.searchInputNav}
            />
            <button type="submit" className={styles.searchNavBtn}>검색</button>
          </form>
        </div>

        <nav className={styles.navLinks}>
          <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>점주 로그인</button>
          <button className={styles.iconBtn} onClick={() => navigate('/favoritesweb')}><Heart size={20} /></button>
          <button className={`${styles.iconBtn} ${styles.active}`}><User size={20} /></button>
        </nav>
      </header>

      {/* 2. Body */}
      <div className={styles.webBody}>
        {/* Left Sidebar Dashboard */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div 
                   className={styles.avatar} 
                   onClick={() => !searchedUser && fileInputRef.current?.click()}
                   style={{ cursor: !searchedUser ? 'pointer' : 'default', backgroundImage: profileImage ? `url(${profileImage})` : 'none', backgroundSize: 'cover' }}
                >
                  {!profileImage && <User size={28} color="white" />}
                  {!searchedUser && <div className={styles.cameraIcon}><Camera size={14} /></div>}
                </div>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   style={{ display: 'none' }} 
                   accept="image/*" 
                   onChange={handleImageChange} 
                />
                
                <div className={styles.userInfo}>
                  {isEditingTitle && !searchedUser ? (
                     <div className={styles.editTitleRow}>
                        <input 
                           type="text" 
                           value={mapTitle} 
                           onChange={(e) => setMapTitle(e.target.value)} 
                           className={styles.titleInput}
                        />
                        <button onClick={() => setIsEditingTitle(false)} className={styles.saveBtn}>저장</button>
                     </div>
                  ) : (
                     <div className={styles.titleRow}>
                        <h2>{searchedUser ? `${searchedUser.nickname}님의 지도` : mapTitle}</h2>
                        {!searchedUser && <Edit2 size={14} className={styles.editIcon} onClick={() => setIsEditingTitle(true)} />}
                     </div>
                  )}
                  <p>@{searchedUser ? searchedUser.username : mockUser.username}</p>
                </div>
                {searchedUser && (
                   <button className={styles.backToMyBtn} onClick={() => setSearchedUser(null)}>
                      내 지도로
                   </button>
                )}
              </div>
              
              {!searchedUser && (
                <div className={styles.toggleSwitch}>
                  <span>지도 공개 설정 (공유 허용)</span>
                  <div 
                    className={`${styles.switch} ${isPublic ? styles.on : ''}`}
                    onClick={() => setIsPublic(!isPublic)}
                  >
                    <div className={styles.switchThumb} />
                  </div>
                </div>
              )}
            </div>

            {!searchedUser && isPublic && (
              <button className={styles.shareBtn}>
                <Share2 size={16} /> 지도 링크 공유하기
              </button>
            )}
            
            <div className={styles.statsRow}>
               <div className={styles.statBox}>
                  <strong>{currentStores.length + currentPublics.length}</strong>
                  <span>총 저장 장소</span>
               </div>
               <div className={styles.statBox}>
                  <strong>12</strong>
                  <span>조회수</span>
               </div>
            </div>
          </div>

          <div className={styles.mainTabs}>
            <button className={`${styles.mainTab} ${activeTab === 'STORE' ? styles.active : ''}`} onClick={() => setActiveTab('STORE')}>매장 ({currentStores.length})</button>
            <button className={`${styles.mainTab} ${activeTab === 'PUBLIC' ? styles.active : ''}`} onClick={() => setActiveTab('PUBLIC')}>공공기관 ({currentPublics.length})</button>
          </div>

          <div className={styles.filterBar}>
            {['전체', ...(activeTab === 'STORE' ? CATEGORIES.STORE : CATEGORIES.PUBLIC)].map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.listContainer}>
            {allFilteredItems.length > 0 ? (
              <div className={styles.cardsWrapper}>
                {allFilteredItems.map(item => (
                  <div 
                     key={`${item.type}-${item.id}`} 
                     className={styles.cardItem}
                     onClick={() => {
                        setMapCenter(item.position);
                        setSelectedPlace(item);
                     }}
                     style={{ position: 'relative' }}
                  >
                    <PlaceCard place={item} type={item.type} isWeb={true} />
                    {!searchedUser && <button className={styles.deleteBtn}>삭제</button>}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                등록된 장소가 없습니다.
              </div>
            )}
          </div>
        </aside>

        {/* Right Map */}
        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
              onCreate={() => setIsMapLoaded(true)}
            >
              {allFilteredItems.map((item) => (
                <CustomOverlayMap key={`marker-${item.type}-${item.id}`} position={item.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div className={styles.markerBaloon} onClick={() => navigate(item.type === 'CONGESTION' ? `/publicweb/${item.id}` : `/storeweb/${item.id}`)}>
                      <div style={{width: 8, height: 8, background: item.color, borderRadius: '50%'}} /> 
                      <span style={{color: item.color}}>{item.name || item.title}</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" style={{ color: item.color }} className={styles.markerPin} />
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

          {/* Desktop Footer Nav */}
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
              <button className={styles.webNavBtn} onClick={() => navigate('/favoritesweb')}>
                <Heart size={22} />
                <span>저장</span>
              </button>
              <button className={`${styles.webNavBtn} ${styles.active}`} onClick={() => navigate('/my-mapweb')}>
                <User size={22} />
                <span>마이</span>
              </button>
            </div>
            <div className={styles.webFooter}>
              <span>&copy; 2026 Toggle PC. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

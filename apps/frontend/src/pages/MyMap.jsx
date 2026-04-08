import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, User, Heart, MapPin, List as ListIcon, Settings, Search, Edit2, Camera } from 'lucide-react';
import { mockUser } from '../mocks/users.mock';
import { mockStores } from '../mocks/stores.mock';
import { CATEGORIES, STATUS_TYPES } from '../constants/status';
import { mockPublicInstitutions } from '../mocks/public.mock';
import PlaceCard from '../components/common/PlaceCard';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import LoginModal from '../components/common/LoginModal'; // 로그인 유도 모달 추가
import { clearAuthSession, getCurrentUser, isLoggedIn as getIsLoggedIn, updateCurrentUser } from '../lib/session';
import styles from './MyMap.module.css';

export default function MyMap() {
  const navigate = useNavigate();
  const initialUser = getCurrentUser();
  const initialDisplayName = initialUser.nickname || initialUser.email?.split('@')[0] || mockUser.nickname;
  const [isPublic, setIsPublic] = useState(initialUser.isPublicMap ?? false);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [activeTab, setActiveTab ] = useState('STORE'); // 'STORE' | 'PUBLIC' | 'SEARCH'
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'MAP'
  
  // 로그인 상태 시뮬레이션 및 모달 상태
  const [isLoggedIn, setIsLoggedIn] = useState(getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(initialUser);

  // 편집 기능용 상태
  const [mapTitle, setMapTitle] = useState(currentUser.mapTitle || `${initialDisplayName}님의 지도`);
  const [mapDesc, setMapDesc] = useState(currentUser.mapDesc || '우리 동네 찐맛집과 핫플레이스를 모아둔 지도입니다. 📍');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [profileImage, setProfileImage] = useState(currentUser.profileImage || null);
  const fileInputRef = useRef(null);

  const updateCurrentUserFields = (fields) => {
    const updated = updateCurrentUser(fields);
    setCurrentUser(updated);
  };

  const handleRemoveProfileImage = (e) => {
    e.stopPropagation(); // 아바타 클릭 트리거(업로드창) 방지
    setProfileImage(null);
    updateCurrentUserFields({ profileImage: null });
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // 검색 모드 상태
  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  // 현재 사용자 나만의 지도 에 등록된 항목들 (로컬스토리지 동기화)
  const [myMapPlaces, setMyMapPlaces] = useState(currentUser.myMap || { stores: [], publics: [] });

  useEffect(() => {
    const syncAuthState = () => {
      const latestUser = getCurrentUser();
      const latestDisplayName = latestUser.nickname || latestUser.email?.split('@')[0] || '내 사용자';
      setCurrentUser(latestUser);
      setIsLoggedIn(getIsLoggedIn());
      setIsPublic(latestUser.isPublicMap ?? false);
      setMyMapPlaces(latestUser.myMap || { stores: [], publics: [] });
      setMapTitle(latestUser.mapTitle || `${latestDisplayName}님의 지도`);
      setMapDesc(latestUser.mapDesc || '우리 동네 찐맛집과 핫플레이스를 모아둔 지도입니다. 📍');
      setProfileImage(latestUser.profileImage || null);
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  const favStores = mockStores.filter(s => myMapPlaces.stores && myMapPlaces.stores.includes(s.id));
  const favPublics = mockPublicInstitutions.filter(p => myMapPlaces.publics && myMapPlaces.publics.includes(p.id));

  const currentStores = searchedUser ? mockStores.filter(s => searchedUser.favorites.stores && searchedUser.favorites.stores.includes(s.id)) : favStores;
  const currentPublics = searchedUser ? mockPublicInstitutions.filter(p => searchedUser.favorites.publics && searchedUser.favorites.publics.includes(p.id)) : favPublics;

  const filteredStores = currentStores.filter(store => {
    const passCategory = activeCategory === '전체' || store.category === activeCategory;
    const passOpen = onlyOpen ? store.status === STATUS_TYPES.STORE.OPEN : true;
    return passCategory && passOpen;
  });

  const filteredPublics = currentPublics.filter(pub => {
     return activeCategory === '전체' || pub.category === activeCategory;
  });

  // 지도 오버레이 핀용 가상 좌표 매핑 (FavoritesWeb 스타일과 동일하게)
  const mappedStores = filteredStores.map((s, idx) => ({
    ...s,
    position: { lat: 37.5065 + (idx * 0.0012), lng: 127.0536 + (idx * 0.0012) },
    color: '#10b981'
  }));

  const mappedPublics = filteredPublics.map((p, idx) => ({
    ...p,
    position: { lat: 37.5050 - (idx * 0.0010), lng: 127.0520 + (idx * 0.0010) },
    color: '#3b82f6'
  }));

  const mapItems = activeTab === 'STORE' ? mappedStores : mappedPublics;

  const handleSearchUser = (e) => {
    e.preventDefault();
    if (!searchId) return;
    if (searchId === 'toggle_user_1' || searchId === 'test') {
      setSearchedUser({ 
        nickname: '토글러', 
        username: 'toggle_user_1', 
        avatarUrl: 'https://i.pravatar.cc/150?img=11', // 친구 사진 시뮬레이션
        favorites: { stores: ['store-1', 'store-2'], publics: ['public-1'] } 
      });
    } else if (searchId === 'friend' || searchId === '친구') {
      setSearchedUser({ 
        nickname: '코딩마스터', 
        username: 'friend_map', 
        avatarUrl: 'https://i.pravatar.cc/150?img=12', // 친구 사진 시뮬레이션
        favorites: { stores: ['store-3', 'store-4'], publics: ['public-1', 'public-2'] } 
      });
    } else {
      alert('공개되지 않은 사용자이거나 존재하지 않는 사용자입니다.');
      setSearchedUser(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        updateCurrentUserFields({ profileImage: reader.result }); // 로컬 저장
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToMyMap = (itemId, type) => {
    if (!isLoggedIn) {
      setModalMessage('나만의 지도에 장소를 저장하려면 로그인이 필요합니다.');
      setShowLoginModal(true);
      return;
    }
    const key = type === 'STORE' ? 'stores' : 'publics';
    
    // 중복 체크
    if (myMapPlaces[key] && myMapPlaces[key].includes(itemId)) {
      alert('이미 저장된 장소입니다.');
      return;
    }

    const updatedMyMap = { ...myMapPlaces };
    if (!updatedMyMap[key]) updatedMyMap[key] = [];
    updatedMyMap[key].push(itemId);

    setMyMapPlaces(updatedMyMap);
    updateCurrentUserFields({ myMap: updatedMyMap });
    alert(`${type === 'STORE' ? '매장' : '공공기관'}이 내 지도에 저장되었습니다!`);
  };

  const handleDeleteFromMyMap = (itemId, type) => {
    const key = type === 'STORE' ? 'stores' : 'publics';
    const updatedMyMap = { ...myMapPlaces };
    updatedMyMap[key] = updatedMyMap[key].filter(id => id !== itemId);

    setMyMapPlaces(updatedMyMap);
    updateCurrentUserFields({ myMap: updatedMyMap });
  };

  const handleTogglePublic = () => {
    if (!isLoggedIn) {
      setModalMessage('지도를 공개 상태로 전환하려면 로그인이 필요합니다.');
      setShowLoginModal(true);
      return;
    }
    const nextValue = !isPublic;
    setIsPublic(nextValue);
    updateCurrentUserFields({ isPublicMap: nextValue });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <span className={styles.title}>{searchedUser ? `${searchedUser.nickname}님의 지도` : '나만의 지도'}</span>
        </div>
        
        {searchedUser && (
           <button className={styles.shareBtn} onClick={() => setSearchedUser(null)}>
              내 지도로
           </button>
        )}
        <div className={styles.headerRight}>
          {!searchedUser && isPublic && (
            <button className={styles.shareBtn}>
              <Share2 size={16} /> 공유
            </button>
          )}
          {!searchedUser && isLoggedIn && (
            <button className={styles.shareBtn} onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
               로그아웃
            </button>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {/* ID로 다른 사용자 검색 */}
        <form className={styles.searchForm} onSubmit={handleSearchUser}>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <input 
            type="text" 
            placeholder="친구 아이디 검색 (ex. toggle_user_1)" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit">검색</button>
        </form>

        <div className={styles.profileCard}>
          <div className={styles.profileTop}>
            <div className={styles.avatarWrapper}>
              <div 
                 className={styles.avatar} 
                 onClick={() => !searchedUser && fileInputRef.current?.click()}
                 style={{ 
                   cursor: !searchedUser ? 'pointer' : 'default', 
                   backgroundImage: searchedUser 
                     ? (searchedUser.avatarUrl ? `url(${searchedUser.avatarUrl})` : 'none') 
                     : (profileImage ? `url(${profileImage})` : 'none'), 
                   backgroundSize: 'cover' 
                 }}
              >
                {!(searchedUser ? searchedUser.avatarUrl : profileImage) && <User size={24} color="white" />}
                {!searchedUser && <div className={styles.cameraIcon}><Camera size={12} /></div>}
              </div>
              {!searchedUser && profileImage && (
                 <button className={styles.deleteProfileBtn} onClick={handleRemoveProfileImage}>
                    <Camera size={10} style={{ display: 'none' }} /> ✖
                 </button>
              )}
            </div>
            <input 
               type="file" 
               ref={fileInputRef} 
               style={{ display: 'none' }} 
               accept="image/*" 
               onChange={handleImageChange} 
            />
            
            <div className={styles.userInfo}>
              {!isLoggedIn && !searchedUser ? (
                 <div className={styles.titleRow}>
                    <h2>로그인이 필요합니다</h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>로그인하고 지도를 관리해 보세요.</p>
                 </div>
              ) : (
                 <>
              {isEditingTitle && !searchedUser ? (
                 <div className={styles.editTitleRow}>
                    <input 
                       type="text" 
                       value={mapTitle} 
                       onChange={(e) => setMapTitle(e.target.value)} 
                       className={styles.titleInput}
                    />
                    <button onClick={() => { setIsEditingTitle(false); updateCurrentUserFields({ mapTitle }); }} className={styles.saveBtn}>저장</button>
                 </div>
              ) : (
                 <div className={styles.titleRow}>
                    <h2>{searchedUser ? `${searchedUser.nickname}님의 지도` : mapTitle}</h2>
                    {!searchedUser && <Edit2 size={14} className={styles.editIcon} onClick={() => setIsEditingTitle(true)} />}
                 </div>
              )}
              
              {/* 지도 소개글 Description 필드 추가 */}
              {isEditingDesc && !searchedUser ? (
                 <div className={styles.editTitleRow} style={{ marginTop: '0.25rem' }}>
                    <input 
                       type="text" 
                       value={mapDesc} 
                       onChange={(e) => setMapDesc(e.target.value)} 
                       className={styles.descInput}
                    />
                    <button onClick={() => { setIsEditingDesc(false); updateCurrentUserFields({ mapDesc }); }} className={styles.saveBtn}>저장</button>
                 </div>
              ) : (
                 <div className={styles.titleRow} style={{ marginTop: '0.25rem' }}>
                    <p className={styles.mapDescText}>{searchedUser ? '이 지도의 소개글이 없습니다.' : mapDesc}</p>
                    {!searchedUser && <Edit2 size={12} className={styles.editIcon} onClick={() => setIsEditingDesc(true)} />}
                 </div>
              )}

              <p className={styles.userId}>ID: @{searchedUser ? searchedUser.username : (currentUser.email || currentUser.id || 'guest')}</p>
                 </>
              )}
            </div>
          </div>
          
          {!searchedUser && (
            <div className={styles.toggleSwitch}>
              <span>지도 공개 설정 (ID 검색 허용)</span>
              <div 
                className={`${styles.switch} ${isPublic ? styles.on : ''}`}
                onClick={handleTogglePublic}
              >
                <div className={styles.switchThumb} />
              </div>
            </div>
          )}
        </div>

        {isLoggedIn || searchedUser ? (
           <>
        {/* 대분류 탭 분기 */}
        <div className={styles.mainTabs}>
            <button className={`${styles.mainTab} ${activeTab === 'STORE' ? styles.active : ''}`} onClick={() => setActiveTab('STORE')}>매장 ({currentStores.length})</button>
            <button className={`${styles.mainTab} ${activeTab === 'PUBLIC' ? styles.active : ''}`} onClick={() => setActiveTab('PUBLIC')}>공공기관 ({currentPublics.length})</button>
        </div>

        {/* 카테고리 필터 */}
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
          {activeTab === 'STORE' && (
            <button 
              className={`${styles.filterBtn} ${onlyOpen ? styles.active : ''}`}
              onClick={() => setOnlyOpen(!onlyOpen)}
              style={onlyOpen ? { backgroundColor: 'var(--color-status-green)', borderColor: 'var(--color-status-green)' } : {}}
            >
              🔥 지금 영업중
            </button>
          )}
        </div>

        {/* 리스트 출력 vs 지도 출력 전환 */}
        {viewMode === 'LIST' ? (
          <div className={styles.placeGrid}>
            {activeTab === 'STORE' ? (
               filteredStores.length > 0 ? (
                  filteredStores.map(store => (
                     <div key={store.id} className={styles.placeCardWrapper}>
                        <PlaceCard place={store} type="STORE" showFavorite={false} />
                        {searchedUser ? (
                          <button className={styles.saveToMyMapBtn} onClick={() => handleSaveToMyMap(store.id, 'STORE')}>
                             <Heart size={14} fill="white" /> 저장
                          </button>
                        ) : <button className={styles.deleteBtn} onClick={() => handleDeleteFromMyMap(store.id, 'STORE')}>삭제</button>}
                     </div>
                  ))
               ) : <div className={styles.emptyState}>조건에 맞는 매장이 없습니다.</div>
            ) : (
               filteredPublics.length > 0 ? (
                  filteredPublics.map(pub => (
                     <div key={pub.id} className={styles.placeCardWrapper}>
                        <PlaceCard place={pub} type="CONGESTION" showFavorite={false} />
                        {searchedUser ? (
                          <button className={styles.saveToMyMapBtn} onClick={() => handleSaveToMyMap(pub.id, 'PUBLIC')}>
                             <Heart size={14} fill="white" /> 저장
                          </button>
                        ) : <button className={styles.deleteBtn} onClick={() => handleDeleteFromMyMap(pub.id, 'PUBLIC')}>삭제</button>}
                     </div>
                  ))
               ) : <div className={styles.emptyState}>조건에 맞는 공공기관이 없습니다.</div>
            )}
          </div>
        ) : (
          <div className={styles.mapContainer}>
            <Map
              center={{ lat: 37.5060, lng: 127.0530 }}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={5}
            >
              {mapItems.map((item) => (
                <CustomOverlayMap key={`overlay-${item.id}`} position={item.position} yAnchor={1}>
                  <div className={styles.markerBaloon} onClick={() => navigate(activeTab === 'PUBLIC' ? `/public/${item.id}` : `/store/${item.id}`)}>
                     <div style={{width: 6, height: 6, background: item.color, borderRadius: '50%'}} />
                     <span>{item.name || item.title}</span>
                  </div>
                </CustomOverlayMap>
              ))}
            </Map>
          </div>
        )}

        {/* 뷰 전환 Floating Button */}
        <button 
          className={styles.viewToggleBtn} 
          onClick={() => setViewMode(viewMode === 'LIST' ? 'MAP' : 'LIST')}
        >
          {viewMode === 'LIST' ? '🗺️ 지도 보기' : '📋 리스트 보기'}
        </button>
          </>
        ) : (
          <div className={styles.emptyState} style={{ marginTop: '3rem' }}>
             <Heart size={40} opacity={0.3} />
             <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>로그인 후 지도 상세 목록을 확인할 수 있습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 네비게이션 (고정) */}
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
          <button style={navBtnStyle(false)} onClick={() => navigate('/favorites')}>
            <Heart size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>저장</span>
          </button>
          <button style={navBtnStyle(true)}>
            <User size={24} />
            <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>마이</span>
          </button>
        </nav>
      </div>

      {/* 로그인 유도 모달 */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message={modalMessage}
      />
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
  cursor: 'pointer'
});

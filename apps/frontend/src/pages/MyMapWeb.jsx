import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import {
  Store as StoreIcon, Heart, User, MapPin, List as ListIcon, Share2, Search, Crosshair, Edit2, Camera,
} from 'lucide-react';
import { CATEGORIES, STATUS_TYPES } from '../constants/status';
import PlaceCard from '../components/common/PlaceCard';
import { clearAuthSession, getCurrentUser, isLoggedIn as getIsLoggedIn, updateCurrentUser } from '../lib/session';
import { lookupStoresByExternalPlaceIds } from '../lib/stores';
import { lookupPublicInstitutions } from '../lib/publicInstitutions';
import { mapFavoriteStoreItemToPlace } from '../lib/storeMappers';
import styles from './MyMapWeb.module.css';

export default function MyMapWeb() {
  const navigate = useNavigate();
  const initialUser = getCurrentUser();
  const initialDisplayName = initialUser.nickname || initialUser.email?.split('@')[0] || '사용자';

  const [activeCategory, setActiveCategory] = useState('전체');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('STORE');
  const [isLoggedIn, setIsLoggedIn] = useState(getIsLoggedIn());
  const [currentUser, setCurrentUser] = useState(initialUser);

  const [mapTitle, setMapTitle] = useState(initialUser.mapTitle || `${initialDisplayName}님의 지도`);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [profileImage, setProfileImage] = useState(initialUser.profileImage || null);
  const [isPublic, setIsPublic] = useState(initialUser.isPublicMap ?? false);
  const [myMapPlaces, setMyMapPlaces] = useState(initialUser.myMap || { stores: [], publics: [] });
  const [stores, setStores] = useState([]);
  const [publicInstitutions, setPublicInstitutions] = useState([]);
  const fileInputRef = useRef(null);

  const [searchId, setSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);

  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  const updateCurrentUserFields = (fields) => {
    const updated = updateCurrentUser(fields);
    setCurrentUser(updated);
  };

  useEffect(() => {
    const syncAuthState = () => {
      const latestUser = getCurrentUser();
      const latestDisplayName = latestUser.nickname || latestUser.email?.split('@')[0] || '사용자';
      setCurrentUser(latestUser);
      setIsLoggedIn(getIsLoggedIn());
      setIsPublic(latestUser.isPublicMap ?? false);
      setMyMapPlaces(latestUser.myMap || { stores: [], publics: [] });
      setMapTitle(latestUser.mapTitle || `${latestDisplayName}님의 지도`);
      setProfileImage(latestUser.profileImage || null);
    };

    window.addEventListener('authChanged', syncAuthState);
    return () => window.removeEventListener('authChanged', syncAuthState);
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      const storeIds = searchedUser ? (searchedUser.favorites?.stores || []) : (myMapPlaces.stores || []);
      if (storeIds.length === 0) {
        setStores([]);
        return;
      }
      try {
        const fetched = await lookupStoresByExternalPlaceIds('KAKAO', storeIds);
        setStores(fetched.map(mapFavoriteStoreItemToPlace));
      } catch (err) {
        console.error('Failed to fetch stores:', err);
      }
    };
    fetchStores();
  }, [myMapPlaces.stores, searchedUser]);

  useEffect(() => {
    const fetchPublics = async () => {
      const publicIds = searchedUser ? (searchedUser.favorites?.publics || []) : (myMapPlaces.publics || []);
      if (publicIds.length === 0) {
        setPublicInstitutions([]);
        return;
      }
      try {
        const fetched = await lookupPublicInstitutions('KAKAO', publicIds);
        setPublicInstitutions(fetched.map(p => ({
          ...p,
          status: p.congestionLevel,
          objType: 'PUBLIC',
        })));
      } catch (err) {
        console.error('Failed to fetch public institutions:', err);
      }
    };
    fetchPublics();
  }, [myMapPlaces.publics, searchedUser]);

  const favStores = stores;
  const favPublics = publicInstitutions;

  const currentStores = favStores;
  const currentPublics = favPublics;

  const mappedStores = currentStores.map((store, idx) => ({
    ...store,
    type: 'STORE',
    position: { lat: 37.5065 + (idx * 0.0012), lng: 127.0536 + (idx * 0.0012) },
    color: '#10b981',
  }));

  const mappedPublics = currentPublics.map((place, idx) => ({
    ...place,
    type: 'CONGESTION',
    position: { lat: 37.5050 - (idx * 0.0010), lng: 127.0520 + (idx * 0.0010) },
    color: '#3b82f6',
  }));

  const filteredStores = mappedStores.filter((store) => {
    const passCategory = activeCategory === '전체' || store.category === activeCategory;
    const passOpen = onlyOpen ? store.status === STATUS_TYPES.STORE.OPEN : true;
    return passCategory && passOpen;
  });

  const filteredPublics = mappedPublics.filter((place) => activeCategory === '전체' || place.category === activeCategory);
  const allFilteredItems = activeTab === 'STORE' ? filteredStores : filteredPublics;

  const handleSearchUser = (e) => {
    e.preventDefault();
    if (!searchId) return;

    if (searchId === 'toggle_user_1' || searchId === 'test') {
      setSearchedUser({ nickname: '토글러', username: 'toggle_user_1', favorites: { stores: ['store-1', 'store-2'], publics: ['public-1'] } });
      return;
    }

    if (searchId === 'friend' || searchId === '친구') {
      setSearchedUser({ nickname: '코딩마스터', username: 'friend_map', favorites: { stores: ['store-3', 'store-4'], publics: ['public-1', 'public-2'] } });
      return;
    }

    alert('공개된 사용자가 아닙니다.');
    setSearchedUser(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      updateCurrentUserFields({ profileImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePublic = () => {
    const nextValue = !isPublic;
    setIsPublic(nextValue);
    updateCurrentUserFields({ isPublicMap: nextValue });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/loginweb');
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert('현위치를 가져올 수 없습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCenter(location);
        setMyLocation(location);
      },
      () => alert('현위치를 가져올 수 없습니다.'),
    );
  };

  return (
    <div className={styles.webContainer}>
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
          {isLoggedIn ? (
            <button className={styles.navBtn} onClick={handleLogout}>로그아웃</button>
          ) : (
            <button className={styles.navBtn} onClick={() => navigate('/loginweb')}>로그인</button>
          )}
          <button className={styles.iconBtn} onClick={() => navigate('/favoritesweb')}><Heart size={20} /></button>
          <button className={`${styles.iconBtn} ${styles.active}`} onClick={() => navigate('/my-mapweb')}><User size={20} /></button>
        </nav>
      </header>

      <div className={styles.webBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div
                  className={styles.avatar}
                  onClick={() => !searchedUser && fileInputRef.current?.click()}
                  style={{
                    cursor: !searchedUser ? 'pointer' : 'default',
                    backgroundImage: profileImage ? `url(${profileImage})` : 'none',
                    backgroundSize: 'cover',
                  }}
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
                      <button
                        onClick={() => {
                          setIsEditingTitle(false);
                          updateCurrentUserFields({ mapTitle });
                        }}
                        className={styles.saveBtn}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div className={styles.titleRow}>
                      <h2>{searchedUser ? `${searchedUser.nickname}님의 지도` : mapTitle}</h2>
                      {!searchedUser && <Edit2 size={14} className={styles.editIcon} onClick={() => setIsEditingTitle(true)} />}
                    </div>
                  )}

                  <p>@{searchedUser ? searchedUser.username : (currentUser.email || currentUser.id || 'guest')}</p>
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
                    onClick={handleTogglePublic}
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
                <strong>{searchedUser ? 0 : 12}</strong>
                <span>조회수</span>
              </div>
            </div>
          </div>

          <div className={styles.mainTabs}>
            <button className={`${styles.mainTab} ${activeTab === 'STORE' ? styles.active : ''}`} onClick={() => setActiveTab('STORE')}>매장 ({currentStores.length})</button>
            <button className={`${styles.mainTab} ${activeTab === 'PUBLIC' ? styles.active : ''}`} onClick={() => setActiveTab('PUBLIC')}>공공기관 ({currentPublics.length})</button>
          </div>

          <div className={styles.filterBar}>
            {['전체', ...(activeTab === 'STORE' ? CATEGORIES.STORE : CATEGORIES.PUBLIC)].map((category) => (
              <button
                key={category}
                className={`${styles.filterBtn} ${activeCategory === category ? styles.active : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className={styles.listContainer}>
            {allFilteredItems.length > 0 ? (
              <div className={styles.cardsWrapper}>
                {allFilteredItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={styles.cardItem}
                    onClick={() => {
                      setMapCenter(item.position);
                      setSelectedPlace(item);
                    }}
                    style={{ position: 'relative' }}
                  >
                    <PlaceCard place={item} type={item.type} isWeb />
                    {!searchedUser && <button className={styles.deleteBtn}>삭제</button>}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>등록된 장소가 없습니다.</div>
            )}
          </div>
        </aside>

        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map
              center={mapCenter}
              style={{ width: '100%', height: '100%', borderRadius: '16px' }}
              level={4}
            >
              {allFilteredItems.map((item) => (
                <CustomOverlayMap key={`marker-${item.type}-${item.id}`} position={item.position} yAnchor={1} zIndex={100}>
                  <div className={styles.markerPlaceholder}>
                    <div className={styles.markerBaloon} onClick={() => navigate(item.type === 'CONGESTION' ? `/publicweb/${item.id}` : `/storeweb/${item.id}`)}>
                      <div style={{ width: 8, height: 8, background: item.color, borderRadius: '50%' }} />
                      <span style={{ color: item.color }}>{item.name || item.title}</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" style={{ color: item.color }} className={styles.markerPin} />
                  </div>
                </CustomOverlayMap>
              ))}

              {selectedPlace && (
                <CustomOverlayMap position={selectedPlace.position} yAnchor={1} zIndex={120}>
                  <div className={styles.markerPlaceholder}>
                    <div className={styles.markerBaloon}>
                      <div style={{ width: 8, height: 8, background: selectedPlace.color, borderRadius: '50%' }} />
                      <span style={{ color: selectedPlace.color }}>{selectedPlace.name || selectedPlace.title}</span>
                    </div>
                    <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" style={{ color: selectedPlace.color }} className={styles.markerPin} />
                  </div>
                </CustomOverlayMap>
              )}

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

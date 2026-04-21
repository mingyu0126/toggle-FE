import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import {
  Store as StoreIcon, Heart, User, MapPin, List as ListIcon, Share2, Crosshair, Edit2,
} from 'lucide-react';
import PlaceCard from '../components/common/PlaceCard';
import { STATUS_TYPES } from '../constants/status';
import { clearAuthSession, getCurrentUser, updateCurrentUser } from '../lib/session';
import { fetchStoresByIds } from '../lib/stores';
import { fetchPublicInstitutionsByIds } from '../lib/publicInstitutions';
import { mapStoreToPlace, mapPublicToPlace } from '../lib/mappers';
import { buildSharedMapUrl, fetchMyMap, removeMyMapPublic, removeMyMapStore, updateMyMapProfile } from '../lib/myMap';
import styles from './MyMapWeb.module.css';

function getDefaultTitle(user) {
  return user.nickname || user.email?.split('@')[0] || '사용자';
}

export default function MyMapWeb() {
  const navigate = useNavigate();
  const initialUser = getCurrentUser();
  const [myMap, setMyMap] = useState(null);
  const [stores, setStores] = useState([]);
  const [publicInstitutions, setPublicInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('STORE');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5065, lng: 127.0536 });
  const [myLocation, setMyLocation] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [mapTitle, setMapTitle] = useState(`${getDefaultTitle(initialUser)}님의 지도`);
  const [mapDesc, setMapDesc] = useState('즐겨찾기에서 골라 저장한 장소만 따로 모아두는 컬렉션입니다.');

  const loadMyMap = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchMyMap();
      const [storeItems, publicItems] = await Promise.all([
        fetchStoresByIds(data.stores || []),
        fetchPublicInstitutionsByIds(data.publics || []),
      ]);

      const mappedStores = storeItems.map(mapStoreToPlace);
      const mappedPublics = publicItems.map(mapPublicToPlace);
      const profile = data.mapProfile || {};

      setMyMap(data);
      setStores(mappedStores);
      setPublicInstitutions(mappedPublics);
      setMapTitle(profile.title || `${getDefaultTitle(initialUser)}님의 지도`);
      setMapDesc(profile.description || '즐겨찾기에서 골라 저장한 장소만 따로 모아두는 컬렉션입니다.');

      const firstPlace = mappedStores[0] || mappedPublics[0];
      if (firstPlace?.lat && firstPlace?.lng) {
        setMapCenter({ lat: firstPlace.lat, lng: firstPlace.lng });
      }

      updateCurrentUser({
        publicMapId: profile.publicMapId,
        isPublicMap: profile.isPublic,
        mapTitle: profile.title || '',
        mapDesc: profile.description || '',
        profileImage: profile.profileImageUrl || null,
      });
    } catch (loadError) {
      setError(loadError.message || '내 지도를 불러오지 못했습니다.');
      setStores([]);
      setPublicInstitutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMyMap();
    // loadMyMap is intentionally run on mount and after explicit mutations only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sync = () => {
      loadMyMap();
    };
    window.addEventListener('authChanged', sync);
    return () => window.removeEventListener('authChanged', sync);
    // loadMyMap is intentionally stable for session refreshes in this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStores = stores.filter((store) => (
    onlyOpen ? store.status === STATUS_TYPES.STORE.OPEN : true
  ));
  const filteredPublics = publicInstitutions;
  const allFilteredItems = activeTab === 'STORE'
    ? filteredStores.map((store) => ({ ...store, type: 'STORE', color: '#10b981' }))
    : filteredPublics.map((place) => ({ ...place, type: 'CONGESTION', color: '#3b82f6' }));

  const handleProfileUpdate = async (payload) => {
    const profile = await updateMyMapProfile(payload);
    setMyMap((current) => ({
      ...(current || {}),
      mapProfile: profile,
    }));
    setMapTitle(profile.title || `${getDefaultTitle(getCurrentUser())}님의 지도`);
    setMapDesc(profile.description || '즐겨찾기에서 골라 저장한 장소만 따로 모아두는 컬렉션입니다.');
    updateCurrentUser({
      publicMapId: profile.publicMapId,
      isPublicMap: profile.isPublic,
      mapTitle: profile.title || '',
      mapDesc: profile.description || '',
      profileImage: profile.profileImageUrl || null,
    });
  };

  const handleRemovePlace = async (item) => {
    try {
      if (item.type === 'STORE') {
        await removeMyMapStore(item.internalStoreId);
      } else {
        await removeMyMapPublic(item.internalId);
      }
      await loadMyMap();
    } catch (removeError) {
      alert(removeError.message || '내 지도에서 삭제하지 못했습니다.');
    }
  };

  const handleShare = async () => {
    const publicMapId = myMap?.mapProfile?.publicMapId;
    if (!publicMapId) {
      alert('공유 가능한 지도 식별자가 없습니다.');
      return;
    }
    const url = buildSharedMapUrl(publicMapId, true);
    await navigator.clipboard.writeText(url);
    alert('지도 링크가 복사되었습니다.');
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

  const isPublic = Boolean(myMap?.mapProfile?.isPublic);

  return (
    <div className={styles.webContainer}>
      <header className={styles.webHeader}>
        <div className={styles.logoGroup} onClick={() => navigate('/mapweb')}>
          <StoreIcon size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>Toggle PC</span>
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.headerSearch} onClick={() => navigate('/sharedweb')}>
            <Share2 size={18} color="rgba(255,255,255,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '0.75rem', fontSize: '1rem' }}>
              공개 지도 탐색
            </span>
          </div>
        </div>

        <nav className={styles.navLinks}>
          <button className={styles.navBtn} onClick={handleLogout}>로그아웃</button>
          <button className={styles.iconBtn} onClick={() => navigate('/favoritesweb')}><Heart size={20} /></button>
          <button className={`${styles.iconBtn} ${styles.active}`} onClick={() => navigate('/my-mapweb')}><User size={20} /></button>
        </nav>
      </header>

      <div className={styles.webBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.avatar}>
                  <User size={28} color="white" />
                </div>

                <div className={styles.userInfo}>
                  {isEditingTitle ? (
                    <div className={styles.editTitleRow}>
                      <input
                        type="text"
                        value={mapTitle}
                        onChange={(event) => setMapTitle(event.target.value)}
                        className={styles.titleInput}
                      />
                      <button
                        className={styles.saveBtn}
                        onClick={async () => {
                          setIsEditingTitle(false);
                          await handleProfileUpdate({ title: mapTitle });
                        }}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div className={styles.titleRow}>
                      <h2>{mapTitle}</h2>
                      <Edit2 size={14} className={styles.editIcon} onClick={() => setIsEditingTitle(true)} />
                    </div>
                  )}

                  {isEditingDesc ? (
                    <div className={styles.editTitleRow}>
                      <input
                        type="text"
                        value={mapDesc}
                        onChange={(event) => setMapDesc(event.target.value)}
                        className={styles.titleInput}
                      />
                      <button
                        className={styles.saveBtn}
                        onClick={async () => {
                          setIsEditingDesc(false);
                          await handleProfileUpdate({ description: mapDesc });
                        }}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <div className={styles.titleRow}>
                      <p>{mapDesc}</p>
                      <Edit2 size={14} className={styles.editIcon} onClick={() => setIsEditingDesc(true)} />
                    </div>
                  )}

                  <p>@{myMap?.mapProfile?.publicMapId || '생성 중'}</p>
                </div>
              </div>

              <div className={styles.toggleSwitch}>
                <span>공개 지도 허용</span>
                <div
                  className={`${styles.switch} ${isPublic ? styles.on : ''}`}
                  onClick={() => handleProfileUpdate({ isPublic: !isPublic })}
                >
                  <div className={styles.switchThumb} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {isPublic && (
                <button className={styles.shareBtn} onClick={handleShare}>
                  <Share2 size={16} /> 링크 복사
                </button>
              )}
              <button className={styles.shareBtn} onClick={() => navigate('/sharedweb')}>
                공개 지도 탐색
              </button>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <strong>{stores.length + publicInstitutions.length}</strong>
                <span>내 지도 장소</span>
              </div>
              <div className={styles.statBox}>
                <strong>{stores.length}</strong>
                <span>저장한 매장</span>
              </div>
            </div>
          </div>

          <div className={styles.mainTabs}>
            <button className={`${styles.mainTab} ${activeTab === 'STORE' ? styles.active : ''}`} onClick={() => setActiveTab('STORE')}>매장 ({stores.length})</button>
            <button className={`${styles.mainTab} ${activeTab === 'PUBLIC' ? styles.active : ''}`} onClick={() => setActiveTab('PUBLIC')}>공공기관 ({publicInstitutions.length})</button>
          </div>

          {activeTab === 'STORE' && (
            <div className={styles.filterBar}>
              <button className={`${styles.filterBtn} ${!onlyOpen ? styles.active : ''}`} onClick={() => setOnlyOpen(false)}>전체</button>
              <button className={`${styles.filterBtn} ${onlyOpen ? styles.active : ''}`} onClick={() => setOnlyOpen(true)}>영업중만</button>
            </div>
          )}

          <div className={styles.listContainer}>
            {isLoading && <div className={styles.emptyState}>내 지도를 불러오는 중입니다.</div>}
            {!isLoading && error && <div className={styles.emptyState}>{error}</div>}
            {!isLoading && !error && allFilteredItems.length === 0 && (
              <div className={styles.emptyState}>아직 내 지도에 저장한 장소가 없습니다.</div>
            )}

            {!isLoading && !error && allFilteredItems.length > 0 && (
              <div className={styles.cardsWrapper}>
                {allFilteredItems.map((item) => {
                  const detailPath = item.type === 'STORE' ? `/storeweb/${item.id}` : `/publicweb/${item.id}`;
                  return (
                    <div key={`${item.type}-${item.internalStoreId || item.internalId || item.id}`} className={styles.cardItem} style={{ position: 'relative' }}>
                      <PlaceCard place={item} type={item.type} isWeb />
                      <div className={styles.cardActions}>
                        <button
                          className={styles.secondaryActionBtn}
                          onClick={() => {
                            if (item.lat && item.lng) {
                              setMapCenter({ lat: item.lat, lng: item.lng });
                            }
                          }}
                        >
                          지도에서 보기
                        </button>
                        <button className={styles.secondaryActionBtn} onClick={() => navigate(detailPath)}>
                          상세 보기
                        </button>
                        <button className={styles.dangerActionBtn} onClick={() => handleRemovePlace(item)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className={styles.contentArea}>
          <main className={styles.mapArea}>
            <Map center={mapCenter} style={{ width: '100%', height: '100%', borderRadius: '16px' }} level={4}>
              {allFilteredItems.map((item, index) => {
                const position = item.lat && item.lng
                  ? { lat: item.lat, lng: item.lng }
                  : { lat: 37.5065 + (index * 0.0012), lng: 127.0536 + (index * 0.0012) };

                return (
                  <CustomOverlayMap key={`marker-${item.type}-${item.internalStoreId || item.internalId || item.id}`} position={position} yAnchor={1} zIndex={100}>
                    <div className={styles.markerPlaceholder}>
                      <div
                        className={styles.markerBaloon}
                        onClick={() => navigate(item.type === 'STORE' ? `/storeweb/${item.id}` : `/publicweb/${item.id}`)}
                      >
                        <div style={{ width: 8, height: 8, background: item.color, borderRadius: '50%' }} />
                        <span style={{ color: item.color }}>{item.name}</span>
                      </div>
                      <MapPin size={42} fill="rgba(15,23,42,0.9)" color="white" style={{ color: item.color }} className={styles.markerPin} />
                    </div>
                  </CustomOverlayMap>
                );
              })}

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

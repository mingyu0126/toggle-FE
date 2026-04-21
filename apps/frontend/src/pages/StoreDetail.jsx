import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Phone, Clock, AlertCircle, Heart, Navigation, Share2, Map as MapIcon, Image as ImageIcon } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import StatusBadge from '../components/common/StatusBadge';
import LoginModal from '../components/common/LoginModal'; // 추가
import ImageCarousel from '../components/common/ImageCarousel';
import { addFavoriteStore, removeFavoriteStore } from '../lib/favorites';
import { isFavoritePlace, isLoggedIn as getIsLoggedIn } from '../lib/session';
import { getStoreOperatingInfoByCandidates } from '../lib/storeRuntime';
import { useStoreLookupByExternalPlaceId } from '../hooks/useStoreLookupByExternalPlaceId';
import { mapStoreToPlace } from '../lib/mappers';
import styles from './StoreDetail.module.css';

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState('IMAGE'); // 'IMAGE' or 'MAP'

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFavoriteSubmitting, setIsFavoriteSubmitting] = useState(false);
  const isLoggedIn = getIsLoggedIn();
  const previewStore = location.state?.placePreview || null;
  const { storeMatch, isLoading: isLookupLoading } = useStoreLookupByExternalPlaceId(id);
  
  // 통합 매퍼 사용
  const baseStore = storeMatch ? mapStoreToPlace(storeMatch) : previewStore;
  const runtimeStoreId = baseStore?.internalStoreId ?? baseStore?.id ?? id;
  const operatingInfo = getStoreOperatingInfoByCandidates([runtimeStoreId, id]);
  
  // 운영 정보 병합 (수동 병합 - 통합 매퍼에 포함되지 않은 런타임 로직)
  const mergedStore = baseStore ? {
    ...baseStore,
    businessHours: operatingInfo ? `${operatingInfo.openTime} - ${operatingInfo.closeTime}` : baseStore.businessHours,
    hasBreakTime: operatingInfo ? true : baseStore.hasBreakTime,
    breakTime: operatingInfo ? `${operatingInfo.breakStart} - ${operatingInfo.breakEnd}` : baseStore.breakTime,
  } : null;

  const ownerComment = mergedStore?.ownerNotice || '';
  const ownerImages = mergedStore?.ownerImages || [];
  const [isFavorite, setIsFavorite] = useState(() => mergedStore ? isFavoritePlace('STORE', mergedStore) : false);

  // Sheet drag state (Home.jsx와 동일한 100% 레이아웃 형태 복귀)
  const [sheetHeight, setSheetHeight] = useState(55); // 기본 55%
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [startHeight, setStartHeight] = useState(null);

  const handleDragStart = (e) => {
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
    
    // 조절 가능 범위 고정
    if (newHeight > 85) newHeight = 85;
    if (newHeight < 25) newHeight = 25;
    
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
  }, [isDragging]);
  
  const store = mergedStore ? { ...mergedStore, status: mergedStore.status } : null; 

  useEffect(() => {
    const syncFavoriteState = () => {
      if (mergedStore) {
        setIsFavorite(isFavoritePlace('STORE', mergedStore));
      }
    };

    syncFavoriteState();
    window.addEventListener('favoritesChanged', syncFavoriteState);
    return () => window.removeEventListener('favoritesChanged', syncFavoriteState);
  }, [mergedStore?.id]);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const handleDirections = () => {
    if (store && store.lat && store.lng) {
      window.open(`https://map.kakao.com/link/to/${store.name},${store.lat},${store.lng}`, '_blank');
    } else {
      alert('위치 정보가 없습니다.');
    }
  };

  const handleShare = () => {
    if (!store) return;
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
      setShowLoginModal(true);
      return;
    }

    if (isFavoriteSubmitting || !store) {
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

  if (isLookupLoading) return <div>상태를 불러오는 중입니다...</div>;
  if (!store || !store.name) return <div>장소 정보를 찾을 수 없습니다.</div>;

  // 임시 커버 이미지
  const coverImages = ownerImages.length > 0
    ? ownerImages
    : store.images && store.images.length > 0
    ? store.images
    : ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"];

  return (
    <div className={styles.container}>
      {/* 동적 헤더 */}
      <div className={`${styles.header} ${isScrolled ? styles.headerSolid : ''}`}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.headerTitle}>{store.name}</div>
        <button className={styles.headerActionBtn} onClick={handleFavoriteClick} disabled={isFavoriteSubmitting}>
          <Heart size={22} color={isFavorite ? '#ef4444' : (isScrolled ? 'var(--color-text-primary)' : 'white')} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
      </div>

      {/* 백그라운드 영역 (고정) */}
      <div className={styles.coverArea}>
        {viewMode === 'IMAGE' ? (
          <ImageCarousel images={coverImages} alt={store.name} />
        ) : (
          <Map 
            center={{ lat: store.lat, lng: store.lng }} 
            style={{ width: '100%', height: '100%' }} 
            level={3}
          >
            <MapMarker position={{ lat: store.lat, lng: store.lng }} />
          </Map>
        )}
      </div>

      {/* 스크롤/드래그 가능한 바텀 시트 정보 영역 */}
      <div 
        className={styles.contentSheet}
        style={{ 
          height: `${sheetHeight}dvh`,
          transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* 드래그 핸들 박스 */}
        <div 
          className={styles.dragWrapper}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className={styles.dragHandle} />
        </div>

        {/* 내부 스크롤 가능한 본문 */}
        <div className={styles.scrollArea} onScroll={handleScroll}>
          <div className={styles.contentHeader}>
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
              {store.roadAddress && store.roadAddress !== store.address && (
                <div className={styles.infoItem}>
                  <MapPin size={18} className={styles.icon} />
                  <span>도로명: {store.roadAddress}</span>
                </div>
              )}
              {store.jibunAddress && (
                <div className={styles.infoItem}>
                  <MapPin size={18} className={styles.icon} />
                  <span>지번: {store.jibunAddress}</span>
                </div>
              )}
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
              <div className={styles.infoItem}>
                <AlertCircle size={18} className={styles.icon} />
                <div>
                  <div>데이터 출처: {store.source || 'KAKAO'}</div>
                  <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
                    {store.verifiedAt ? `검증 시각: ${store.verifiedAt}` : '카카오 검색 결과 기반'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 플로팅 바 */}
      <div className={styles.floatingActionBar}>
        <button className={styles.shareBtn} onClick={handleShare}>
          <Share2 size={22} />
        </button>
        <button className={styles.mapToggleBtn} onClick={() => setViewMode(viewMode === 'IMAGE' ? 'MAP' : 'IMAGE')}>
          {viewMode === 'IMAGE' ? <MapIcon size={20} /> : <ImageIcon size={20} />} 
          {viewMode === 'IMAGE' ? '지도보기' : '사진보기'}
        </button>
        <button className={styles.navBtn} onClick={handleDirections}>
          <Navigation size={20} /> 길찾기
        </button>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message="찜하기 및 저장 기능은 로그인 후 이용하실 수 있습니다."
      />
    </div>
  );
}

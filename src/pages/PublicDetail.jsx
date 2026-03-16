import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, BarChart2, Heart, Navigation, Share2, Map as MapIcon, Image as ImageIcon } from 'lucide-react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { mockPublicInstitutions } from '../mocks/public.mock';
import StatusBadge from '../components/common/StatusBadge';
import LoginModal from '../components/common/LoginModal'; // 추가
import styles from './PublicDetail.module.css'; // 전용 CSS 사용

export default function PublicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState('IMAGE'); // 'IMAGE' or 'MAP'

  const [showLoginModal, setShowLoginModal] = useState(false);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // 비회원 시뮬레이션

  // Sheet drag state (StoreDetail과 동일 레이아웃)
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
  
  const place = mockPublicInstitutions.find(p => p.id === id) || mockPublicInstitutions[0];

  useEffect(() => {
    // 이제 내부 스크롤 div에서 이벤트를 핸들링합니다.
  }, []);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

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

  if (!place) return <div>Institution not found</div>;

  // 임시 커버 이미지
  const coverImageUrl = "https://images.unsplash.com/photo-1577985051167-0d49eec21977?auto=format&fit=crop&w=800&q=80";

  return (
    <div className={styles.container}>
      {/* 동적 헤더 */}
      <div className={`${styles.header} ${isScrolled ? styles.headerSolid : ''}`}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <div className={styles.headerTitle}>{place.name}</div>
        <button className={styles.headerActionBtn} onClick={() => !isLoggedIn && setShowLoginModal(true)}>
          <Heart size={22} color={isScrolled ? '#1e293b' : 'white'} />
        </button>
      </div>

      {/* 백그라운드 영역 (고정) */}
      <div className={styles.coverArea}>
        {viewMode === 'IMAGE' ? (
          <>
            <img src={coverImageUrl} alt={place.name} className={styles.coverImage} />
            <div className={styles.coverOverlay} />
          </>
        ) : (
          <Map 
            center={{ lat: place.lat, lng: place.lng }} 
            style={{ width: '100%', height: '100%' }} 
            level={3}
          >
            <MapMarker position={{ lat: place.lat, lng: place.lng }} />
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
              <h1 className={styles.title}>{place.name}</h1>
            </div>
            <span className={styles.category}>{place.category}</span>
              
            <div className={styles.statusWrapper}>
              <StatusBadge status={place.status} type="CONGESTION" size="md" />
              <span className={styles.updateTime}>{place.lastStatusUpdate} 업데이트</span>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <MapPin size={18} className={styles.icon} />
                <span>{place.address}</span>
              </div>
              <div className={styles.infoItem}>
                <Clock size={18} className={styles.icon} />
                <div>
                  <div>운영시간: {place.businessHours}</div>
                  <div style={{ color: 'var(--color-status-orange)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                    상세: 예상 대기시간 {place.estimatedWaitTime}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={20} /> 시간대별 예상 혼잡도 추이
              </h2>
              <div className={styles.chartContainer}>
                {place.hourlyCongestion.map((hour, idx) => {
                  let barColor = 'linear-gradient(180deg, var(--color-status-green) 0%, rgba(16, 185, 129, 0.1) 100%)';
                  if (hour.level > 80) {
                    barColor = 'linear-gradient(180deg, var(--color-status-red) 0%, rgba(2ef, 68, 68, 0.1) 100%)';
                  } else if (hour.level > 50) {
                    barColor = 'linear-gradient(180deg, var(--color-status-orange) 0%, rgba(245, 158, 11, 0.1) 100%)';
                  }

                  return (
                    <div key={idx} className={styles.chartBarWrapper}>
                      <div 
                        className={styles.chartBar} 
                        style={{ 
                          height: `${hour.level}%`, 
                          background: barColor
                        }} 
                      />
                      <span className={styles.chartLabel}>{hour.time}</span>
                    </div>
                  );
                })}
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

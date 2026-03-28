import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, MapPin, Star } from 'lucide-react';
import StatusBadge from './StatusBadge';
import LoginModal from './LoginModal'; // 글로벌 유도 적용을 위해 내포
import styles from './PlaceCard.module.css';

export default function PlaceCard({ place, type = 'STORE', isWeb = false, showFavorite = true, onClick }) {
  const isStore = type === 'STORE';
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // 글로벌 비회원 시뮬레이션

  const [isFavorite, setIsFavorite] = React.useState(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const favs = currentUser.favorites || { stores: [], publics: [] };
    const key = isStore ? 'stores' : 'publics';
    return favs[key] ? favs[key].includes(place.id) : false;
  });

  // 실시간 상태 주입 (점주 POS 연동)
  const liveStatus = isStore ? (localStorage.getItem(`storeStatus_${place.id}`) || place.status) : place.status;

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (isStore) {
      navigate(isWeb ? `/storeweb/${place.id}` : `/store/${place.id}`);
    } else {
      navigate(isWeb ? `/publicweb/${place.id}` : `/public/${place.id}`);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // 카드 이동 방지
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const favs = currentUser.favorites || { stores: [], publics: [] };
    const key = isStore ? 'stores' : 'publics';

    const newStatus = !isFavorite;
    setIsFavorite(newStatus);

    const updatedFavs = { ...favs };
    if (!updatedFavs[key]) updatedFavs[key] = []; // 방어 코드

    if (newStatus) {
      if (!updatedFavs[key].includes(place.id)) updatedFavs[key].push(place.id);
    } else {
      updatedFavs[key] = updatedFavs[key].filter(id => id !== place.id);
    }

    const updatedUser = { ...currentUser, favorites: updatedFavs };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // 전역 이벤트 송출 (Favorites 등 갱신 유도)
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{place.name}</h3>
          <span className={styles.category}>{place.category}</span>
        </div>
        {showFavorite && (
          <button 
            className={styles.favoriteBtn} 
            aria-label="즐겨찾기"
            onClick={handleFavoriteClick}
          >
            <Heart 
              size={20} 
              className={styles.heartIcon} 
              fill={isFavorite ? "#ef4444" : "none"} 
              color={isFavorite ? "#ef4444" : "white"} 
            />
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.statusRow}>
          <StatusBadge status={liveStatus} type={type} />
          <span className={styles.updateTime}>{place.lastStatusUpdate} 업데이트</span>
        </div>

        <div className={styles.infoRow}>
          <MapPin size={14} className={styles.icon} />
          <span className={styles.infoText}>{place.address}</span>
        </div>

        {isStore ? (
          <div className={styles.infoRow}>
            <Clock size={14} className={styles.icon} />
            <span className={styles.infoText}>{place.businessHours}</span>
            {place.hasBreakTime && <span className={styles.highlightText}>(브레이크 {place.breakTime})</span>}
          </div>
        ) : (
          <div className={styles.infoRow}>
            <Clock size={14} className={styles.icon} />
            <span className={styles.infoText}>예상 대기시간: <strong className={styles.highlightText}>{place.estimatedWaitTime}</strong></span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        {isStore && place.rating && (
          <div className={styles.statMetric}>
            <Star size={14} className={styles.starIcon} fill="currentColor" />
            <span>{place.rating}</span>
          </div>
        )}
        <div className={styles.statMetric}>
          <Heart size={14} className={styles.heartIconSmall} fill="currentColor" />
          <span>{place.favorites}</span>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message="찜하기 및 저장 기능은 로그인 후 이용하실 수 있습니다."
      />
    </div>
  );
}

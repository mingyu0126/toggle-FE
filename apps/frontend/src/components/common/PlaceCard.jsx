import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, MapPin, Star } from 'lucide-react';
import StatusBadge from './StatusBadge';
import LoginModal from './LoginModal'; // 글로벌 유도 적용을 위해 내포
import { addFavoriteStore, removeFavoriteStore } from '../../lib/favorites';
import { getLocalFavorites, isLoggedIn as getIsLoggedIn, updateLocalFavorite } from '../../lib/session';
import { getStoreLiveStatus } from '../../lib/storeRuntime';
import styles from './PlaceCard.module.css';

export default function PlaceCard({ place, type = 'STORE', isWeb = false, showFavorite = true, onClick }) {
  const isStore = type === 'STORE';
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isLoggedIn = getIsLoggedIn();

  const [isFavorite, setIsFavorite] = React.useState(() => {
    const favs = getLocalFavorites();
    const key = isStore ? 'stores' : 'publics';
    return favs[key] ? favs[key].map(String).includes(String(place.id)) : false;
  });

  // 실시간 상태 주입 (점주 POS 연동)
  const runtimeStoreId = place.internalStoreId ?? place.id;
  const liveStatus = isStore ? getStoreLiveStatus(runtimeStoreId, place.status) : place.status;

  React.useEffect(() => {
    const handleFavoritesChanged = () => {
      const favs = getLocalFavorites();
      const key = isStore ? 'stores' : 'publics';
      setIsFavorite(favs[key] ? favs[key].map(String).includes(String(place.id)) : false);
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, [isStore, place.id]);

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (isStore) {
      navigate(isWeb ? `/storeweb/${place.id}` : `/store/${place.id}`, {
        state: { placePreview: place },
      });
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

    if (isSubmitting) {
      return;
    }

    const run = async () => {
      setIsSubmitting(true);

      try {
        if (isStore) {
          if (isFavorite) {
            await removeFavoriteStore(place);
            setIsFavorite(false);
          } else {
            await addFavoriteStore(place);
            setIsFavorite(true);
          }
        } else {
          updateLocalFavorite('PUBLIC', place.id, !isFavorite);
          setIsFavorite(!isFavorite);
        }
      } catch (error) {
        alert(error.message || '즐겨찾기 처리 중 오류가 발생했습니다.');
      } finally {
        setIsSubmitting(false);
      }
    };

    run();
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
            disabled={isSubmitting}
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

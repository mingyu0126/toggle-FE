import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, User, Map as MapIcon } from 'lucide-react';
import { mockUser } from '../mocks/users.mock';
import { mockStores } from '../mocks/stores.mock';
import PlaceCard from '../components/common/PlaceCard';
import styles from './SharedMap.module.css';

export default function SharedMap() {
  const navigate = useNavigate();
  const { id } = useParams(); // /shared/:id
  
  const [searchId, setSearchId] = useState(id || '');
  const [searchedUser, setSearchedUser] = useState(id ? mockUser : null); // Mock implementation
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId) return;
    
    setIsLoading(true);
    setTimeout(() => {
      // Mock search logic
      if (searchId === 'toggle_user_1' || searchId === 'test') {
        setSearchedUser(mockUser);
        navigate(`/shared/${searchId}`, { replace: true });
      } else {
        setSearchedUser('NOT_FOUND');
      }
      setIsLoading(false);
    }, 500);
  };

  const sharedStores = searchedUser && searchedUser !== 'NOT_FOUND' 
    ? mockStores.filter(s => searchedUser.favorites.stores.includes(s.id))
    : [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>공개 지도 탐색</h1>
        </div>
        
        <form className={styles.searchBox} onSubmit={handleSearch}>
          <Search size={18} color="var(--color-text-muted)" />
          <input 
            type="text"
            className={styles.searchInput}
            placeholder="사용자 아이디 검색 (ex. toggle_user_1)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            검색
          </button>
        </form>
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.emptyState}>검색 중...</div>
        ) : searchedUser && searchedUser !== 'NOT_FOUND' ? (
          <>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                <User size={24} />
              </div>
              <div className={styles.userInfo}>
                <h2>{searchedUser.nickname}님의 지도</h2>
                <p>@{searchedUser.username}</p>
              </div>
            </div>

            <div className={styles.listHeader}>
              <h3 className={styles.listTitle}>공개된 저장 장소</h3>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                총 {sharedStores.length}개
              </span>
            </div>

            <div className={styles.placeGrid}>
              {sharedStores.length > 0 ? (
                sharedStores.map(store => (
                  <PlaceCard key={store.id} place={store} type="STORE" />
                ))
              ) : (
                <div className={styles.emptyState}>저장된 장소가 없습니다.</div>
              )}
            </div>
          </>
        ) : searchedUser === 'NOT_FOUND' ? (
          <div className={styles.emptyState}>
            <User size={48} opacity={0.3} />
            <p>존재하지 않거나 비공개 설정된 사용자입니다.</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <MapIcon size={48} opacity={0.3} />
            <p>아이디를 검색해 다른 사람들의<br/>맛집/핫플 지도를 구경해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

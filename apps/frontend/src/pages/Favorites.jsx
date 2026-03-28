import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Store, Users, User, MapPin, List as ListIcon } from 'lucide-react';
import { mockUser } from '../mocks/users.mock';
import { mockStores } from '../mocks/stores.mock';
import { mockPublicInstitutions } from '../mocks/public.mock';
import PlaceCard from '../components/common/PlaceCard';
import styles from './Favorites.module.css';

export default function Favorites() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'STORE' | 'PUBLIC'
  
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true'); // 비회원 가상 시뮬레이션
  const [favorites, setFavorites] = useState(currentUser.favorites || { stores: [], publics: [] });

  React.useEffect(() => {
    const handleFavsChanged = () => {
      const updated = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setCurrentUser(updated);
      setFavorites(updated.favorites || { stores: [], publics: [] });
    };
    window.addEventListener('favoritesChanged', handleFavsChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavsChanged);
  }, []);

  const favStores = mockStores.filter(s => favorites.stores.includes(s.id));
  const favPublics = mockPublicInstitutions.filter(p => favorites.publics.includes(p.id));

  const totalCount = favStores.length + favPublics.length;

  const handleAddToMyMap = (itemId, type) => {
    const myMap = currentUser.myMap || { stores: [], publics: [] };
    const key = type === 'STORE' ? 'stores' : 'publics';
    
    if (myMap[key] && myMap[key].includes(itemId)) {
      alert('이미 내 지도에 추가된 장소입니다.');
      return;
    }

    const updatedMyMap = { ...myMap };
    if (!updatedMyMap[key]) updatedMyMap[key] = [];
    updatedMyMap[key].push(itemId);

    const updatedUser = { ...currentUser, myMap: updatedMyMap };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    alert('🧭 내 지도에 성공적으로 추가되었습니다!');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>저장한 장소</h1>
      </header>

      {/* Segmented Controller / Tabs */}
      <div className={styles.tabWrapper}>
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'ALL' ? styles.active : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            기본 전체 {isLoggedIn ? `(${totalCount})` : ''}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'STORE' ? styles.active : ''}`}
            onClick={() => setActiveTab('STORE')}
          >
            매장 {isLoggedIn ? `(${favStores.length})` : ''}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'PUBLIC' ? styles.active : ''}`}
            onClick={() => setActiveTab('PUBLIC')}
          >
            공공기관 {isLoggedIn ? `(${favPublics.length})` : ''}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {!isLoggedIn ? (
          <div className={styles.emptyState} style={{ marginTop: '5rem' }}>
            <div className={styles.emptyIcon}>
              <Heart size={48} strokeWidth={1} />
            </div>
            <h3>로그인이 필요한 메뉴입니다</h3>
            <p>저장한 장소 목록을 확인하려면 로그인해 주세요.</p>
            <button className={styles.goMapBtn} onClick={() => navigate('/login')}>
              로그인하기
            </button>
          </div>
        ) : (
          <>
            {(activeTab === 'ALL' || activeTab === 'STORE') && favStores.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Store size={18} className={styles.iconStore} />
                  <h2 className={styles.sectionTitle}>저장한 매장</h2>
                </div>
                <div className={styles.grid}>
                  {favStores.map(store => (
                    <div key={store.id} style={{ position: 'relative' }}>
                      <PlaceCard place={store} type="STORE" />
                      <button className={styles.myMapBtn} onClick={() => handleAddToMyMap(store.id, 'STORE')}>
                         🧭 내 지도에 추가
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'ALL' || activeTab === 'PUBLIC') && favPublics.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Users size={18} className={styles.iconPublic} />
                  <h2 className={styles.sectionTitle}>저장한 공공기관</h2>
                </div>
                <div className={styles.grid}>
                  {favPublics.map(pub => (
                    <div key={pub.id} style={{ position: 'relative' }}>
                      <PlaceCard place={pub} type="CONGESTION" />
                      <button className={styles.myMapBtn} onClick={() => handleAddToMyMap(pub.id, 'PUBLIC')}>
                         🧭 내 지도에 추가
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {((activeTab === 'ALL' && totalCount === 0) ||
              (activeTab === 'STORE' && favStores.length === 0) ||
              (activeTab === 'PUBLIC' && favPublics.length === 0)) && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Heart size={48} strokeWidth={1} />
                </div>
                <h3>저장한 장소가 없습니다</h3>
                <p>마음에 드는 장소의 하트를 눌러보세요!</p>
                <button className={styles.goMapBtn} onClick={() => navigate('/map')}>
                  <MapPin size={18} /> 지도에서 찾아보기
                </button>
              </div>
            )}
          </>
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
          <button style={navBtnStyle(true)}>
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

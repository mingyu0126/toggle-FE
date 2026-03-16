import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldCheck, Users, Store, Activity, 
  AlertTriangle, List, Plus, Trash2, Edit, Check, X 
} from 'lucide-react';
import { mockStores } from '../mocks/stores.mock';
import { mockPublicInstitutions } from '../mocks/public.mock';
import StatusBadge from '../components/common/StatusBadge';
import styles from './Admin.module.css';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // CRUD 시뮬레이션용 로컬 상태
  const [stores, setStores] = useState(mockStores);
  const [publics, setPublics] = useState(mockPublicInstitutions);
  
  // 필터링 상태 (전국 시/도 단위 확장)
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const regions = ['전체', '서울', '부산', '제주', '경기', '인천', '대전', '대구', '광주', '강원'];
  
  const [owners] = useState([
    { id: 1, name: '김점주', store: '맛있는 덮밥집', email: 'owner1@test.com', status: '승인완료' },
    { id: 2, name: '이사장', store: '커피 한잔의 여유', email: 'owner2@test.com', status: '대기중' },
    { id: 3, name: '박대표', store: '정통 수제버거', email: 'owner3@test.com', status: '승인완료' },
  ]);

  const [reports] = useState([
    { id: 1, type: '정보오류', target: '맛있는 덮밥집', desc: '영업시간이 다릅니다.', date: '방금 전', status: '처리중' },
    { id: 2, type: '시스템오류', target: '지도화면', desc: 'GPS가 잡히지 않습니다.', date: '1시간 전', status: '대기' },
  ]);

  // 핸들러 시뮬레이션
  const handleDeleteStore = (id) => {
    if(window.confirm('정말 삭제하시겠습니까?')) {
      setStores(stores.filter(s => s.id !== id));
    }
  };

  const handleDeletePublic = (id) => {
    if(window.confirm('정말 삭제하시겠습니까?')) {
      setPublics(publics.filter(p => p.id !== id));
    }
  };

  // --- Sub Renders ---

  // 1. 대시보드 통계 홈
  const renderDashboard = () => (
    <>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span>가입 매장</span><Store size={18} /></div>
          <div className={styles.statValue}>{stores.length}</div>
          <div className={`${styles.trend} ${styles.up}`}>+12 이번 주</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span>공공기관 연동</span><Activity size={18} /></div>
          <div className={styles.statValue}>{publics.length}</div>
          <div className={`${styles.trend} ${styles.up}`}>+2 이번 주</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span>활성 사용자</span><Users size={18} /></div>
          <div className={styles.statValue}>8,942</div>
          <div className={`${styles.trend} ${styles.up}`}>+340 이번 주</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}><span>미처리 제보</span><AlertTriangle size={18} color="var(--color-status-orange)" /></div>
          <div className={styles.statValue} style={{ color: 'var(--color-status-orange)' }}>{reports.filter(r => r.status === '대기').length}</div>
          <div className={`${styles.trend} ${styles.down}`}>-3 어제보다 감소</div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>최근 상태 변경 로그 (실시간 모니터링)</h2>
        <div className={styles.tableCard}>
          <div className={`${styles.tableHeader} ${styles.grid3}`}>
            <div>매장명</div><div>현재 상태</div><div style={{ textAlign: 'right' }}>갱신 시간</div>
          </div>
          {stores.slice(0, 3).map(store => (
            <div key={store.id} className={`${styles.tableRow} ${styles.grid3}`}>
              <div className={styles.cellName}>{store.name}<span className={styles.cellCategory}>{store.category}</span></div>
              <div><StatusBadge status={store.status} type="STORE" /></div>
              <div style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{store.lastStatusUpdate}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  // 2. 매장 관리
  const renderStores = () => {
    // 지역 필터 적용
    const filteredStores = selectedRegion === '전체' 
      ? stores 
      : stores.filter(s => s.address.includes(selectedRegion));

    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className={styles.sectionTitle}>매장 데이터 관리</h2>
            <select 
              className={styles.filterSelect}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600, background: 'white' }}
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className={styles.addButton} onClick={() => alert('매장 등록 폼 모달 기능 확장 예정')}><Plus size={16} /> 신규 등록</button>
        </div>
        <div className={styles.tableCard}>
          <div className={`${styles.tableHeader} ${styles.grid4}`}>
            <div>매장명</div><div>상태</div><div>위치</div><div style={{ textAlign: 'right' }}>관리</div>
          </div>
          {filteredStores.map(store => (
            <div key={store.id} className={`${styles.tableRow} ${styles.grid4}`}>
              <div className={styles.cellName}>{store.name}<span className={styles.cellCategory}>{store.category}</span></div>
              <div style={{ display: 'flex' }}><StatusBadge status={store.status} type="STORE" /></div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{store.address.split(' ').slice(1,3).join(' ')}</div>
              <div className={styles.actions}>
                <button className={styles.iconBtn}><Edit size={16} /></button>
                <button className={styles.iconBtn} style={{ color: 'var(--color-status-red)' }} onClick={() => handleDeleteStore(store.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // 3. 공공기관 관리
  const renderPublics = () => (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>공공기관 데이터 관리</h2>
        <button className={styles.addButton}><Plus size={16} /> 신규 연동</button>
      </div>
      <div className={styles.tableCard}>
        <div className={`${styles.tableHeader} ${styles.grid4}`}>
          <div>기관명</div><div>혼잡도</div><div>대기시간</div><div style={{ textAlign: 'right' }}>관리</div>
        </div>
        {publics.map(pub => (
          <div key={pub.id} className={`${styles.tableRow} ${styles.grid4}`}>
            <div className={styles.cellName}>{pub.name}<span className={styles.cellCategory}>{pub.category}</span></div>
            <div><StatusBadge status={pub.status} type="CONGESTION" /></div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pub.estimatedWaitTime}</div>
            <div className={styles.actions}>
              <button className={styles.iconBtn}><Edit size={16} /></button>
              <button className={styles.iconBtn} style={{ color: 'var(--color-status-red)' }} onClick={() => handleDeletePublic(pub.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // 4. 점주 관리
  const renderOwners = () => (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>점주 계정 관리</h2>
      <div className={styles.tableCard}>
        <div className={`${styles.tableHeader} ${styles.grid4}`}>
          <div>점주명</div><div>이메일</div><div>매장</div><div style={{ textAlign: 'right' }}>상태</div>
        </div>
        {owners.map(owner => (
          <div key={owner.id} className={`${styles.tableRow} ${styles.grid4}`}>
            <div style={{ fontWeight: 600 }}>{owner.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{owner.email}</div>
            <div>{owner.store}</div>
            <div style={{ textAlign: 'right' }}>
              {owner.status === '대기중' ? (
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                  <button className={styles.iconBtn} style={{ color: 'var(--color-status-green)' }}><Check size={16} /></button>
                  <button className={styles.iconBtn} style={{ color: 'var(--color-status-red)' }}><X size={16} /></button>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-status-green)', fontWeight: 600 }}>승인</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}><ShieldCheck size={20} color="white" /></div>
          <h1 className={styles.title}>Toggle <span className={styles.subtitle}>Admin</span></h1>
        </div>
        <button className={styles.logoutBtn} onClick={() => navigate('/login')}>
          <LogOut size={18} /> 로그아웃
        </button>
      </header>

      <div className={styles.mainFrame}>
        {/* 사이드바 메뉴 */}
        <nav className={styles.sidebar}>
          <button className={`${styles.navItem} ${activeTab === 'DASHBOARD' ? styles.activeNav : ''}`} onClick={() => setActiveTab('DASHBOARD')}><Activity size={18} /> 대시보드</button>
          <button className={`${styles.navItem} ${activeTab === 'STORES' ? styles.activeNav : ''}`} onClick={() => setActiveTab('STORES')}><Store size={18} /> 매장 관리</button>
          <button className={`${styles.navItem} ${activeTab === 'PUBLIC' ? styles.activeNav : ''}`} onClick={() => setActiveTab('PUBLIC')}><List size={18} /> 공공기관 관리</button>
          <button className={`${styles.navItem} ${activeTab === 'OWNERS' ? styles.activeNav : ''}`} onClick={() => setActiveTab('OWNERS')}><Users size={18} /> 점주 관리</button>
          <button className={`${styles.navItem} style={{ color: 'var(--color-status-orange)' }}`} onClick={() => alert('신고/로그 탭 확장 준비중')}><AlertTriangle size={18} /> 신고/오류</button>
        </nav>

        {/* 메인 컨텐츠 */}
        <main className={styles.content}>
          {activeTab === 'DASHBOARD' && renderDashboard()}
          {activeTab === 'STORES' && renderStores()}
          {activeTab === 'PUBLIC' && renderPublics()}
          {activeTab === 'OWNERS' && renderOwners()}
        </main>
      </div>
    </div>
  );
}

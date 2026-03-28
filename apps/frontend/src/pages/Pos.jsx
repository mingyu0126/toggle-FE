import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store as StoreIcon, Play, Pause, Square, AlertTriangle, Clock, Settings, List } from 'lucide-react';
import { STATUS_TYPES } from '../constants/status';
import StatusBadge from '../components/common/StatusBadge';
import styles from './Pos.module.css';

export default function Pos() {
  const navigate = useNavigate();
  // 모의 점주 데이터: 초기엔 POS 로그인 시 자동으로 영업중 처리한다고 가정
  const [storeStatus, setStoreStatus] = useState(localStorage.getItem('storeStatus_store-1') || STATUS_TYPES.STORE.OPEN);
  const [activePanel, setActivePanel] = useState(null); // 'BREAK_TIME', 'TEMP_CLOSED', 'EARLY_CLOSED'
  
  // 브레이크타임 설정 폼 상태
  const [breakStart, setBreakStart] = useState('15:00');
  const [breakEnd, setBreakEnd] = useState('17:00');

  // 사장님 실시간 코멘트 상태
  const [ownerComment, setOwnerComment] = useState(localStorage.getItem('ownerComment_store-1') || '');

  // 히스토리 초기값 (로그인 즉시 영업중으로 기록됨)
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // POS 로그인 시 초기 '영업중' 전환 시뮬레이션
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory([{ status: storeStatus, time: timeStr, msg: '포스기 로그인 (인증 완료)' }]);
    
    // 로컬스토리지에 상태 동기화 (초기값 없을 때만)
    if (!localStorage.getItem('storeStatus_store-1')) {
       localStorage.setItem('storeStatus_store-1', STATUS_TYPES.STORE.OPEN);
    }
  }, []);

  const handleLogout = () => {
    // 로그아웃 시 자동 영업종료 처리 모의
    alert('POS 로그아웃. 매장 상태가 자동으로 [영업종료] 처리됩니다.');
    navigate('/login');
  };

  const logHistory = (status, msg) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [{ status, time: timeStr, msg }, ...prev]);
  };

  const handleStatusClick = (type) => {
    if (type === STATUS_TYPES.STORE.OPEN) {
      setStoreStatus(type);
      setActivePanel(null);
      logHistory(type, '영업 재개 처리');
      localStorage.setItem('storeStatus_store-1', type);
    } else if (type === STATUS_TYPES.STORE.CLOSED) {
      setStoreStatus(type);
      setActivePanel(null);
      logHistory(type, '영업 종료 처리');
      localStorage.setItem('storeStatus_store-1', type);
    } else {
      // 기타 상태는 설정 패널 열기
      setActivePanel(activePanel === type ? null : type);
    }
  };

  const handleApplyBreak = () => {
    setStoreStatus(STATUS_TYPES.STORE.BREAK_TIME);
    logHistory(STATUS_TYPES.STORE.BREAK_TIME, `브레이크타임 시작 (${breakStart} ~ ${breakEnd})`);
    setActivePanel(null);
    localStorage.setItem('storeStatus_store-1', STATUS_TYPES.STORE.BREAK_TIME);
  };

  const handleApplyTemp = () => {
    setStoreStatus(STATUS_TYPES.STORE.TEMP_CLOSED);
    logHistory(STATUS_TYPES.STORE.TEMP_CLOSED, '긴급 임시휴무 처리');
    setActivePanel(null);
    localStorage.setItem('storeStatus_store-1', STATUS_TYPES.STORE.TEMP_CLOSED);
  };

  const handleApplyEarly = () => {
    setStoreStatus(STATUS_TYPES.STORE.EARLY_CLOSED);
    logHistory(STATUS_TYPES.STORE.EARLY_CLOSED, '재료소진 등으로 조기마감');
    setActivePanel(null);
    localStorage.setItem('storeStatus_store-1', STATUS_TYPES.STORE.EARLY_CLOSED);
  };

  const handleSaveComment = () => {
    localStorage.setItem('ownerComment_store-1', ownerComment);
    logHistory(storeStatus, `📢 사장님 코멘트 변경: "${ownerComment}"`);
    alert('코멘트가 배포되었습니다!');
  };

  // 버튼 활성화용 스타일 클래스 추출
  const getActiveClass = (type) => {
    if (storeStatus !== type) return '';
    if (type === STATUS_TYPES.STORE.BREAK_TIME || type === STATUS_TYPES.STORE.EARLY_CLOSED) return styles.activeBreak;
    if (type === STATUS_TYPES.STORE.CLOSED) return styles.activeClosed;
    if (type === STATUS_TYPES.STORE.TEMP_CLOSED) return styles.activeTemp;
    return styles.active; // Open
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <StoreIcon size={20} color="white" />
          </div>
          <h1 className={styles.title}>Toggle <span className={styles.subtitle}>Owner Dashboard</span></h1>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} /> 로그아웃
        </button>
      </header>

      <main className={styles.content}>
        <div className={styles.storeInfoCard}>
          <div>
            <div className={styles.storeName}>맛있는 덮밥집 본점</div>
            <div className={styles.storeId}>Store ID: 1984-2938</div>
          </div>
          <div className={styles.statusWrapper}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>현업 영업 상태 (LIVE)</span>
            <StatusBadge status={storeStatus} type="STORE" className={styles.currentBadge} />
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Settings size={20} /> 실시간 상태 관리</h2>
          <div className={styles.statusGrid}>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.OPEN)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.OPEN)}
            >
              <Play size={28} /> 영업중 전환
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.BREAK_TIME)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.BREAK_TIME)}
            >
              <Pause size={28} /> 브레이크타임
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.CLOSED)}
            >
              <Square size={28} /> 영업 종료
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.EARLY_CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.EARLY_CLOSED)}
            >
              <Clock size={28} /> 조기 마감
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.TEMP_CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.TEMP_CLOSED)}
            >
              <AlertTriangle size={28} /> 임시 휴무
            </button>
          </div>

          {/* 브레이크타임 설정 패널 */}
          {activePanel === STATUS_TYPES.STORE.BREAK_TIME && (
            <div className={styles.settingsPanel}>
              <div className={styles.formGroup}>
                <label>브레이크타임 시간 설정</label>
                <div className={styles.timeInputContainer}>
                  <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className={styles.timeInput}/>
                  <span>~</span>
                  <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className={styles.timeInput}/>
                </div>
              </div>
              <button className={styles.applyBtn} onClick={handleApplyBreak}>적용 및 상태 변경</button>
            </div>
          )}

          {/* 조기마감 설정 패널 */}
          {activePanel === STATUS_TYPES.STORE.EARLY_CLOSED && (
            <div className={styles.settingsPanel}>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>재료 소진, 인력 부족 등의 사유로 금일 영업을 일찍 마감하시겠습니까?</p>
              <button className={styles.applyBtn} onClick={handleApplyEarly}>금일 조기마감 적용</button>
            </div>
          )}

          {/* 임시휴무 설정 패널 */}
          {activePanel === STATUS_TYPES.STORE.TEMP_CLOSED && (
            <div className={styles.settingsPanel}>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-status-red)' }}>내부 수리, 점주 사정 등으로 매장 운영을 임시 중단합니다. 포털 및 토글 지도에 '임시휴무'로 표시됩니다.</p>
              <button className={styles.applyBtn} style={{ background: 'var(--color-status-red)' }} onClick={handleApplyTemp}>임시휴무 즉시 적용</button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--color-primary)' }}>📢 사장님 실시간 코멘트</h2>
          <div className={styles.settingsPanel} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <textarea 
              placeholder="예) 재료가 조기 소진되었습니다!, 오늘 6시까지 영업합니다."
              value={ownerComment}
              onChange={(e) => setOwnerComment(e.target.value)}
              className={styles.commentInput}
            />
            <button className={styles.applyBtn} onClick={handleSaveComment}>코멘트 저장/적용</button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><List size={20} /> 당일 로그 (History)</h2>
          <div className={styles.historyCard}>
            <div className={styles.historyList}>
              {history.map((item, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyTime}>{item.time}</div>
                  <StatusBadge status={item.status} type="STORE" />
                  <div className={styles.historyMessage}>{item.msg}</div>
                </div>
              ))}
              {history.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>오늘 상태 변경 이력이 없습니다.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

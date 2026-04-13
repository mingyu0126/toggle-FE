import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store as StoreIcon, Play, Pause, Square, AlertTriangle, Clock, Settings, List, Image as ImageIcon, Briefcase, Bell } from 'lucide-react';
import { STATUS_TYPES } from '../constants/status';
import StatusBadge from '../components/common/StatusBadge';
import { logout as logoutRequest } from '../lib/auth';
import { clearAuthSession, getCurrentUser, getRefreshToken } from '../lib/session';
import { createOwnerStoreApplication, fetchMyOwnerStoreApplications, fetchMyOwnerStores, updateOwnerStoreProfile, updateOwnerStoreStatus } from '../lib/owner';
import { getApplicationStatusMeta } from '../lib/ownerApplicationUi';
import styles from './PosWeb.module.css';

const DEFAULT_STORE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1546702958-692ab629c4ba?auto=format&fit=crop&w=400&q=80',
];
const MAX_OWNER_IMAGES = 10;

export default function PosWeb() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [linkedStores, setLinkedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [statusError, setStatusError] = useState('');
  
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD', 'APPLICATION'

  const selectedStore = linkedStores.find((store) => store.storeId === selectedStoreId) || linkedStores[0] || null;
  const displayStoreName = selectedStore?.storeName || currentUser.nickname || '연결 대기 중';
  const displayStoreId = selectedStore?.storeId || currentUser.email || currentUser.id || 'owner';
  
  const [storeStatus, setStoreStatus] = useState(STATUS_TYPES.STORE.CLOSED);
  const [ownerComment, setOwnerCommentState] = useState('');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [breakStart, setBreakStart] = useState('15:00');
  const [breakEnd, setBreakEnd] = useState('17:00');
  
  const [storeImages, setStoreImagesState] = useState(DEFAULT_STORE_IMAGES);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const now = new Date();
    setHistory([{ status: STATUS_TYPES.STORE.CLOSED, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), msg: 'PC 관리자 패널 시작' }]);
    
    let ignore = false;
    async function loadData() {
      try {
        const [stores, apps] = await Promise.all([fetchMyOwnerStores(), fetchMyOwnerStoreApplications()]);
        if (!ignore) {
          setLinkedStores(stores);
          setSelectedStoreId(stores[0]?.storeId ?? null);
          setApplications(apps);
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadData();
    return () => ignore = true;
  }, []);

  useEffect(() => {
    if (selectedStore) {
      setStoreStatus(selectedStore.liveBusinessStatus);
      setOwnerCommentState(selectedStore.ownerNotice || '');
      setStoreImagesState(selectedStore.imageUrls?.length > 0 ? selectedStore.imageUrls : DEFAULT_STORE_IMAGES);
      setOpenTime(selectedStore.openTime || '09:00');
      setCloseTime(selectedStore.closeTime || '21:00');
      setBreakStart(selectedStore.breakStart || '15:00');
      setBreakEnd(selectedStore.breakEnd || '17:00');
    }
  }, [selectedStore]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try { await logoutRequest(refreshToken); } catch {}
    }
    clearAuthSession();
    navigate('/loginweb');
  };

  const logHistory = (status, msg) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [{ status, time: timeStr, msg }, ...prev]);
  };

  const applyStatus = async (nextStatus, message) => {
    if (!selectedStore) return;
    setStatusError('');
    try {
      const updated = await updateOwnerStoreStatus(selectedStore.storeId, { status: nextStatus, comment: ownerComment });
      setStoreStatus(updated.liveBusinessStatus);
      logHistory(updated.liveBusinessStatus, message);
      const stores = await fetchMyOwnerStores();
      setLinkedStores(stores);
    } catch (err) {
      setStatusError(err.message || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))).then((newImages) => {
        setStoreImagesState((prev) => [...prev, ...newImages].slice(0, MAX_OWNER_IMAGES));
      });
    }
  };

  const buildProfilePayload = () => ({
    ownerNotice: ownerComment,
    openTime,
    closeTime,
    breakStart,
    breakEnd,
    imageUrls: (selectedStore?.imageUrls?.length ? storeImages : storeImages.filter((image) => !DEFAULT_STORE_IMAGES.includes(image))).slice(0, MAX_OWNER_IMAGES),
  });

  const syncUpdatedStore = (updatedStore) => {
    setLinkedStores((prev) => prev.map((store) => (
      store.storeId === updatedStore.storeId ? updatedStore : store
    )));
  };

  const handleSaveOperatingHours = async () => {
    if (!selectedStore) {
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedStore = await updateOwnerStoreProfile(selectedStore.storeId, buildProfilePayload());
      syncUpdatedStore(updatedStore);
      logHistory(storeStatus, `운영시간 변경: ${openTime} - ${closeTime} / 휴게 ${breakStart} - ${breakEnd}`);
      alert('운영시간이 서버에 저장되었습니다.');
    } catch (error) {
      alert(error.message || '운영시간 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getBtnClass = (type) => {
    if (storeStatus !== type) return styles.statusBtn;
    if (type === STATUS_TYPES.STORE.BREAK_TIME || type === STATUS_TYPES.STORE.EARLY_CLOSED) return `${styles.statusBtn} ${styles.activeOrange}`;
    if (type === STATUS_TYPES.STORE.TEMP_CLOSED) return `${styles.statusBtn} ${styles.activeRed}`;
    if (type === STATUS_TYPES.STORE.CLOSED) return `${styles.statusBtn} ${styles.activeGray}`;
    return `${styles.statusBtn} ${styles.activeGreen}`;
  };

  return (
    <div className={styles.webContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand} onClick={() => navigate('/mapweb')}>
          <div className={styles.logoIcon}><StoreIcon size={24} /></div>
          <h2>Toggle <span style={{fontWeight: 300}}>POS PC</span></h2>
        </div>

        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${activeTab === 'DASHBOARD' ? styles.navActive : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
            <Settings size={20} /> 대시보드
          </button>
          <button className={`${styles.navItem} ${activeTab === 'APPLICATION' ? styles.navActive : ''}`} onClick={() => setActiveTab('APPLICATION')}>
            <Briefcase size={20} /> 입점 신청 내역
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{currentUser?.nickname?.[0] || 'O'}</div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{currentUser?.nickname || 'Owner'}</div>
              <div className={styles.userEmail}>{currentUser?.email || 'owner@toggle.com'}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}><LogOut size={18} /> 로그아웃</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.storeSelector}>
            {linkedStores.length > 0 ? (
              <select className={styles.selector} value={selectedStoreId || ''} onChange={(e) => setSelectedStoreId(Number(e.target.value))}>
                {linkedStores.map(s => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}
              </select>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>연결된 매장 없음</span>
            )}
            <StatusBadge status={storeStatus} type="STORE" />
          </div>
          <div className={styles.headerRight}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
          </div>
        </header>

        {activeTab === 'DASHBOARD' ? (
        <div className={styles.dashboardGrid}>
          {/* 상태 변경 컨트롤 패널 */}
          <section className={`${styles.card} ${styles.statusCard}`}>
            <h3>실시간 상태 전환</h3>
            <p className={styles.subtext}>현재 상황에 맞추어 매장 상태를 즉각 반영합니다. 토글 지도에 실시간으로 표시됩니다.</p>
            {statusError && <div className={styles.errorBox}>{statusError}</div>}
            
            <div className={styles.statusButtons}>
              <button className={getBtnClass(STATUS_TYPES.STORE.OPEN)} onClick={() => applyStatus(STATUS_TYPES.STORE.OPEN, '정상 영업 시작')} disabled={!selectedStore}>
                <Play size={24} /> 영업 시작
              </button>
              <button className={getBtnClass(STATUS_TYPES.STORE.BREAK_TIME)} onClick={() => applyStatus(STATUS_TYPES.STORE.BREAK_TIME, '브레이크타임 돌입')} disabled={!selectedStore}>
                <Pause size={24} /> 브레이크타임
              </button>
              <button className={getBtnClass(STATUS_TYPES.STORE.CLOSED)} onClick={() => applyStatus(STATUS_TYPES.STORE.CLOSED, '금일 영업 종료')} disabled={!selectedStore}>
                <Square size={24} /> 영업 종료
              </button>
              <button className={getBtnClass(STATUS_TYPES.STORE.EARLY_CLOSED)} onClick={() => applyStatus(STATUS_TYPES.STORE.EARLY_CLOSED, '재료 소진 - 조기 마감')} disabled={!selectedStore}>
                <Clock size={24} /> 조기 마감
              </button>
              <button className={getBtnClass(STATUS_TYPES.STORE.TEMP_CLOSED)} onClick={() => applyStatus(STATUS_TYPES.STORE.TEMP_CLOSED, '긴급 사정 임시 휴무')} disabled={!selectedStore}>
                <AlertTriangle size={24} /> 임시 휴무
              </button>
            </div>

            <div className={styles.divider} />
            
            <div className={styles.commentSection}>
              <h4>📢 사장님 공지 (손님 앱 알림)</h4>
              <div className={styles.commentInputWrap}>
                <input 
                  type="text" 
                  value={ownerComment} 
                  onChange={(e) => setOwnerCommentState(e.target.value)} 
                  placeholder="예) 곧 재료가 소진됩니다! 서둘러 주세요." 
                  className={styles.TextInput}
                />
                <button className={styles.primaryBtn} onClick={async () => {
                  if (!selectedStore) {
                    return;
                  }

                  try {
                    setIsSavingProfile(true);
                    const updatedStore = await updateOwnerStoreProfile(selectedStore.storeId, buildProfilePayload());
                    syncUpdatedStore(updatedStore);
                    logHistory(storeStatus, `공지 업데이트: ${ownerComment}`);
                    alert('공지 정보가 서버에 저장되었습니다.');
                  } catch (error) {
                    alert(error.message || '공지 저장 중 오류가 발생했습니다.');
                  } finally {
                    setIsSavingProfile(false);
                  }
                }} disabled={!selectedStore || isSavingProfile}>반영</button>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.commentSection}>
              <h4>운영시간 관리</h4>
              <div className={styles.commentInputWrap}>
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={styles.TextInput} />
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={styles.TextInput} />
              </div>
              <div className={styles.commentInputWrap}>
                <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className={styles.TextInput} />
                <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className={styles.TextInput} />
              </div>
              <button className={styles.primaryBtn} onClick={handleSaveOperatingHours} disabled={!selectedStore || isSavingProfile}>운영시간 저장</button>
            </div>
          </section>

          {/* 히스토리 로깅 (PC 와이드) */}
          <section className={`${styles.card} ${styles.historyCard}`}>
            <h3 style={{ marginBottom: '1rem' }}><List size={18} style={{marginRight: 6}}/> 금일 작업 로그</h3>
            <div className={styles.historyList}>
              {history.map((log, idx) => (
                <div className={styles.logItem} key={idx}>
                  <time className={styles.logTime}>{log.time}</time>
                  <StatusBadge status={log.status} type="STORE" />
                  <span className={styles.logMsg}>{log.msg}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 새로운 다중 이미지 업로드 섹션 */}
          <section className={`${styles.card} ${styles.fullWidthCard}`}>
            <div className={styles.cardHeader}>
              <h3><ImageIcon size={20} /> 매장 사진첩 관리 (최대 10장)</h3>
              <button className={styles.primaryBtn} onClick={async () => {
                if (!selectedStore) {
                  return;
                }

                try {
                  setIsSavingProfile(true);
                  const updatedStore = await updateOwnerStoreProfile(selectedStore.storeId, buildProfilePayload());
                  syncUpdatedStore(updatedStore);
                  logHistory(storeStatus, `사진 ${storeImages.length}장이 서버에 저장됨`);
                  alert('사진이 서버에 저장되었습니다.');
                } catch (error) {
                  alert(error.message || '사진 저장 중 오류가 발생했습니다.');
                } finally {
                  setIsSavingProfile(false);
                }
              }} disabled={!selectedStore || isSavingProfile}>서버에 저장하기</button>
            </div>
            <p className={styles.subtext}>점주님이 등록하신 이 사진들이 매장 상세 페이지 상단 캐러셀에 아름답게 나타납니다.</p>

            <div className={styles.imageGrid}>
              <label className={styles.uploadBox}>
                <ImageIcon size={32} color="var(--color-primary)" opacity={0.7} />
                <span>PC에서 사진 올리기</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>

              {storeImages.map((img, idx) => (
                <div className={styles.imagePreview} key={idx}>
                  <img src={img} alt={`Preview ${idx}`} />
                  <button className={styles.deleteImgBtn} onClick={() => setStoreImagesState((prev) => prev.filter((_, i) => i !== idx))}>&times;</button>
                </div>
              ))}
            </div>
          </section>
        </div>
        ) : (
          <div className={styles.dashboardGrid} style={{ display: 'block' }}>
            <section className={styles.card}>
              <h3><Briefcase size={20} /> 입점 신청 현황</h3>
              <p className={styles.subtext}>사업자 확인, 지도 검증, 관리자 승인 단계를 한 번에 확인합니다.</p>
              {applications.length === 0 ? (
                <div className={styles.subtext}>아직 제출한 신청이 없습니다.</div>
              ) : (
                <div className={styles.applicationList}>
                  {applications.map((application) => {
                    const meta = getApplicationStatusMeta(application);
                    return (
                      <article key={application.applicationId} className={styles.applicationCard}>
                        <div className={styles.applicationTopRow}>
                          <strong>{application.storeName}</strong>
                          <span className={`${styles.applicationBadge} ${styles[`tone_${meta.tone}`]}`}>{meta.label}</span>
                        </div>
                        <div className={styles.applicationSummary}>{meta.summary}</div>
                        <div className={styles.applicationProgressTrack}>
                          <div className={styles.applicationProgressFill} style={{ width: `${meta.progress}%` }} />
                        </div>
                        <div className={styles.applicationMetaRow}>사업자번호 {application.businessNumber}</div>
                        <div className={styles.applicationMetaRow}>{application.businessAddressRaw}</div>
                        <div className={styles.applicationMetaRow}>사업자 검증 {application.businessVerificationStatus} · 지도 검증 {application.mapVerificationStatus}</div>
                        {application.rejectReason && (
                          <div className={styles.applicationErrorText}>반려 사유: {application.rejectReason}</div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

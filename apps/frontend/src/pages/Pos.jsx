import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store as StoreIcon, Play, Pause, Square, AlertTriangle, Clock, Settings, List, Image as ImageIcon, CheckCircle2, ChevronDown } from 'lucide-react';
import { STATUS_TYPES } from '../constants/status';
import StatusBadge from '../components/common/StatusBadge';
import { logout as logoutRequest } from '../lib/auth';
import { clearAuthSession, getCurrentUser, getRefreshToken } from '../lib/session';
import { createOwnerStoreApplication, fetchMyOwnerStoreApplications, fetchMyOwnerStores, updateOwnerStoreProfile, updateOwnerStoreStatus } from '../lib/owner';
import { getApplicationStatusMeta } from '../lib/ownerApplicationUi';
import styles from './Pos.module.css';

const DEFAULT_STORE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=200&q=80',
];
const MAX_OWNER_IMAGES = 10;

export default function Pos() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [linkedStores, setLinkedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationError, setApplicationError] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    applicationForm: true,
    applicationStatus: true,
  });
  const [isLoadingOwnerData, setIsLoadingOwnerData] = useState(true);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [applicationForm, setApplicationForm] = useState({
    storeName: '',
    businessNumber: '',
    representativeName: '',
    businessOpenDate: '',
    businessAddress: '',
    businessPhone: '',
    businessLicenseFile: null,
  });
  const selectedStore = linkedStores.find((store) => store.storeId === selectedStoreId) || linkedStores[0] || null;
  const displayStoreName = selectedStore?.storeName || currentUser.displayName || currentUser.nickname || '연결 대기 중';
  const displayStoreId = selectedStore?.storeId || currentUser.email || currentUser.id || 'owner';
  const [storeStatus, setStoreStatus] = useState(STATUS_TYPES.STORE.CLOSED);
  const [activePanel, setActivePanel] = useState(null); // 'BREAK_TIME', 'TEMP_CLOSED', 'EARLY_CLOSED'
  
  // 브레이크타임 설정 폼 상태
  const [breakStart, setBreakStart] = useState('15:00');
  const [breakEnd, setBreakEnd] = useState('17:00');
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('21:00');

  // 사장님 실시간 코멘트 상태
  const [ownerComment, setOwnerCommentState] = useState('');
  
  // 프론트엔드 목업 이미지 상태
  const [storeImages, setStoreImagesState] = useState(DEFAULT_STORE_IMAGES);

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

  // 히스토리 초기값 (로그인 즉시 영업중으로 기록됨)
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory([{ status: STATUS_TYPES.STORE.CLOSED, time: timeStr, msg: '포스기 로그인 (인증 완료)' }]);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadOwnerData() {
      try {
        const [stores, myApplications] = await Promise.all([
          fetchMyOwnerStores(),
          fetchMyOwnerStoreApplications(),
        ]);

        if (!ignore) {
          setLinkedStores(stores);
          setSelectedStoreId(stores[0]?.storeId ?? null);
          setApplications(myApplications);
        }
      } catch (error) {
        if (!ignore) {
          setApplicationError(error.message || '점주 데이터를 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingOwnerData(false);
        }
      }
    }

    loadOwnerData();

    return () => {
      ignore = true;
    };
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
      setStatusError('');
    }
  }, [selectedStore]);

  const handleLogout = async () => {
    // 로그아웃 시 자동 영업종료 처리 모의
    alert('POS 로그아웃. 매장 상태가 자동으로 [영업종료] 처리됩니다.');
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Ignore logout API failures, local session must still be cleared.
      }
    }
    clearAuthSession();
    navigate('/login');
  };

  const logHistory = (status, msg) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => [{ status, time: timeStr, msg }, ...prev]);
  };

  const refreshOwnerData = async () => {
    const [stores, myApplications] = await Promise.all([
      fetchMyOwnerStores(),
      fetchMyOwnerStoreApplications(),
    ]);
    setLinkedStores(stores);
    setApplications(myApplications);
    setSelectedStoreId((current) => {
      if (current && stores.some((store) => store.storeId === current)) {
        return current;
      }
      return stores[0]?.storeId ?? null;
    });
    return stores;
  };

  const buildProfilePayload = () => {
    // 필터링 강화: 서버에서 온 실제 이미지가 없는 상태에서만 기본 이미지를 제거
    const filteredImages = storeImages.filter(img => !DEFAULT_STORE_IMAGES.includes(img));
    const finalImages = selectedStore?.imageUrls?.length > 0 ? storeImages : filteredImages;

    return {
      ownerNotice: ownerComment,
      openTime,
      closeTime,
      breakStart,
      breakEnd,
      imageUrls: finalImages.slice(0, MAX_OWNER_IMAGES),
    };
  };

  const syncUpdatedStore = (updatedStore) => {
    setLinkedStores((prev) => prev.map((store) => (
      store.storeId === updatedStore.storeId ? updatedStore : store
    )));
  };

  const applyStoreStatus = async (nextStatus, message, nextActivePanel = null) => {
    if (!selectedStore) {
      return;
    }

    setStatusError('');

    try {
      const updated = await updateOwnerStoreStatus(selectedStore.storeId, {
        status: nextStatus,
        comment: ownerComment,
      });
      setStoreStatus(updated.liveBusinessStatus);
      setActivePanel(nextActivePanel);
      logHistory(updated.liveBusinessStatus, message);
      await refreshOwnerData();
    } catch (error) {
      setStatusError(error.message || '매장 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleStatusClick = (type) => {
    if (type === STATUS_TYPES.STORE.OPEN) {
      applyStoreStatus(type, '영업 재개 처리', null);
    } else if (type === STATUS_TYPES.STORE.CLOSED) {
      applyStoreStatus(type, '영업 종료 처리', null);
    } else {
      setActivePanel(activePanel === type ? null : type);
    }
  };

  const handleApplyBreak = () => {
    applyStoreStatus(STATUS_TYPES.STORE.BREAK_TIME, `브레이크타임 시작 (${breakStart} ~ ${breakEnd})`, null);
  };

  const handleApplyTemp = () => {
    applyStoreStatus(STATUS_TYPES.STORE.TEMP_CLOSED, '긴급 임시휴무 처리', null);
  };

  const handleApplyEarly = () => {
    applyStoreStatus(STATUS_TYPES.STORE.EARLY_CLOSED, '재료소진 등으로 조기마감', null);
  };

  const handleSaveComment = async () => {
    if (!selectedStore) {
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedStore = await updateOwnerStoreProfile(selectedStore.storeId, buildProfilePayload());
      syncUpdatedStore(updatedStore);
      logHistory(storeStatus, `📢 사장님 코멘트 변경: "${ownerComment}"`);
      alert('코멘트가 서버에 저장되었습니다.');
    } catch (error) {
      alert(error.message || '코멘트 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
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
      alert('매장 운영시간이 서버에 저장되었습니다.');
    } catch (error) {
      alert(error.message || '운영시간 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangeApplicationField = (field, value) => {
    setApplicationForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setApplicationError('');
    setIsSubmittingApplication(true);

    try {
      await createOwnerStoreApplication(applicationForm);
      const [stores, myApplications] = await Promise.all([
        fetchMyOwnerStores(),
        fetchMyOwnerStoreApplications(),
      ]);
      setLinkedStores(stores);
      setApplications(myApplications);
      setApplicationForm({
        storeName: '',
        businessNumber: '',
        representativeName: '',
        businessOpenDate: '',
        businessAddress: '',
        businessPhone: '',
        businessLicenseFile: null,
      });
      alert('매장 등록 신청이 접수되었습니다.');
    } catch (error) {
      setApplicationError(error.message || '매장 등록 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingApplication(false);
    }
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
            <div className={styles.storeName}>{displayStoreName}</div>
            <div className={styles.storeId}>Store ID: {displayStoreId}</div>
            {selectedStore && (
              <div className={styles.storeMetaSummary}>
                운영시간 {openTime} - {closeTime}
                <span className={styles.storeMetaDivider}>|</span>
                휴게 {breakStart} - {breakEnd}
              </div>
            )}
          </div>
          <div className={styles.statusWrapper}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>현업 영업 상태 (LIVE)</span>
            <StatusBadge status={storeStatus} type="STORE" className={styles.currentBadge} />
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><StoreIcon size={20} /> 내 매장 연결 현황</h2>
          <div className={styles.settingsPanel}>
            {isLoadingOwnerData ? (
              <p style={{ margin: 0 }}>점주 정보를 불러오는 중입니다...</p>
            ) : linkedStores.length > 0 ? (
              <>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>현재 연결된 매장 {linkedStores.length}개</p>
                <div className={styles.storeSelectorList}>
                  {linkedStores.map((store) => {
                    const isSelected = selectedStore?.storeId === store.storeId;
                    return (
                      <button
                        key={store.linkId}
                        type="button"
                        className={`${styles.storeSelectorCard} ${isSelected ? styles.storeSelectorCardSelected : ''}`}
                        onClick={() => setSelectedStoreId(store.storeId)}
                        aria-pressed={isSelected}
                      >
                        <div className={styles.storeSelectorCardBody}>
                          <div className={styles.storeSelectorText}>
                            <div className={styles.storeSelectorNameRow}>
                              <span className={styles.storeSelectorName}>{store.storeName}</span>
                              {isSelected && (
                                <span className={styles.storeSelectorCheck}>
                                  <CheckCircle2 size={16} />
                                  선택됨
                                </span>
                              )}
                            </div>
                            <div className={styles.storeSelectorAddress}>{store.storeAddress}</div>
                          </div>
                          <StatusBadge status={store.liveBusinessStatus} type="STORE" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>아직 연결된 매장이 없습니다. 아래에서 사업자 등록과 매장 운영 권한을 신청해 주세요.</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Settings size={20} /> 실시간 상태 관리</h2>
          {!selectedStore && (
            <div className={styles.settingsPanel} style={{ marginBottom: '1rem' }}>
              연결된 매장이 아직 없어 상태 변경은 비활성화됩니다.
            </div>
          )}
          {statusError && (
            <div className={styles.settingsPanel} style={{ marginBottom: '1rem', color: '#f87171' }}>
              {statusError}
            </div>
          )}
          <div className={styles.statusGrid}>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.OPEN)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.OPEN)}
              disabled={!selectedStore}
            >
              <Play size={28} /> 영업중 전환
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.BREAK_TIME)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.BREAK_TIME)}
              disabled={!selectedStore}
            >
              <Pause size={28} /> 브레이크타임
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.CLOSED)}
              disabled={!selectedStore}
            >
              <Square size={28} /> 영업 종료
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.EARLY_CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.EARLY_CLOSED)}
              disabled={!selectedStore}
            >
              <Clock size={28} /> 조기 마감
            </button>
            <button 
              className={`${styles.statusBtn} ${getActiveClass(STATUS_TYPES.STORE.TEMP_CLOSED)}`}
              onClick={() => handleStatusClick(STATUS_TYPES.STORE.TEMP_CLOSED)}
              disabled={!selectedStore}
            >
              <AlertTriangle size={28} /> 임시 휴무
            </button>
          </div>

          {/* 브레이크타임 설정 패널 */}
          {activePanel === STATUS_TYPES.STORE.BREAK_TIME && (
            <div className={styles.settingsPanel}>
              <p className={styles.sectionDescription}>
                저장된 브레이크타임 설정을 기준으로 지금 상태를 브레이크타임으로 전환합니다.
              </p>
              <div className={styles.storeMetaSummary}>
                기본 영업 {openTime} - {closeTime}
                <span className={styles.storeMetaDivider}>|</span>
                브레이크 {breakStart} - {breakEnd}
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
          <h2 className={styles.sectionTitle} style={{ color: 'var(--color-primary)' }}>📢 사장님  실시간 코멘트</h2>
          <div className={styles.settingsPanel} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <textarea 
              placeholder="예) 재료가 조기 소진되었습니다!, 오늘 6시까지 영업합니다."
              value={ownerComment}
              onChange={(e) => setOwnerCommentState(e.target.value)}
              className={styles.commentInput}
            />
            <button className={styles.applyBtn} onClick={handleSaveComment} disabled={!selectedStore || isSavingProfile}>코멘트 저장/적용</button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><Clock size={20} /> 매장별 운영시간 관리</h2>
          <div className={styles.settingsPanel}>
            <p className={styles.sectionDescription}>
              선택한 매장 기준으로 운영시간과 브레이크타임을 저장합니다. 저장한 값은 상세 페이지  영업시간 영역에 그대로 노출됩니다.
            </p>
            <div className={styles.formGroup}>
              <label>영업시간</label>
              <div className={styles.timeInputContainer}>
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={styles.timeInput} disabled={!selectedStore} />
                <span>~</span>
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={styles.timeInput} disabled={!selectedStore} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>브레이크타임</label>
              <div className={styles.timeInputContainer}>
                <input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className={styles.timeInput} disabled={!selectedStore} />
                <span>~</span>
                <input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className={styles.timeInput} disabled={!selectedStore} />
              </div>
            </div>
            <button className={styles.applyBtn} type="button" onClick={handleSaveOperatingHours} disabled={!selectedStore || isSavingProfile}>
              운영시간 저장
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeaderWrap} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}><ImageIcon size={20} /> 매장 사진 관리</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>최대 10장</span>
          </div>
          
          <div className={styles.settingsPanel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              <label 
                style={{ 
                  flex: '0 0 80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)'
                }}
              >
                <ImageIcon size={22} style={{ marginBottom: '4px' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>사진 추가</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} title="이미지 추가" />
              </label>

              {storeImages.map((img, idx) => (
                <div key={idx} style={{ flex: '0 0 80px', height: '80px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  <img src={img} alt="store image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setStoreImagesState((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.applyBtn} onClick={async () => {
              if (!selectedStore) {
                return;
              }

              try {
                setIsSavingProfile(true);
                const updatedStore = await updateOwnerStoreProfile(selectedStore.storeId, buildProfilePayload());
                syncUpdatedStore(updatedStore);
                logHistory(storeStatus, `사진 ${storeImages.length}장이 서버에 저장됨`);
                alert('사진 설정이 서버에 저장되었습니다.');
              } catch (error) {
                alert(error.message || '사진 저장 중 오류가 발생했습니다.');
              } finally {
                setIsSavingProfile(false);
              }
            }} disabled={!selectedStore || isSavingProfile}>
              사진 설정 저장하기
            </button>
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

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionAccordionButton}
            onClick={() => toggleSection('applicationForm')}
            aria-expanded={!collapsedSections.applicationForm}
            aria-controls="pos-application-form-panel"
          >
            <span className={styles.sectionAccordionTitle}>
              <List size={20} /> 매장 등록 신청
            </span>
            <span className={styles.sectionAccordionMeta}>
              {collapsedSections.applicationForm ? '입력 폼 열기' : '입력 폼 닫기'}
              <ChevronDown
                size={18}
                className={`${styles.sectionAccordionChevron} ${!collapsedSections.applicationForm ? styles.sectionAccordionChevronExpanded : ''}`}
                aria-hidden="true"
              />
            </span>
          </button>
          {!collapsedSections.applicationForm && (
            <form
              id="pos-application-form-panel"
              className={styles.settingsPanel}
              onSubmit={handleSubmitApplication}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            >
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                대표자명, 개업일자, 실영업주소, 실영업 전화번호까지 입력해야 관리자 검증과 최종 승인이 가능합니다.
              </p>
              <input
                className={styles.timeInput}
                placeholder="상호명"
                value={applicationForm.storeName}
                onChange={(e) => handleChangeApplicationField('storeName', e.target.value)}
                required
              />
              <input
                className={styles.timeInput}
                placeholder="사업자 등록번호 (예: 123-45-67890)"
                value={applicationForm.businessNumber}
                onChange={(e) => handleChangeApplicationField('businessNumber', e.target.value)}
                required
              />
              <input
                className={styles.timeInput}
                placeholder="대표자명"
                value={applicationForm.representativeName}
                onChange={(e) => handleChangeApplicationField('representativeName', e.target.value)}
                required
              />
              <input
                className={styles.timeInput}
                type="date"
                value={applicationForm.businessOpenDate}
                onChange={(e) => handleChangeApplicationField('businessOpenDate', e.target.value)}
                required
              />
              <input
                className={styles.timeInput}
                placeholder="실영업주소"
                value={applicationForm.businessAddress}
                onChange={(e) => handleChangeApplicationField('businessAddress', e.target.value)}
                required
              />
              <input
                className={styles.timeInput}
                placeholder="실영업 전화번호"
                value={applicationForm.businessPhone}
                onChange={(e) => handleChangeApplicationField('businessPhone', e.target.value)}
                inputMode="tel"
                pattern="^[0-9+()\\-\\s]{7,30}$"
                title="전화번호 형식으로 입력해 주세요."
                required
              />
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => handleChangeApplicationField('businessLicenseFile', e.target.files?.[0] || null)}
                required
              />
              {applicationError && <p style={{ color: '#f87171', margin: 0 }}>{applicationError}</p>}
              <button className={styles.applyBtn} type="submit" disabled={isSubmittingApplication}>
                {isSubmittingApplication ? '신청 중...' : '매장 등록 신청하기'}
              </button>
            </form>
          )}
        </section>

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionAccordionButton}
            onClick={() => toggleSection('applicationStatus')}
            aria-expanded={!collapsedSections.applicationStatus}
            aria-controls="pos-application-status-panel"
          >
            <span className={styles.sectionAccordionTitle}>
              <List size={20} /> 내 신청 현황
            </span>
            <span className={styles.sectionAccordionMeta}>
              {applications.length > 0 ? `신청 ${applications.length}건` : '신청 내역 없음'}
              <ChevronDown
                size={18}
                className={`${styles.sectionAccordionChevron} ${!collapsedSections.applicationStatus ? styles.sectionAccordionChevronExpanded : ''}`}
                aria-hidden="true"
              />
            </span>
          </button>
          {!collapsedSections.applicationStatus && (
            <div id="pos-application-status-panel" className={styles.settingsPanel}>
              {applications.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>아직 제출한 신청이 없습니다.</p>
              ) : (
                <div className={styles.applicationList}>
                  {applications.map((application) => (
                    <article key={application.applicationId} className={styles.applicationCard}>
                      {(() => {
                        const meta = getApplicationStatusMeta(application);
                        return (
                          <>
                            <div className={styles.applicationTopRow}>
                              <div className={styles.applicationHeaderText}>
                                <strong>{application.storeName}</strong>
                                <div className={styles.applicationSummary}>{meta.summary}</div>
                              </div>
                              <div className={styles.applicationHeaderMeta}>
                                <span className={`${styles.applicationBadge} ${styles[`tone_${meta.tone}`]}`}>{meta.label}</span>
                              </div>
                            </div>
                            <div className={styles.applicationDetailsStatic}>
                              <div className={styles.applicationProgressTrack}>
                                <div className={styles.applicationProgressFill} style={{ width: `${meta.progress}%` }} />
                              </div>
                              <div className={styles.applicationMetaRow}>진행 메시지 {meta.summary}</div>
                              <div className={styles.applicationMetaRow}>사업자번호 {application.businessNumber}</div>
                              <div className={styles.applicationMetaRow}>{application.businessAddressRaw}</div>
                              <div className={styles.applicationMetaRow}>사업자 검증 {application.businessVerificationStatus} · 지도 검증 {application.mapVerificationStatus}</div>
                              {application.rejectReason && (
                                <div className={styles.applicationErrorText}>반려 사유: {application.rejectReason}</div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

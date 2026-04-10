import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store as StoreIcon, Play, Pause, Square, AlertTriangle, Clock, Settings, List } from 'lucide-react';
import { STATUS_TYPES } from '../constants/status';
import StatusBadge from '../components/common/StatusBadge';
import { logout as logoutRequest } from '../lib/auth';
import { clearAuthSession, getCurrentUser, getRefreshToken } from '../lib/session';
import { createOwnerStoreApplication, fetchMyOwnerStoreApplications, fetchMyOwnerStores, updateOwnerStoreStatus } from '../lib/owner';
import styles from './Pos.module.css';

function getApplicationStatusText(application) {
  if (application.requestStatus === 'APPROVED') return '승인 완료';
  if (application.requestStatus === 'REJECTED') return '반려됨';
  if (application.businessVerificationStatus === 'AUTO_VERIFICATION_UNAVAILABLE') return '사업자 자동 검증 재시도 필요';
  if (application.businessVerificationStatus === 'AUTO_VERIFICATION_FAILED') return '사업자 자동 검증 실패';
  if (application.mapVerificationStatus === 'FAILED') return '카카오 주소 검증 실패';
  if (application.businessVerificationStatus === 'AUTO_VERIFIED' && application.mapVerificationStatus === 'VERIFIED') return '관리자 승인 대기';
  return '검토중';
}

export default function Pos() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [linkedStores, setLinkedStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationError, setApplicationError] = useState('');
  const [isLoadingOwnerData, setIsLoadingOwnerData] = useState(true);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
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
  const displayStoreName = selectedStore?.storeName || currentUser.nickname || '연결 대기 중';
  const displayStoreId = selectedStore?.storeId || currentUser.email || currentUser.id || 'owner';
  const [storeStatus, setStoreStatus] = useState(STATUS_TYPES.STORE.CLOSED);
  const [activePanel, setActivePanel] = useState(null); // 'BREAK_TIME', 'TEMP_CLOSED', 'EARLY_CLOSED'
  
  // 브레이크타임 설정 폼 상태
  const [breakStart, setBreakStart] = useState('15:00');
  const [breakEnd, setBreakEnd] = useState('17:00');

  // 사장님 실시간 코멘트 상태
  const [ownerComment, setOwnerComment] = useState('');

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

  const handleSaveComment = () => {
    logHistory(storeStatus, `📢 사장님 코멘트 변경: "${ownerComment}"`);
    alert('코멘트가 배포되었습니다!');
  };

  const handleChangeApplicationField = (field, value) => {
    setApplicationForm((prev) => ({ ...prev, [field]: value }));
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
                {linkedStores.length > 1 && (
                  <select
                    className={styles.timeInput}
                    value={selectedStore?.storeId ?? ''}
                    onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                  >
                    {linkedStores.map((store) => (
                      <option key={store.linkId} value={store.storeId}>
                        {store.storeName}
                      </option>
                    ))}
                  </select>
                )}
                {linkedStores.map((store) => (
                  <div key={store.linkId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{store.storeName}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{store.storeAddress}</div>
                    </div>
                    <StatusBadge status={store.liveBusinessStatus} type="STORE" />
                  </div>
                ))}
              </>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>아직 연결된 매장이 없습니다. 아래에서 사업자 등록과 매장 운영 권한을 신청해 주세요.</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><List size={20} /> 매장 등록 신청</h2>
          <form className={styles.settingsPanel} onSubmit={handleSubmitApplication} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><List size={20} /> 내 신청 현황</h2>
          <div className={styles.settingsPanel}>
            {applications.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>아직 제출한 신청이 없습니다.</p>
            ) : (
              <div className={styles.applicationList}>
                {applications.map((application) => (
                  <article key={application.applicationId} className={styles.applicationCard}>
                    <div className={styles.applicationTopRow}>
                      <strong>{application.storeName}</strong>
                      <span className={styles.applicationBadge}>{getApplicationStatusText(application)}</span>
                    </div>
                    <div className={styles.applicationMetaRow}>사업자번호 {application.businessNumber} · {application.businessAddressRaw}</div>
                    <div className={styles.applicationMetaRow}>사업자 검증 {application.businessVerificationStatus} · 지도 검증 {application.mapVerificationStatus}</div>
                    {application.rejectReason && (
                      <div className={styles.applicationErrorText}>반려 사유: {application.rejectReason}</div>
                    )}
                  </article>
                ))}
              </div>
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

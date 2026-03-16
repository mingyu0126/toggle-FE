import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, ChevronRight } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  // 'USER' | 'OWNER'
  const [loginType, setLoginType] = useState('USER');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // 추가

  const handleLogin = (e) => {
    e.preventDefault();
    
    // 로컬스토리지 유저 DB 검색
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.id === id && u.password === password && u.type === loginType);

    if (foundUser) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(foundUser)); // 로그인 유저 정보 저장
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true'); // 유지 플래그 시뮬레이션
      }

      if (loginType === 'USER') {
        navigate('/map');
      } else {
        navigate('/pos');
      }
    } else {
      // 초기 테스팅용 예외: 아이디가 'default' 일 때도 패스 가능 백업 가늠
      if (id === 'default' && password === '1234') {
         localStorage.setItem('isLoggedIn', 'true');
         localStorage.setItem('currentUser', JSON.stringify({ id: 'default', nickname: '프리셋유저', type: 'USER', favorites: { stores: [], publics: [] } }));
         navigate('/map');
         return;
      }
      alert('아이디 혹은 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Toggle</h1>
          <p className={styles.subtitle}>실시간으로 연결되는 우리 동네</p>
        </div>

        {/* User Type Toggle */}
        <div className={styles.tabContainer}>
          <div 
            className={styles.tabIndicator} 
            style={{ transform: loginType === 'USER' ? 'translateX(0)' : 'translateX(100%)' }} 
          />
          <div 
            className={`${styles.tab} ${loginType === 'USER' ? styles.active : ''}`}
            onClick={() => setLoginType('USER')}
          >
            <User size={18} /> 일반 사용자
          </div>
          <div 
            className={`${styles.tab} ${loginType === 'OWNER' ? styles.active : ''}`}
            onClick={() => setLoginType('OWNER')}
          >
            <Store size={18} /> 점주 (POS)
          </div>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={`${styles.inputGroup} ${styles.formElement}`}>
            <input
              type="text"
              placeholder={loginType === 'USER' ? "아이디를 입력하세요" : "매장 관리자 ID"}
              className={styles.input}
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
            <User className={styles.inputIcon} size={20} />
          </div>

          <div className={`${styles.inputGroup} ${styles.formElement}`}>
            <input
              type="password"
              placeholder="비밀번호"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className={styles.inputIcon} size={20} />
          </div>

          <div className={`${styles.rememberMeRow} ${styles.formElement}`}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span>로그인 상태 유지</span>
            </label>
          </div>

          <div className={`${styles.footerActions} ${styles.formElement}`}>
            <button type="button" className={styles.actionLink}>아이디/비밀번호 찾기</button>
            <button type="button" className={styles.actionLink} onClick={() => navigate('/signup')}>
              {loginType === 'USER' ? '회원가입' : '점주 가입 신청'}
            </button>
          </div>

          <button 
            type="submit" 
            className={`${styles.submitBtn} ${loginType === 'OWNER' ? styles.ownerBtn : ''} ${styles.formElement}`}
          >
            {loginType === 'USER' ? '로그인' : 'POS Dashboard 접근'} <ChevronRight size={20} strokeWidth={3} />
          </button>
        </form>

        {/* Only show 'Continue without login' for general users, since stores must login */}
        {loginType === 'USER' && (
          <button 
            type="button" 
            className={styles.skipLink}
            onClick={() => navigate('/map')}
          >
            로그인 없이 지도 둘러보기
          </button>
        )}
      </div>
    </div>
  );
}

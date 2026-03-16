import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, ChevronRight, Navigation, Mail } from 'lucide-react';
import styles from './LoginWeb.module.css'; // 디자인 테마 공유

export default function SignupWeb() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('USER'); // 'USER' | 'OWNER'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 로컬스토리지 유저 라이브 싱크
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.id === email)) {
      alert('이미 존재하는 이메일입니다.');
      return;
    }

    const newUser = {
      id: email,
      password,
      nickname: name,
      type: loginType,
      favorites: { stores: [], publics: [] }
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
    navigate('/loginweb');
  };

  return (
    <div className={styles.container}>
      {/* Left Graphic Panel */}
      <div className={styles.graphicPanel}>
        <div className={styles.graphicOverlay} />
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1600" 
          alt="Restaurant and Cafe" 
          className={styles.graphicImage}
        />
        
        <div className={styles.graphicContent}>
          <div className={styles.logoGroup} onClick={() => navigate('/web')}>
            <Store size={36} className={styles.logoIcon} />
            <span className={styles.logoText}>Toggle PC</span>
          </div>
          <h1 className={styles.graphicTitle}>
            {loginType === 'USER' ? '더 빠르고 정확하게, \n당신의 일상을 토글하세요.' : '점주 파트너가 되어 \n매장을 스마트하게 운영하세요.'}
          </h1>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <button className={styles.backBtn} onClick={() => navigate('/web')}>
            <Navigation size={18} /> 홈페이지로
          </button>
          
          <h2 className={styles.formTitle}>{loginType === 'USER' ? '계정 만들기 ✏️' : '점주 파트너 가입 💼'}</h2>
          <p className={styles.formSubtitle}>{loginType === 'USER' ? 'Toggle과 함께 스마트한 이동을 시작하세요.' : 'POS 시스템과 실시간 연동을 준비해 드립니다.'}</p>

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
              <Store size={18} /> 매장 점주
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSignup}>
            <div className={styles.inputWrapper}>
              <label>{loginType === 'USER' ? '이메일 주소' : '매장 관리용 이메일'}</label>
              <div className={styles.inputGroup}>
                <input
                  type="email" placeholder="example@toggle.com" className={styles.input}
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <Mail className={styles.inputIcon} size={20} />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label>{loginType === 'USER' ? '닉네임 / 성함' : '매장명 / 대표자명'}</label>
              <div className={styles.inputGroup}>
                <input
                  type="text" placeholder={loginType === 'USER' ? "홍길동" : "토글가게 대치점"} className={styles.input}
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
                <User className={styles.inputIcon} size={20} />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label>비밀번호</label>
              <div className={styles.inputGroup}>
                <input
                  type="password" placeholder="6자리 이상 입력" className={styles.input}
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <Lock className={styles.inputIcon} size={20} />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label>비밀번호 확인</label>
              <div className={styles.inputGroup}>
                <input
                  type="password" placeholder="비밀번호 재입력" className={styles.input}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                />
                <Lock className={styles.inputIcon} size={20} />
              </div>
            </div>

            <button 
              type="submit" 
              className={`${styles.submitBtn} ${loginType === 'OWNER' ? styles.ownerBtn : ''}`} 
              style={{ marginTop: '1.5rem' }}
            >
              {loginType === 'USER' ? '무료 회원가입' : '점주 가입 완료'} <ChevronRight size={20} strokeWidth={3} />
            </button>
          </form>

          <div className={styles.signupPrompt}>
            이미 계정이 있으신가요? <a onClick={() => navigate('/loginweb')} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>로그인하기</a>
          </div>

          <div className={styles.footerTerms} style={{ marginTop: '3rem' }}>
             가입함으로써 Toggle의 <a href="#">이용약관</a> 및 <a href="#">개인정보 처리방침</a>에 동의하게 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

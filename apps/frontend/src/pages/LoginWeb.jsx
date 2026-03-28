import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, ChevronRight, Navigation } from 'lucide-react';
import styles from './LoginWeb.module.css';

export default function LoginWeb() {
  const navigate = useNavigate();
  // 'USER' | 'OWNER'
  const [loginType, setLoginType] = useState('USER');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginType === 'USER') {
      navigate('/mapweb');
    } else {
      navigate('/pos');
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. Left Graphic Panel */}
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
            실시간으로 연결되는 <br />
            당신의 동네.
          </h1>
          <p className={styles.graphicDesc}>
            포털 지도보다 더 생생하고 빠른 정보를 만나보세요. <br />
            가입 한 번으로 나만의 장소와 길찾기를 모두 연동할 수 있습니다.
          </p>
          
          <div className={styles.testimonial}>
            <div className={styles.avatarGroup}>
              <div className={styles.avatar} style={{backgroundImage: 'url(https://i.pravatar.cc/100?img=1)'}} />
              <div className={styles.avatar} style={{backgroundImage: 'url(https://i.pravatar.cc/100?img=2)', marginLeft: '-15px'}} />
              <div className={styles.avatar} style={{backgroundImage: 'url(https://i.pravatar.cc/100?img=3)', marginLeft: '-15px'}} />
              <div className={styles.avatarCount}>+2K</div>
            </div>
            <p>매달 2천명 이상의 사용자가 새롭게 합류하고 있습니다.</p>
          </div>
        </div>
      </div>

      {/* 2. Right Form Panel (Glassmorphism & Flex Center) */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <button className={styles.backBtn} onClick={() => navigate('/web')}>
            <Navigation size={18} /> 홈페이지로
          </button>
          
          <h2 className={styles.formTitle}>환영합니다 👋</h2>
          <p className={styles.formSubtitle}>계속하려면 로그인해 주세요.</p>

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

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.inputWrapper}>
              <label>아이디</label>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder={loginType === 'USER' ? "아이디를 입력하세요" : "가입하신 매장 ID"}
                  className={styles.input}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                />
                <User className={styles.inputIcon} size={20} />
              </div>
            </div>

            <div className={styles.inputWrapper}>
              <label>비밀번호</label>
              <div className={styles.inputGroup}>
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
            </div>

            <div className={styles.formActions}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>로그인 상태 유지</span>
              </label>
              <a href="#" className={styles.forgotLink}>비밀번호를 잊으셨나요?</a>
            </div>

            <button 
              type="submit" 
              className={`${styles.submitBtn} ${loginType === 'OWNER' ? styles.ownerBtn : ''}`}
            >
              {loginType === 'USER' ? '로그인' : 'POS Dashboard 접근'} <ChevronRight size={20} strokeWidth={3} />
            </button>
          </form>

          {/* Additional Links */}
          <div className={styles.signupPrompt}>
            계정이 없으신가요? <a onClick={() => navigate('/signupweb')} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>회원가입하기</a>
          </div>

          {loginType === 'USER' && (
            <div className={styles.divider}>
              <span>또는</span>
            </div>
          )}

          {loginType === 'USER' && (
             <button 
               className={styles.guestBtn}
               onClick={() => navigate('/mapweb')}
             >
               로그인 없이 지도 둘러보기
             </button>
          )}

          <div className={styles.footerTerms}>
             로그인함으로써 Toggle의 <a href="#">이용약관</a> 및 <a href="#">개인정보 처리방침</a>에 동의하게 됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, ChevronRight, Smile } from 'lucide-react';
import styles from './Signup.module.css';

export default function Signup() {
  const navigate = useNavigate();
  // 'USER' | 'OWNER'
  const [loginType, setLoginType] = useState('USER');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 로컬스토리지 유저 DB 읽기
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 중복 체크
    if (users.some(u => u.id === id)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    // 신규 유저 생성
    const newUser = {
      id,
      password,
      nickname,
      type: loginType, // 'USER' | 'OWNER'
      favorites: { stores: [], publics: [] } 
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('회원가입이 완료되었습니다! 로그인해 주세요.');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Toggle</h1>
          <p className={styles.subtitle}>{loginType === 'USER' ? '새로운 시작, 우리 동네 연결하기' : '점주 파트너가 되어보세요'}</p>
        </div>

        {/* Type Toggle */}
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

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={`${styles.inputGroup} ${styles.formElement}`}>
            <input
              type="text"
              placeholder="닉네임 (또는 매장명)"
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
            <Smile className={styles.inputIcon} size={20} />
          </div>

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

          <div className={`${styles.inputGroup} ${styles.formElement}`}>
            <input
              type="password"
              placeholder="비밀번호 확인"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Lock className={styles.inputIcon} size={20} />
          </div>

          <button 
            type="submit" 
            className={`${styles.submitBtn} ${loginType === 'OWNER' ? styles.ownerBtn : ''} ${styles.formElement}`}
          >
            {loginType === 'USER' ? '가입하기' : '점주 가입 완료'} <ChevronRight size={20} strokeWidth={3} />
          </button>
        </form>

        <button 
          type="button" 
          className={styles.skipLink}
          onClick={() => navigate('/login')}
        >
          이미 계정이 있으신가요? 로그인하기
        </button>
      </div>
    </div>
  );
}

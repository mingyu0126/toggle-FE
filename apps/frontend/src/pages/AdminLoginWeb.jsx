import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ChevronRight, Navigation } from 'lucide-react';
import styles from './AdminLoginWeb.module.css';

export default function AdminLoginWeb() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '1234') {
      navigate('/adminweb');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 className={styles.title}>Toggle <span className={styles.subtitle}>Admin</span></h1>
        </div>

        <p className={styles.desc}>전체 시스템 데이터를 모니터링하는 관리자 공간입니다.</p>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputWrapper}>
            <label className={styles.label}>관리자 비밀번호</label>
            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
              <Lock className={styles.inputIcon} size={20} />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            관리자 모드 진입 <ChevronRight size={20} strokeWidth={3} />
          </button>
        </form>

        <button className={styles.backBtn} onClick={() => navigate('/web')}>
          <Navigation size={16} /> 홈페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}

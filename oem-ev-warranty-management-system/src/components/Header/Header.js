import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { FaUserCircle } from 'react-icons/fa'; // Import a user icon

const Logo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: 'rotate(10deg)' }}
  >
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM13 14V17.5C13 17.7761 12.7761 18 12.5 18H11.5C11.2239 18 11 17.7761 11 17.5V14H9.5C9.22386 14 9 13.7761 9 13.5V12.5C9 12.2239 9.22386 12 9.5 12H11V8.5C11 8.22386 11.2239 8 11.5 8H12.5C12.7761 8 13 8.22386 13 8.5V12H14.5C14.7761 12 15 12.2239 15 12.5V13.5C15 13.7761 14.7761 14 14.5 14H13Z" />
  </svg>
);

const Header = () => {
  const nav = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isLogged, setIsLogged] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handler = () => {
      const user = localStorage.getItem('user');
      setIsLogged(!!user);
    };
    window.addEventListener('storage', handler);
    handler(); // Initial check on mount
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleTheme = () => setIsDark((d) => !d);

  const logout = () => {
    localStorage.removeItem('user');
    setIsLogged(false);
    nav('/');
  };

  const authBtn = isLogged
    ? { txt: 'Đăng xuất', action: logout }
    : { txt: 'Đăng nhập', action: () => nav('/login') };

  const Actions = () => (
    <div className={styles.actions}>
      {isLogged && ( // New: Conditionally render Profile button
        <button
          className={`${styles.btn} ${styles.profileBtn}`}
          onClick={() => nav('/profile')}
        >
          <FaUserCircle style={{ marginRight: '0.5rem' }} />
          Hồ sơ
        </button>
      )}
      <button className={styles.themeToggle} onClick={toggleTheme}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <button className={`${styles.btn} ${styles.auth}`} onClick={authBtn.action}>
        {authBtn.txt}
      </button>
    </div>
  );

  const Drawer = () => (
    <nav className={`${styles.drawer} ${open ? styles.open : ''}`}>
      {isLogged && ( // New: Conditionally render Profile link in drawer
        <button 
          className={`${styles.btn} ${styles.profileBtn}`} 
          onClick={() => { nav('/profile'); setOpen(false); }}
        >
          <FaUserCircle style={{ marginRight: '0.5rem' }} />
          Hồ sơ
        </button>
      )}
      <button className={styles.themeToggle} onClick={() => { toggleTheme(); setOpen(false); }}>
        {isDark ? '☀️' : '🌙'}
      </button>
      <button className={`${styles.btn} ${styles.auth}`} onClick={() => { authBtn.action(); setOpen(false); }}>
        {authBtn.txt}
      </button>
    </nav>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoContainer} onClick={() => nav('/')}>
          <Logo />
          <span>OEM EV Warranty</span>
        </div>
        <Actions />
        <div className={styles.hamburger} onClick={() => setOpen((o) => !o)}>
          <span style={{ transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </div>
      </header>
      <Drawer />
    </>
  );
};

export default Header;
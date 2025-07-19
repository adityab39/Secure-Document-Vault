'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Sidebar.module.scss';

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBtn, setActiveBtn] = useState('home'); // Track active button

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleNav = (route: string, btn: string) => {
    router.push(route);
    setActiveBtn(btn);
    closeSidebar();
  };

  return (
    <>
      <button
        className={`${styles.hamburger} ${isOpen ? styles.active : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? '×' : '☰'}
      </button>

      {isOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>Document Locker</div>
        <nav className={styles.nav}>
          <button
            onClick={() => handleNav('/home', 'home')}
            className={activeBtn === 'home' ? styles.active : ''}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/FavouriteDocument', 'fav')}
            className={activeBtn === 'fav' ? styles.active : ''}
          >
            Favorite Documents
          </button>
          <button
            onClick={() => handleNav('/logout', 'logout')}
            className={activeBtn === 'logout' ? styles.active : ''}
          >
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}

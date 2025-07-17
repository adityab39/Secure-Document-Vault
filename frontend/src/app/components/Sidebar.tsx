'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Sidebar.module.scss';

export default function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger / Close Button */}
      <button
        className={`${styles.hamburger} ${isOpen ? styles.noBg : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? '×' : '☰'}
      </button>

      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>Document Locker</div>
        <nav className={styles.nav}>
          <button onClick={() => { router.push('/home'); closeSidebar(); }} className={styles.active}>Home</button>
          <button onClick={() => { router.push('/FavouriteDocument'); closeSidebar(); }}>Favorite Documents</button>
          <button onClick={() => { router.push('/logout'); closeSidebar(); }}>Logout</button>
        </nav>
      </aside>
    </>
  );
}

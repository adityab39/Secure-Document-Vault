'use client';
import { useRouter } from 'next/navigation';
import styles from '../styles/Homepage.module.scss';

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Document Locker</div>
      <nav className={styles.nav}>
        <button onClick={() => router.push('/home')} className={styles.active}>Home</button>
        <button onClick={() => router.push('/FavouriteDocument')}>Favorite Documents</button>
        <button onClick={() => router.push('/logout')}>Logout</button>
      </nav>
    </aside>
  );
}

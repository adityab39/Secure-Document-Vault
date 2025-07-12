'use client';
import Image from 'next/image';
import styles from '../styles/Homepage.module.scss';
import { useEffect } from 'react';

export default function Homepage() {
  useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Document Locker</div>
        <nav className={styles.nav}>
          <button className={`${styles.active}`}>Home</button>
          <button>Favorite Documents</button>
          <button>Quick Actions</button>
          <button>Help & Support</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.title}>Document Locker Dashboard</h1>
          <Image
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Profile"
            width={40}
            height={40}
            className={styles.profile}
          />
        </div>

        <section>
  <h2 className={styles.sectionTitle}>Recent Files</h2>
  <div className={styles.fileGrid}>
    {[
      {
        title: 'Document 1',
        detail: 'Uploaded on July 5, 2025',
        img: 'https://images.unsplash.com/photo-1722192966983-763c33412758?q=80&w=1542&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        title: 'Document 2',
        detail: 'Shared by Admin',
        img: 'https://images.unsplash.com/photo-1722192966983-763c33412758?q=80&w=1542&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        title: 'Document 3',
        detail: 'Last modified 2 days ago',
        img: 'https://images.unsplash.com/photo-1722192966983-763c33412758?q=80&w=1542&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
    ].map((doc, index) => (
      <div key={index} className={styles.card}>
        <img src={doc.img} alt={doc.title} className={styles.image} />
        <h3 className={styles.cardTitle}>{doc.title}</h3>
        <p className={styles.cardDetail}>{doc.detail}</p>
      </div>
    ))}
  </div>
</section>

{/* All Documents Section */}
<section style={{ marginTop: '3rem' }}>
  <h2 className={styles.sectionTitle}>All Documents (12)</h2>
  <div className={styles.fileGrid}>
    {[
      { title: 'Annual Report', detail: 'Generated May 2025' },
      { title: 'Client Contract', detail: 'Signed by Client A' },
      { title: 'Financial Overview', detail: 'Q2 2025 Summary' },
      { title: 'HR Guidelines', detail: 'Updated in Jan 2025' },
      { title: 'Audit Trail', detail: 'Reviewed by Auditor' },
      { title: 'Meeting Notes', detail: 'From Weekly Sync' },
      { title: 'Lecture Notes', detail: 'From Weekly Sync' },
      { title: 'Drawing Notes', detail: 'From Weekly Sync' },
      { title: 'Class Study', detail: 'From Weekly Sync' },
      { title: 'Opera Class', detail: 'From Weekly Sync' },
    ].map((doc, index) => (
      <div key={index} className={styles.card}>
        <img
          src="https://images.unsplash.com/photo-1722192966983-763c33412758?q=80&w=1542&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt={doc.title}
          className={styles.image}
        />
        <h3 className={styles.cardTitle}>{doc.title}</h3>
        <p className={styles.cardDetail}>{doc.detail}</p>
      </div>
    ))}
  </div>
</section>


      </main>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../utils/axiosInstance';
import Image from 'next/image';
import styles from '../../styles/Homepage.module.scss';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import Sidebar from '../../components/Sidebar';

interface DocumentType {
  typeId: string;
  typeName: string;
  sampleImageUrl?: string;
  enabled: boolean;
}

const DEFAULT_DOCUMENTS: DocumentType[] = [
  { typeId: '1', typeName: 'Birth Certificate', enabled: true },
  { typeId: '2', typeName: 'Driver’s License', enabled: true },
  { typeId: '3', typeName: 'Passport', enabled: true },
  { typeId: '4', typeName: 'Social Security Card', enabled: true },
  { typeId: '5', typeName: 'Academic Certificate', enabled: true },
  { typeId: '6', typeName: 'Green Card / Visa', enabled: true },
  { typeId: '7', typeName: 'Health Insurance Card', enabled: true },
  { typeId: '8', typeName: 'Vaccination Record', enabled: true },
  { typeId: '9', typeName: 'Student ID', enabled: true },
  { typeId: '10', typeName: 'Resume', enabled: true },
];

export default function Homepage() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchDocuments = async () => {
      try {
        const res = await axiosInstance.get('/documents/get');
        const fetched = res.data.documentTypes as DocumentType[];

        const mergedDocs = DEFAULT_DOCUMENTS.map((doc) => {
          const found = fetched.find((f) => f.typeId === doc.typeId);
          return found ? { ...doc, ...found } : doc;
        });

        setDocuments(mergedDocs);
        toast.success('Document types loaded!');
      } catch (err) {
        console.error('Error fetching documents:', err);
        const fallback = DEFAULT_DOCUMENTS.map((doc) => ({ ...doc, sampleImageUrl: '' }));
        setDocuments(fallback);
        toast.error('Failed to load documents, using default');
      } finally {
      setLoading(false); 
     }
    };

    fetchDocuments();
  }, []);

  const handleFileUpload = async (typeId: string, typeName: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf';

    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file); 
      formData.append('typeId', typeId);
      formData.append('typeName', typeName);
      formData.append('userId', localStorage.getItem('userId') || '');

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error("Missing auth token. Please log in again.");
          return;
        }

        const authHeader = `Bearer ${token}`;

        const res = await fetch('https://pytj32n2ma.execute-api.us-east-2.amazonaws.com/dev/documents/add', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        toast.success('Document uploaded successfully!');
      } catch (err) {
        console.error('Upload failed', err);
        toast.error('Upload failed. Try again.');
      }
    };

    fileInput.click();
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* Sidebar */}
      {/* <aside className={styles.sidebar}>
        <div className={styles.logo}>Document Locker</div>
        <nav className={styles.nav}>
          <button className={styles.active}>Home</button>
          <button>Favorite Documents</button>
          <button>Help & Support</button>
        </nav>
      </aside> */}
      {/* <Sidebar /> */}

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
          <h2 className={styles.sectionTitle}>All Documents (10)</h2>
          {loading ? (
            <p style={{ color: 'gray', marginBottom: '1rem' }}>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p style={{ color: 'red', marginBottom: '1rem' }}>
              No documents available — check API or fallback logic.
            </p>
          ) : null}

          <div className={styles.fileGrid}>
            {documents.map((doc) => (
              <div key={doc.typeId} className={styles.card}>
                <img
                  src={
                    doc.sampleImageUrl && doc.sampleImageUrl.trim() !== ''
                      ? doc.sampleImageUrl
                      : 'https://via.placeholder.com/300x200.png?text=Upload+Document'
                  }
                  alt={doc.typeName}
                  className={styles.image}
                  onClick={() => doc.sampleImageUrl && setSelectedDocUrl(doc.sampleImageUrl)}
                />

                <h3 className={styles.cardTitle}>{doc.typeName}</h3>
                <div className={styles.cardActions}>
                  <button
                    className={styles.uploadButton}
                    onClick={() => handleFileUpload(doc.typeId, doc.typeName)}
                  >
                    Add Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Overlay */}
      {selectedDocUrl && (
        <div className={styles.overlay}>
          <button className={styles.closeBtn} onClick={() => setSelectedDocUrl(null)}>
            &times;
          </button>
          <img src={selectedDocUrl} alt="Preview" className={styles.previewImage} />
        </div>
      )}
    </div>
  );
}

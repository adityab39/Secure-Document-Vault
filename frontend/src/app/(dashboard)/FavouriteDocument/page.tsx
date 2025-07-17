'use client';
import { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import styles from '../../styles/FavouriteDocument.module.scss';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function FavouriteDocument() {
  const [docs, setDocs] = useState<any[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosInstance.get('/documents/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const responseData = res.data;
        const extractedDocs = Array.isArray(responseData?.documents)
          ? responseData.documents
          : Array.isArray(responseData)
          ? responseData
          : [];

        setDocs(extractedDocs);
      } catch (error) {
        toast.error("Failed to fetch documents.");
      }
    };

    fetchDocs();
  }, []);

  const handleDownload = async (documentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get(`/documents/download?documentId=${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.delete(`/documents/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { documentId: docId }
      });
      setDocs(docs.filter(doc => doc.documentId !== docId));
      toast.success('Document deleted!');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleEdit = async (doc: any) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('userId', localStorage.getItem('userId') || '');
      formData.append('documentId', doc.documentId);
      formData.append('typeId', doc.typeId);
      formData.append('typeName', newTypeName || doc.typeName);
      formData.append('s3Key', doc.s3Key);

      if (newFile) {
        formData.append('file', newFile);
      }

      await axiosInstance.post('/documents/update', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Updated!');
      setEditId(null);
      setNewTypeName('');
      setNewFile(null);

      const res = await axiosInstance.get('/documents/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedDocs = Array.isArray(res.data?.documents)
        ? res.data.documents
        : res.data;

      setDocs(updatedDocs);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer />
      <h2>Your Uploaded Documents</h2>
      <div className={styles.fileGrid}>
        {docs.map((doc) => (
          <div className={styles.card} key={doc.documentId}>
            <img
              src={doc.fileUrl ? `${doc.fileUrl}?v=${Date.now()}` : 'https://via.placeholder.com/300x200'}
              alt={doc.typeName}
              className={styles.image}
              onClick={() => setPreview(doc.fileUrl)}
            />

            {editId === doc.documentId ? (
              <>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className={styles.editInput}
                  placeholder="Document Name"
                />
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className={styles.editInput}
                />
                <button onClick={() => handleEdit(doc)} disabled={!newFile && newTypeName === doc.typeName}>
                  Save
                </button>
              </>
            ) : (
              <h3 className={styles.cardTitle}>{doc.typeName}</h3>
            )}

            <div className={styles.cardActions}>
              <button onClick={() => handleDownload(doc.documentId)}>Download</button>
              <button onClick={() => handleDelete(doc.documentId)}>Delete</button>
              <button
                onClick={() => {
                  setEditId(doc.documentId);
                  setNewTypeName(doc.typeName);
                  setNewFile(null);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className={styles.overlay} onClick={() => setPreview(null)}>
          <img src={preview} className={styles.previewImage} />
        </div>
      )}
    </div>
  );
}

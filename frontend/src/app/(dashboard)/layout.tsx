import Sidebar from '@/app/components/Sidebar';
import '../globals.css'; // or wherever your styles are

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '0rem' }}>{children}</main>
    </div>
  );
}

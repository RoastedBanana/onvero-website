import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import BounceNotifications from '@/components/dashboard/BounceNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f5f5f5' }}>
      <DashboardSidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      <BounceNotifications />
    </div>
  );
}

import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import BounceNotifications from '@/components/dashboard/BounceNotifications';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationBell from '@/components/ui/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#f5f5f5',
        position: 'relative',
      }}
    >
      <DashboardSidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 40 }}>
        <NotificationBell />
      </div>
      <BounceNotifications />
      <CommandPalette />
    </div>
  );
}

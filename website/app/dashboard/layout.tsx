import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import BounceNotifications from '@/components/dashboard/BounceNotifications';
import CommandPalette from '@/components/ui/CommandPalette';
import NotificationBell from '@/components/ui/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="onv-dashboard"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#e8e8e8',
        position: 'relative',
      }}
    >
      <DashboardSidebar />
      <main style={{ flex: 1, overflowY: 'auto', paddingLeft: 8 }}>{children}</main>
      <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 40 }}>
        <NotificationBell />
      </div>
      <BounceNotifications />
      <CommandPalette />
    </div>
  );
}

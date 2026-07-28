import { PlatformAccessGate } from '@/components/auth/platform-access-gate';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformAccessGate>
      <div className="platform-container">
        {children}
      </div>
    </PlatformAccessGate>
  );
}

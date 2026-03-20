import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { bootstrapRefresh, isReady } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void bootstrapRefresh();
  }, [bootstrapRefresh]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm font-medium text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  return <>{children}</>;
}

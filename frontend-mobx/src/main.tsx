import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider, useStore } from './store/context';
import './index.css';

function Bootstrap({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    void store.bootstrap().finally(() => setOk(true));
  }, [store]);

  if (!ok) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <Bootstrap>
          <App />
        </Bootstrap>
      </BrowserRouter>
    </StoreProvider>
  </React.StrictMode>
);

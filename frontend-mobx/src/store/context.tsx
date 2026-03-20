import { createContext, useContext } from 'react';
import type { AppStore } from './appStore';
import { appStore } from './appStore';

const StoreContext = createContext<AppStore>(appStore);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <StoreContext.Provider value={appStore}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/context';

export const Home = observer(function Home() {
  const store = useStore();

  useEffect(() => {
    if (store.isAuthenticated) {
      void store.loadProfile();
      void store.loadMyBookings();
    }
  }, [store, store.isAuthenticated]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Главная</h1>
      <p className="page-subtitle">
        данные пользователя и бронирований кэшируются в MobX (~1 мин)
      </p>
      {store.profile && (
        <p className="text-sm text-ink-secondary">
          здесь же подтянут профиль: <strong>{store.profile.lastName} {store.profile.firstName}</strong> — тот же запрос
          что на странице «Профиль»
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/profile" className="btn-primary">
          Профиль
        </Link>
      </div>
    </div>
  );
});

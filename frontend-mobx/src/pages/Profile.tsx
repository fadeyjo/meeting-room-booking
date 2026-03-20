import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/context';

function fullName(p: { lastName: string; firstName: string; patronymic?: string | null }) {
  return [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(' ');
}

export const Profile = observer(function Profile() {
  const store = useStore();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    void store.loadProfile();
    void store.loadMyBookings();
  }, [store]);

  const handlePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    if (newPassword !== confirmPassword) {
      setPwdError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('Новый пароль не менее 8 символов');
      return;
    }
    setPwdBusy(true);
    try {
      await store.changePassword({ oldPassword, newPassword, confirmPassword });
      navigate('/login');
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPwdBusy(false);
    }
  };

  if (!store.profile) {
    return <p className="text-ink-tertiary">Загрузка профиля...</p>;
  }

  const me = store.profile;

  return (
    <div className="space-y-8">
      <Link to="/" className="btn-ghost text-sm inline-flex">← На главную</Link>
      <h1 className="page-title">Профиль</h1>

      <div className="card p-6 max-w-lg space-y-2 text-sm">
        <p><span className="text-ink-tertiary">ФИО:</span> {fullName(me)}</p>
        <p><span className="text-ink-tertiary">Email:</span> {me.email}</p>
        <p><span className="text-ink-tertiary">Телефон:</span> {me.phoneNumber}</p>
        <p><span className="text-ink-tertiary">Дата рождения:</span> {me.birth}</p>
        <p><span className="text-ink-tertiary">Должность:</span> {me.position}</p>
        <p><span className="text-ink-tertiary">Роль:</span> {me.role}</p>
      </div>

      <div className="card p-5 max-w-sm border-primary-100 bg-primary-50/40">
        <h2 className="font-semibold text-sm mb-2">Мои бронирования (организатор)</h2>
        <p className="text-xs text-ink-tertiary mb-2">Из кэша MobX: {store.myBookings.length}</p>
        <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
          {store.myBookings.slice(0, 6).map((b) => (
            <li key={b.id} className="truncate">{b.title} · {b.date}</li>
          ))}
        </ul>
      </div>

      <div className="card p-6 max-w-lg">
        <h2 className="font-semibold mb-3">Смена пароля</h2>
        <form onSubmit={handlePwd} className="space-y-3">
          {pwdError && <div className="text-sm text-red-600">{pwdError}</div>}
          <div>
            <label className="input-label">Старый пароль</label>
            <input className="w-full" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="input-label">Новый пароль</label>
            <input className="w-full" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="input-label">Подтверждение</label>
            <input className="w-full" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" disabled={pwdBusy} className="btn-primary">
            {pwdBusy ? '...' : 'Сменить и выйти'}
          </button>
        </form>
      </div>
    </div>
  );
});

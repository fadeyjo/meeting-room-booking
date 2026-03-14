import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, updateUser } from '../api/users';
import type { User, CreateUserDto, UpdateUserDto } from '@shared/types';

const POSITION_OPTIONS = ['Программист', 'Аналитик', 'Конструктор', 'Технолог', 'Руководитель', 'Тестировщик', 'Менеджер'] as const;

const emptyCreateForm: CreateUserDto = {
  email: '',
  phoneNumber: '',
  birth: '',
  lastName: '',
  firstName: '',
  patronymic: '',
  position: POSITION_OPTIONS[0],
  password: '',
  roleName: 'User',
};

export default function Admin() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateUserDto>(emptyCreateForm);

  const loadUsers = () => getUsers(accessToken).then(setUsers).finally(() => setLoading(false));

  useEffect(() => {
    loadUsers();
  }, [accessToken]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Пароль не менее 8 символов');
      return;
    }
    try {
      const created = await createUser(accessToken, form);
      setUsers((prev) => [...prev, created]);
      setShowForm(false);
      setForm(emptyCreateForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError('');
    const body: UpdateUserDto = {
      email: editForm.email,
      lastName: editForm.lastName,
      firstName: editForm.firstName,
      patronymic: editForm.patronymic || undefined,
      position: editForm.position,
      roleName: editForm.roleName,
      firedAt: editForm.firedAt ? new Date().toISOString() : null,
    };
    if (editForm.password.trim()) {
      if (editForm.password.length < 8) {
        setError('Пароль не менее 8 символов');
        return;
      }
      body.password = editForm.password;
    }
    try {
      const updated = await updateUser(accessToken, editing.id, body);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const [editForm, setEditForm] = useState({
    email: '',
    lastName: '',
    firstName: '',
    patronymic: '',
    position: '',
    roleName: 'User' as 'User' | 'Admin',
    password: '',
    firedAt: false,
  });

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({
      email: u.email,
      lastName: u.lastName,
      firstName: u.firstName,
      patronymic: u.patronymic ?? '',
      position: u.position,
      roleName: (u.role === 'Admin' ? 'Admin' : 'User') as 'User' | 'Admin',
      password: '',
      firedAt: !!u.firedAt,
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-sm text-ink-tertiary">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="page-title">Пользователи</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary px-5 py-2.5' : 'btn-primary px-5 py-2.5'}
        >
          {showForm ? 'Отмена' : 'Добавить сотрудника'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateSubmit} className="card p-6 sm:p-8 mb-8 space-y-5 animate-slide-up">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="input-label">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Телефон *</label>
              <input type="tel" required value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Фамилия *</label>
              <input value={form.lastName} required onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Имя *</label>
              <input value={form.firstName} required onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Отчество</label>
              <input value={form.patronymic ?? ''} onChange={(e) => setForm((f) => ({ ...f, patronymic: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Дата рождения *</label>
              <input type="date" required value={form.birth} onChange={(e) => setForm((f) => ({ ...f, birth: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Должность *</label>
              <select
                value={form.position}
                required
                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                className="w-full"
              >
                {POSITION_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Пароль *</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full" />
            </div>
            <div>
              <label className="input-label">Роль</label>
              <select value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value as 'User' | 'Admin' }))} className="w-full">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5">Создать</button>
        </form>
      )}

      {editing && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink-primary/40 p-4" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-md p-6 sm:p-8 shadow-soft-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink-primary mb-5">Изменить сотрудника</h2>
            <form onSubmit={handleEditSubmit} className="space-y-5">
              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
              <div>
                <label className="input-label">Email *</label>
                <input type="email" required value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Фамилия *</label>
                  <input value={editForm.lastName} required onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full" />
                </div>
                <div>
                  <label className="input-label">Имя *</label>
                  <input value={editForm.firstName} required onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full" />
                </div>
              </div>
              <div>
                <label className="input-label">Отчество</label>
                <input value={editForm.patronymic} onChange={(e) => setEditForm((f) => ({ ...f, patronymic: e.target.value }))} className="w-full" />
              </div>
              <div>
                <label className="input-label">Должность *</label>
                <select
                  value={editForm.position}
                  required
                  onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full"
                >
                  {(() => {
                    const opts = [...POSITION_OPTIONS];
                    if (editForm.position && !opts.includes(editForm.position as typeof POSITION_OPTIONS[number])) {
                      opts.push(editForm.position as typeof POSITION_OPTIONS[number]);
                    }
                    return opts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className="input-label">Роль</label>
                <select value={editForm.roleName} onChange={(e) => setEditForm((f) => ({ ...f, roleName: e.target.value as 'User' | 'Admin' }))} className="w-full">
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="input-label">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" minLength={8} className="w-full" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="firedAt" checked={editForm.firedAt} onChange={(e) => setEditForm((f) => ({ ...f, firedAt: e.target.checked }))} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="firedAt" className="text-sm text-ink-secondary">Уволить сотрудника (его нельзя будет добавлять в приглашения)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary px-5 py-2.5">Сохранить</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary px-5 py-2.5">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/50">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-medium text-ink-primary">{u.position} {u.lastName} {u.firstName}</span>
                {u.firedAt && <span className="badge-warning shrink-0">Уволен</span>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="truncate text-sm text-ink-tertiary max-w-[180px]">{u.email}</span>
                <button type="button" onClick={() => openEdit(u)} className="text-primary-600 text-sm font-medium hover:underline">
                  Изменить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

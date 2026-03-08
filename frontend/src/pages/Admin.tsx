import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, updateUser } from '../api/users';
import type { User, CreateUserDto, UpdateUserDto } from '@shared/types';

const emptyCreateForm: CreateUserDto = {
  email: '',
  phoneNumber: '',
  birth: '',
  lastName: '',
  firstName: '',
  patronymic: '',
  position: '',
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

  if (loading) return <div className="text-slate-500">Загрузка...</div>;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Пользователи</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          {showForm ? 'Отмена' : 'Добавить сотрудника'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateSubmit} className="mb-8 p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Телефон *</label>
              <input type="tel" required value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Фамилия *</label>
              <input value={form.lastName} required onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
              <input value={form.firstName} required onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Отчество</label>
              <input value={form.patronymic ?? ''} onChange={(e) => setForm((f) => ({ ...f, patronymic: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата рождения *</label>
              <input type="date" required value={form.birth} onChange={(e) => setForm((f) => ({ ...f, birth: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Должность *</label>
              <input value={form.position} required onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="Программист, Аналитик..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Пароль *</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
              <select value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value as 'User' | 'Admin' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">Создать</button>
        </form>
      )}

      {editing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Изменить сотрудника</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" required value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Фамилия *</label>
                  <input value={editForm.lastName} required onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
                  <input value={editForm.firstName} required onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Отчество</label>
                <input value={editForm.patronymic} onChange={(e) => setEditForm((f) => ({ ...f, patronymic: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Должность *</label>
                <input value={editForm.position} required onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
                <select value={editForm.roleName} onChange={(e) => setEditForm((f) => ({ ...f, roleName: e.target.value as 'User' | 'Admin' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" placeholder="••••••••" minLength={8} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="firedAt" checked={editForm.firedAt} onChange={(e) => setEditForm((f) => ({ ...f, firedAt: e.target.checked }))} className="rounded border-slate-300" />
                <label htmlFor="firedAt" className="text-sm text-slate-700">Уволить сотрудника (его нельзя будет добавлять в приглашения)</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">Сохранить</button>
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <ul className="divide-y divide-slate-200">
          {users.map((u) => (
            <li key={u.id} className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-800">{u.position} {u.lastName} {u.firstName}</span>
                {u.firedAt && <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Уволен</span>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-500 text-sm truncate">{u.email}</span>
                <button type="button" onClick={() => openEdit(u)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Изменить</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

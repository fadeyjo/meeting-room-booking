import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store/context';

export const Login = observer(function Login() {
  const store = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await store.login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="page-title text-xl">Вход (MobX)</h1>
        <p className="page-subtitle mb-6">Тот же backend, другое состояние</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="input-label" htmlFor="em">Email</label>
            <input id="em" className="w-full" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          </div>
          <div>
            <label className="input-label" htmlFor="pw">Пароль</label>
            <input id="pw" className="w-full" value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
});

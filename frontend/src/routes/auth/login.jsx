import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setLogin } from '@/redux/authSlice';
import { login } from '@/services/auth';

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '',
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { redirect } = Route.useSearch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      dispatch(setLogin({ token: data.token, user: data.user }));

      if (redirect) {
        navigate({ to: redirect });
      } else if (data.user?.user_type === 'employee') {
        navigate({ to: '/employee' });
      } else {
        navigate({ to: '/order' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-background shadow-md rounded-xl w-96 space-y-4 border border-border"
      >
        <h2 className="text-2xl font-bold mb-2 text-foreground">Sign In</h2>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-background text-foreground"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-amber-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

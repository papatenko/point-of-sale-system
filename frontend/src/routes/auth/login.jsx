import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { setLogin, setLoading, setError } from '../../redux/authSlice'

export const Route = createFileRoute('/auth/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { isLoading, error, user } = useSelector((state) => state.auth)

  // If already logged in (Redux rehydrated from localStorage), go straight to dashboard.
  useEffect(() => {
    if (user) {
      navigate({ to: '/employee', replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data && data.success === true && data.user) {
        // Persist to localStorage so authSlice can rehydrate on next load.
        localStorage.setItem('user', JSON.stringify(data.user));

        dispatch(setLogin({ user: data.user }));

        // replace:true so the back button doesn't return to login.
        navigate({ to: '/employee', replace: true });
      } else {
        dispatch(setError(data.error || 'Invalid credentials'));
      }
    } catch (err) {
      console.error('Login error:', err);
      dispatch(setError('Connection error. Please try again.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Employee Login</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="employee@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition"
        >
          {isLoading ? 'Checking...' : 'Login'}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Only employees can access this system
        </p>
      </form>
    </div>
  )
}
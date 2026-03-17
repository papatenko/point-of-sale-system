import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    console.log("Login component");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (username === 'admin' && password === '1234') {
      const fakeToken = JSON.stringify({ role: 'manager' });
      localStorage.setItem('token', fakeToken);
      navigate({ to: '/employee' });
    } else {
      alert('User or password incorrect');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded w-96"
      >
        <h2 className="text-xl font-bold mb-4">Login</h2>
        
        {/* Added id, name, and htmlFor for label */}
        <div className="mb-3">
          <label htmlFor="username" className="block mb-1 text-sm font-medium">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="username"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="block mb-1 text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
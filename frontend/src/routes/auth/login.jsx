import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    // 👇 Simula autenticación (reemplaza con tu API real)
    if (username === 'admin' && password === '1234') {
      const fakeToken = 'abc123token'
      localStorage.setItem('token', fakeToken) // Guarda token
      navigate({ to: '/employee' })          // Redirige al dashboard
    } else {
      alert('Usuario o contraseña incorrectos')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleLogin}
        className="p-8 bg-white shadow-md rounded w-96"
      >
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border mb-3 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border mb-3 rounded"
        />
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
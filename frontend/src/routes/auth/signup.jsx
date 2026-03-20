import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setLoading, setError } from '../../redux/authSlice'

export const Route = createFileRoute('/auth/signup')({
  component: SignupComponent,
})

function SignupComponent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)

  const handleSignup = async (e) => {
    e.preventDefault()

    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()
      console.log("Signup response:", data)

      if (data && data.success) {
        // Opcional: guardar usuario
        localStorage.setItem('user', JSON.stringify(data.user))

        // Redirigir después del registro
        navigate({ to: '/employee' })
      } else {
        dispatch(setError(data.error || 'Signup failed'))
      }
    } catch (err) {
      console.error('Signup error:', err)
      dispatch(setError('Connection error. Please try again.'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="p-8 bg-white shadow-md rounded w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            placeholder="employee@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
        >
          {isLoading ? 'Creating...' : 'Sign Up'}
        </button>

        <p
          onClick={() => navigate({ to: '/auth/login' })}
          className="mt-4 text-sm text-blue-600 text-center cursor-pointer"
        >
          Already have an account? Login
        </p>
      </form>
    </div>
  )
}
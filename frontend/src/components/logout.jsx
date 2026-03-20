import { useNavigate } from '@tanstack/react-router'
import { useDispatch } from 'react-redux'
import { setLogout } from '../redux/authSlice'

export default function LogoutButton() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogout = () => {
    // 🧹 limpiar almacenamiento
    localStorage.removeItem('user')

    // 🧠 limpiar redux
    dispatch(setLogout())

    // 🚪 mandar al login
    navigate({ to: '/auth/login' })
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}
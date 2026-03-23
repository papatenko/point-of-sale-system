import { useNavigate } from '@tanstack/react-router';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // 🧹 borrar token
    navigate({ to: '/auth/login' }); 
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
}

export default LogoutButton;
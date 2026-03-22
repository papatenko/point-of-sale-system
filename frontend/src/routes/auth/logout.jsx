// import { useNavigate } from '@tanstack/react-router';

// function LogoutButton() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem('token'); // 🧹 borrar token
//     navigate({ to: '/auth/login' }); 
//   };

//   return (
//     <button
//       onClick={handleLogout}
//       className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
//     >
//       Logout
//     </button>
//   );
// }

// export default LogoutButton;
import { useNavigate } from '@tanstack/react-router';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {

    const userData = JSON.parse(localStorage.getItem('user'));
    localStorage.removeItem('token');


    if (userData?.role === 'employee') {
      navigate({ to: '/employee_home' });
    } else if (userData?.role === 'customer') {
      navigate({ to: '/auth/custumer_login' });
      console.log(user)
    } else {
      navigate({ to: '/auth/login' }); // fallback
    }
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
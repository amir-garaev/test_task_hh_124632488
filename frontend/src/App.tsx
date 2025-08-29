import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, setToken } from "./api";

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const authed = !!getToken();

  const onLogout = () => { 
    setToken(); 
    navigate("/login"); 
  };

  const onLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/resumes"
            className="font-semibold text-lg text-black hover:text-gray-700"
          >
            Resume App
          </Link>

          <nav className="flex items-center gap-3">
            {!onLoginPage && authed && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-gray-800 active:bg-gray-900 transition"
              >
                Выйти
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

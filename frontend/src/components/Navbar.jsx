import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'

export default function Navbar() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Style for nav links — active page gets navy text + underline
  const linkClass = ({ isActive }) =>
    `pb-1 text-sm font-medium transition ${
      isActive
        ? 'text-navy border-b-2 border-navy'
        : 'text-slate-500 hover:text-navy'
    }`

  return (
    <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <span className="text-2xl">🧺</span>
        <span className="font-serif text-2xl font-bold text-navy">Ocupado</span>
      </div>

      {/* Center links */}
      <div className="flex items-center gap-8">
        <NavLink to="/" className={linkClass} end>
          Dashboard
        </NavLink>
        <NavLink to="/my-laundry" className={linkClass}>
          My Laundry
        </NavLink>
        <NavLink to="/about" className={linkClass}>
          About Project
        </NavLink>
        {student?.role === 'admin' && (
          <NavLink to="/admin" className={linkClass}>
            Admin
          </NavLink>
        )}
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">
            {student?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-slate-700">Hi, {student?.name}!</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-red-500 text-sm font-medium hover:underline"
        >
          Logout <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}

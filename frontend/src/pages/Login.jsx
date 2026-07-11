import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Mail, Lock } from 'lucide-react'
import { API } from '../config'
import laundryImg from '../assets/laundry.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const passwordRef = useRef(null)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password })
      login(res.data.student, res.data.token)
      // Admin → admin page, student → dashboard
      if (res.data.student.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center md:justify-start px-6 md:pl-[52%]"
      style={{
        backgroundImage: `url(${laundryImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/40">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧺</span>
            <span className="font-serif text-3xl font-bold text-navy">Ocupado</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Smart laundry for busy lives</p>
        </div>

        <h2 className="text-center font-semibold text-navy text-lg mb-6">
          Sign in to your account
        </h2>

        {/* Email */}
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="email"
            className="w-full border border-slate-300 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            ref={passwordRef}
            type="password"
            className="w-full border border-slate-300 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-navy text-white rounded-xl p-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : 'Login'}
        </button>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 Ocupado. All rights reserved.
        </p>
      </div>
    </div>
  )
}
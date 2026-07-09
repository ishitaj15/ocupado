import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { Mail, Lock } from 'lucide-react'
import { API } from '../config'
import laundryImg from '../assets/laundry.png'

export default function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/api/auth/login`, { email, password })
        login(res.data.student, res.data.token)
      } else {
        const res = await axios.post(`${API}/api/auth/register`, { name, email, password })
        login(res.data.student, res.data.token)
      }
      navigate('/')
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

        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 pb-3 font-semibold transition ${
              isLogin ? 'text-navy border-b-2 border-navy' : 'text-slate-400'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 pb-3 font-semibold transition ${
              !isLogin ? 'text-navy border-b-2 border-navy' : 'text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        {!isLogin && (
          <input
            className="w-full border border-slate-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {/* Email */}
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="email"
            className="w-full border border-slate-300 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="password"
            className="w-full border border-slate-300 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-navy"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-navy text-white rounded-xl p-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <p className="text-center text-slate-500 text-sm">
          {isLogin ? 'New here? ' : 'Already registered? '}
          <span
            className="text-accent font-semibold cursor-pointer hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 Ocupado. All rights reserved.
        </p>
      </div>
    </div>
  )
}
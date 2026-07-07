import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:3000'

export default function Login() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        const res = await axios.post(`${API}/api/auth/login`, { phone })
        login(res.data.student, res.data.token)
      } else {
        const res = await axios.post(`${API}/api/auth/register`, { name, phone })
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Ocupado 🧺
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Hostel Laundry Tracker
        </p>

        {!isLogin && (
          <input
            className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        <input
          className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
        </button>

        <p
          className="text-center text-blue-600 mt-4 cursor-pointer hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Register" : 'Already registered? Login'}
        </p>
      </div>
    </div>
  )
}
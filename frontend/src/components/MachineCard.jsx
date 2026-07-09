import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:3000'

const statusConfig = {
  FREE: { color: 'bg-green-100 border-green-400', badge: 'bg-green-500', label: '🟢 Free' },
  ENGAGED: { color: 'bg-red-100 border-red-400', badge: 'bg-red-500', label: '🔴 Engaged' },
  RESERVED: { color: 'bg-yellow-100 border-yellow-400', badge: 'bg-yellow-500', label: '🟡 Reserved' }
}

export default function MachineCard({ machine, onNotify }) {
  const { token, student } = useAuth()
  const navigate = useNavigate()
  const config = statusConfig[machine.status]

  const handleNotify = async (e) => {
    e.stopPropagation()
    try {
      await axios.post(
        `${API}/api/machines/${machine.id}/waitlist`,
        { studentId: student.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Added to waitlist! We will notify you when machine is free.')
      onNotify && onNotify()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not join waitlist')
    }
  }

  return (
    <div
      className={`border-2 rounded-xl p-5 ${config.color} transition-all duration-300 cursor-pointer hover:shadow-lg`}
      onClick={() => navigate(`/machine/${machine.id}`)}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">{machine.name}</h3>
        <span className={`${config.badge} text-white text-xs px-3 py-1 rounded-full`}>
          {config.label}
        </span>
      </div>

      <p className="text-gray-400 text-xs mb-2">Tap to open machine</p>

      {machine.status !== 'FREE' && (
        <button
          onClick={handleNotify}
          className="w-full mt-2 bg-blue-600 text-white rounded-lg p-2 text-sm font-semibold hover:bg-blue-700 transition"
        >
          🔔 Notify Me When Free
        </button>
      )}

      {machine.status === 'FREE' && (
        <p className="text-green-600 text-sm font-medium mt-2">
          ✅ Tap to start washing
        </p>
      )}
    </div>
  )
}
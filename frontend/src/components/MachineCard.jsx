import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { API } from '../config'
import { Bell, Wrench } from 'lucide-react'

const statusConfig = {
  FREE: { color: 'bg-green-50 border-green-300', badge: 'bg-green-500', label: 'Free' },
  ENGAGED: { color: 'bg-red-50 border-red-300', badge: 'bg-red-500', label: 'Engaged' },
  RESERVED: { color: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-500', label: 'Reserved' },
  MAINTENANCE: { color: 'bg-orange-50 border-orange-300', badge: 'bg-orange-500', label: 'Maintenance' },
}

export default function MachineCard({ machine, onNotify }) {
  const { token, student } = useAuth()
  const navigate = useNavigate()
  const config = statusConfig[machine.status] || statusConfig.FREE

  // Is this machine being used by ME?
  const isMine = machine.status === 'ENGAGED' && machine.currentUserId === student.id

  const handleNotify = async (e) => {
    e.stopPropagation()
    try {
      await axios.post(
        `${API}/api/machines/${machine.id}/waitlist`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Added to waitlist! We\'ll notify you when it\'s free.')
      onNotify && onNotify()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not join waitlist')
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

      {/* This machine is MINE */}
      {isMine && (
        <p className="text-navy text-sm font-semibold mt-2">
          🧺 You're using this machine — tap to manage
        </p>
      )}

      {/* Engaged/Reserved by SOMEONE ELSE → offer notify */}
      {!isMine && (machine.status === 'ENGAGED' || machine.status === 'RESERVED') && (
        <button
          onClick={handleNotify}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg p-2 text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Bell className="w-4 h-4" /> Notify Me When Free
        </button>
      )}

      {/* Free */}
      {machine.status === 'FREE' && (
        <p className="text-green-600 text-sm font-medium mt-2">
          ✅ Tap to start washing
        </p>
      )}

      {/* Maintenance */}
      {machine.status === 'MAINTENANCE' && (
        <p className="text-orange-500 text-sm font-medium mt-2 flex items-center gap-1">
          <Wrench className="w-4 h-4" /> Under maintenance
        </p>
      )}
    </div>
  )
}
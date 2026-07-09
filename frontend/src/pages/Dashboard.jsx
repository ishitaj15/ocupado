import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MachineCard from '../components/MachineCard'
import { API } from '../config'


let socket

export default function Dashboard() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState('')
  const { student, token, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch all machines
  const fetchMachines = async () => {
    try {
      const res = await axios.get(`${API}/api/machines`)
      setMachines(res.data.machines)
    } catch (err) {
      console.error('Failed to fetch machines:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!student) {
      navigate('/login')
      return
    }

    fetchMachines()

    // Connect Socket.io
    socket = io(API)

    // Join personal room for notifications
    socket.emit('join', student.id)

    // Listen for machine status updates
    socket.on('machine-status-update', (data) => {
      setMachines(prev =>
        prev.map(m =>
          m.id === data.machineId
            ? { ...m, status: data.status }
            : m
        )
      )
    })

    // Listen for personal notifications
    socket.on('notification', (data) => {
      setNotification(data.message)
      setTimeout(() => setNotification(''), 10000)
    })

    return () => {
      socket.disconnect()
    }
  }, [student])

  if (!student) return null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Ocupado 🧺</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">Hi, {student.name}!</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="text-red-500 text-sm hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-green-500 text-white text-center py-3 px-6 font-medium">
          🔔 {notification}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Laundry Machines
        </h2>
        <p className="text-gray-500 mb-6">
          Live status updates — no refresh needed
        </p>

        {loading ? (
          <p className="text-center text-gray-500">Loading machines...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {machines.map(machine => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onNotify={fetchMachines}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
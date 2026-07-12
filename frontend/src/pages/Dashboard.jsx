import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MachineCard from '../components/MachineCard'
import Navbar from '../components/Navbar'
import { API } from '../config'
import { WashingMachine, Loader, Users } from 'lucide-react'
import toast from 'react-hot-toast'

let socket

export default function Dashboard() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const { student, token } = useAuth()
  const navigate = useNavigate()

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

  const handleNotify = async () => {
    try {
      await axios.post(
        `${API}/api/waitlist/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("You're in the queue! We'll notify you when a machine is free.")
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not join the queue')
    }
  }

  useEffect(() => {
    if (!student) {
      navigate('/login')
      return
    }
    fetchMachines()

    socket = io(API)
    socket.emit('join', student.id)
    socket.on('machine-status-update', (data) => {
      setMachines((prev) =>
        prev.map((m) => (m.id === data.machineId ? { ...m, status: data.status } : m))
      )
    })

    return () => socket.disconnect()
  }, [student])

  if (!student) return null

  // Real counts from machine data
  const available = machines.filter((m) => m.status === 'FREE').length
  const running = machines.filter((m) => m.status === 'ENGAGED').length
  const reserved = machines.filter((m) => m.status === 'RESERVED').length

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <h1 className="font-serif text-3xl font-bold text-navy mb-1">
          {greeting}, {student.name}! 👋
        </h1>
        <p className="text-slate-500 mb-8">Here's what's happening in your laundry room.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <WashingMachine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{available}</p>
              <p className="text-slate-500 text-sm">Available</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Loader className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{running}</p>
              <p className="text-slate-500 text-sm">In use</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">{reserved}</p>
              <p className="text-slate-500 text-sm">Reserved</p>
            </div>
          </div>
        </div>

        {/* Global notify — only when NO machine is free */}
        {available === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-10 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-navy">All machines are busy right now</p>
              <p className="text-slate-500 text-sm">
                Join the queue and we'll notify you when one frees up.
              </p>
            </div>
            <button
              onClick={handleNotify}
              className="bg-navy text-white rounded-xl px-5 py-3 font-semibold hover:bg-navy-dark transition whitespace-nowrap"
            >
              🔔 Notify me when free
            </button>
          </div>
        ) : (
          <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-10 text-center">
            <p className="text-green-700 font-medium text-sm">
              ✅ A machine is available — tap it below to start washing!
            </p>
          </div>
        )}

        {/* Machines */}
        <h2 className="font-serif text-2xl font-bold text-navy mb-1">Laundry Machines</h2>
        <p className="text-slate-500 mb-6">Live status updates — no refresh needed</p>

        {loading ? (
          <p className="text-center text-slate-500">Loading machines...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
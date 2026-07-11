import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { API } from '../config'
import { Clock, Bell } from 'lucide-react'

let socket

export default function MyLaundry() {
  const { student, token } = useAuth()
  const navigate = useNavigate()

  const [activeWash, setActiveWash] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/students/${student.id}/status`, authHeader)
      setActiveWash(res.data.activeWash)
      setWaitlist(res.data.waitlist)
    } catch (err) {
      toast.error('Failed to load your laundry status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!student) {
      navigate('/login')
      return
    }
    fetchStatus()

    socket = io(API)
    socket.emit('join', student.id)
    socket.on('machine-status-update', () => fetchStatus())
    socket.on('notification', (data) => {
      toast(data.message, { icon: '🔔' })
      fetchStatus()
    })

    return () => socket.disconnect()
  }, [student])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleConfirm = async (machineId) => {
    try {
      await axios.post(`${API}/api/machines/${machineId}/confirm`, {}, authHeader)
      toast.success('Confirmed! The machine is reserved for you.')
      fetchStatus()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not confirm')
    }
  }

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00'
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="font-serif text-3xl font-bold text-navy mb-2">My Laundry</h1>

        {loading ? (
          <p className="text-center text-slate-500">Loading...</p>
        ) : (
          <>
            {/* Active wash */}
            <div>
              <h2 className="font-semibold text-slate-700 mb-3">Active Wash</h2>
              {activeWash ? (
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-navy text-lg">{activeWash.name}</p>
                      <p className="text-slate-500 text-sm">Your wash is running</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-navy">
                        <Clock className="w-5 h-5" />
                        <span className="text-2xl font-bold tabular-nums">
                          {formatTime(new Date(activeWash.ends_at).getTime() - now)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">remaining</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
                  No active wash. Start one from the dashboard.
                </div>
              )}
            </div>

            {/* Waitlist */}
            <div>
              <h2 className="font-semibold text-slate-700 mb-3">Your Queue</h2>
              {waitlist.length > 0 ? (
                <div className="space-y-3">
                  {waitlist.map((w) => (
                    <div
                      key={w.id}
                      className={`bg-white rounded-2xl shadow-md border p-5 ${
                        w.status === 'NOTIFIED' ? 'border-green-400' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy">{w.machine_name}</p>
                          {w.status === 'WAITING' && (
                            <p className="text-slate-500 text-sm">Position #{w.position} in queue</p>
                          )}
                          {w.status === 'NOTIFIED' && (
                            <p className="text-green-600 text-sm font-semibold flex items-center gap-1">
                              <Bell className="w-4 h-4" /> It's your turn! Confirm within 5 minutes.
                            </p>
                          )}
                          {w.status === 'CONFIRMED' && (
                            <p className="text-green-600 text-sm font-semibold">
                              ✅ Reserved for you — go start your wash!
                            </p>
                          )}
                        </div>
                        {w.status === 'NOTIFIED' && (
                          <button
                            onClick={() => handleConfirm(w.machine_id)}
                            className="bg-green-500 text-white rounded-xl px-5 py-2 font-semibold hover:bg-green-600 transition"
                          >
                            Confirm
                          </button>
                        )}
                        {w.status === 'CONFIRMED' && (
                          <button
                            onClick={() => navigate(`/machine/${w.machine_id}`)}
                            className="bg-navy text-white rounded-xl px-5 py-2 font-semibold hover:bg-navy-dark transition"
                          >
                            Start Wash
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400">
                  You're not in any queue.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
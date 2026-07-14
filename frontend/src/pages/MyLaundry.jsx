import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { API } from '../config'
import { Clock, Bell, WashingMachine, ListChecks } from 'lucide-react'

let socket

export default function MyLaundry() {
  const { student, token } = useAuth()
  const navigate = useNavigate()

  const [activeWashes, setActiveWashes] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }
  const softShadow = 'shadow-[0_12px_35px_rgba(0,0,0,0.06)]'

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/students/${student.id}/status`, authHeader)
      setActiveWashes(res.data.activeWashes || [])
      setWaitlist(res.data.waitlist || [])
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

  const windowLeft = (startTimestamp, minutes) => {
    if (!startTimestamp) return null
    const deadline = new Date(startTimestamp).getTime() + minutes * 60 * 1000
    return deadline - now
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-3xl font-bold text-navy mb-1">My Laundry</h1>
        <p className="text-slate-600 mb-8">Your active washes and queue, in one place.</p>

        {loading ? (
          <p className="text-center text-slate-500">Loading...</p>
        ) : (
          <div className="space-y-8">
            {/* Active washes */}
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-orange-500 uppercase tracking-wide mb-3">
                <WashingMachine className="w-4 h-4" />
                Active {activeWashes.length === 1 ? 'Wash' : 'Washes'}
              </h2>
              {activeWashes.length > 0 ? (
                <div className="space-y-3">
                  {activeWashes.map((wash) => {
                    const total = (wash.wash_duration || 30) * 60 * 1000
                    const remaining = new Date(wash.ends_at).getTime() - now
                    const percent = Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)))
                    return (
                      <div
                        key={wash.id}
                        className={`bg-gradient-to-br from-white to-orange-50 rounded-2xl border border-orange-100 p-5 ${softShadow}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                              <WashingMachine className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                              <p className="font-bold text-navy">{wash.name}</p>
                              <p className="text-orange-500 text-sm font-medium">Your wash is running</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 text-navy justify-end">
                              <Clock className="w-4 h-4" />
                              <span className="text-2xl font-bold tabular-nums">
                                {formatTime(remaining)}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs">remaining</p>
                          </div>
                        </div>
                        <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all ease-out duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white/60 rounded-2xl border border-dashed border-cream-dark p-6 text-center text-slate-400">
                  No active wash. Start one from the dashboard.
                </div>
              )}
            </section>

            {/* Queue */}
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold text-warm uppercase tracking-wide mb-3">
                <ListChecks className="w-4 h-4" />
                Your Queue
              </h2>
              {waitlist.length > 0 ? (
                <div className="space-y-3">
                  {waitlist.map((w) => {
                    const isReady = w.status === 'NOTIFIED' || w.status === 'CONFIRMED'
                    const cardStyle = isReady
                      ? 'bg-gradient-to-br from-white to-green-50 border-green-200'
                      : 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200'
                    return (
                      <div
                        key={w.id}
                        className={`rounded-2xl border p-5 ${softShadow} ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            {w.status === 'WAITING' && (
                              <>
                                <p className="font-bold text-navy flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-white text-sm font-bold">
                                    {w.position}
                                  </span>
                                  Waiting for a machine
                                </p>
                                <p className="text-slate-500 text-sm mt-1 ml-9">
                                  You're #{w.position} in line for the next available machine
                                </p>
                              </>
                            )}

                            {w.status === 'NOTIFIED' && (
                              <>
                                <p className="font-bold text-navy">{w.machine_name} is ready! 🎉</p>
                                <p className="text-green-600 text-sm font-semibold flex items-center gap-1 mt-1">
                                  <Bell className="w-4 h-4" />
                                  {windowLeft(w.notified_at, 5) > 0
                                    ? `${formatTime(windowLeft(w.notified_at, 5))} left to confirm`
                                    : 'confirm now'}
                                </p>
                              </>
                            )}

                            {w.status === 'CONFIRMED' && (
                              <>
                                <p className="font-bold text-navy">{w.machine_name} reserved for you ✅</p>
                                <p className="text-green-600 text-sm font-semibold mt-1">
                                  {windowLeft(w.confirmed_at, 3) > 0
                                    ? `${formatTime(windowLeft(w.confirmed_at, 3))} left to start`
                                    : 'start now'}
                                </p>
                              </>
                            )}
                          </div>

                          {w.status === 'NOTIFIED' && (
                            <button
                              onClick={() => handleConfirm(w.machine_id)}
                              className="bg-green-500 text-white rounded-xl px-5 py-2 font-semibold hover:bg-green-600 transition shrink-0 shadow-md shadow-green-200"
                            >
                              Confirm
                            </button>
                          )}
                          {w.status === 'CONFIRMED' && (
                            <button
                              onClick={() => navigate(`/machine/${w.machine_id}`)}
                              className="bg-navy text-white rounded-xl px-5 py-2 font-semibold hover:bg-navy-dark transition shrink-0"
                            >
                              Start Wash
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white/60 rounded-2xl border border-dashed border-cream-dark p-6 text-center text-slate-400">
                  You're not in any queue.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

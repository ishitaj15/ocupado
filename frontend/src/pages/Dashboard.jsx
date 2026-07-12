import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MachineCard from '../components/MachineCard'
import MachineModal from '../components/MachineModal'
import Navbar from '../components/Navbar'
import { API } from '../config'
import { WashingMachine, Loader, Users, MapPin, CheckCircle, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

let socket

export default function Dashboard() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [myWaitlist, setMyWaitlist] = useState([])
  const { student, token } = useAuth()
  const navigate = useNavigate()

  const fetchMachines = async () => {
    try {
      const res = await axios.get(`${API}/api/machines`)
      setMachines(res.data.machines)
      setSelectedMachine((prev) =>
        prev ? res.data.machines.find((m) => m.id === prev.id) || null : null
      )
    } catch (err) {
      console.error('Failed to fetch machines:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/students/${student.id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMyWaitlist(res.data.waitlist || [])
    } catch (err) {
      // non-critical
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
      fetchMyStatus()
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
    fetchMyStatus()

    socket = io(API)
    socket.emit('join', student.id)
    socket.on('machine-status-update', () => {
      fetchMachines()
      fetchMyStatus()
    })
    socket.on('notification', () => fetchMyStatus())

    return () => socket.disconnect()
  }, [student])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!student) return null

  const available = machines.filter((m) => m.status === 'FREE').length
  const running = machines.filter((m) => m.status === 'ENGAGED').length
  const reserved = machines.filter((m) => m.status === 'RESERVED').length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const softShadow = 'shadow-[0_12px_35px_rgba(0,0,0,0.06)]'

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Hero */}
        <div className={`relative rounded-3xl overflow-hidden mb-6 ${softShadow}`}>
          <img
            src="/laundry-hero.png"
            alt="Laundry room"
            className="w-full h-72 object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream via-55% to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-10 pt-4 max-w-xl">
            <h1 className="font-serif text-4xl font-bold text-navy mb-2 whitespace-nowrap">
              {greeting}, {student.name}! 👋
            </h1>
            <p className="text-slate-600 mb-4">Real-time laundry availability at a glance.</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-cream-dark text-warm">
                <MapPin className="w-4 h-4" /> Laundry Room
              </span>
              <span className="text-slate-600">Last updated: just now</span>
              <span className="flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <StatCard shadow={softShadow} icon={<WashingMachine className="w-6 h-6 text-green-600" />} iconBg="bg-green-100" value={available} label="Available" sub="Ready to use" />
          <StatCard shadow={softShadow} icon={<Loader className="w-6 h-6 text-red-500" />} iconBg="bg-red-100" value={running} label="In use" sub="Washing in progress" />
          <StatCard shadow={softShadow} icon={<Users className="w-6 h-6 text-yellow-600" />} iconBg="bg-yellow-100" value={reserved} label="Reserved" sub="Awaiting start" />
        </div>

        {/* Banner */}
        {available > 0 ? (
          <div className={`relative overflow-hidden bg-gradient-to-r from-green-50 to-white border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3 ${softShadow}`}>
            <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Great! Machines are available</p>
              <p className="text-green-700 text-sm">Tap any available machine below to start washing.</p>
            </div>
            <WashingMachine className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 text-green-600 opacity-10" />
          </div>
        ) : (
          <div className={`bg-white rounded-2xl border border-cream-dark p-4 mb-6 flex items-center justify-between gap-4 ${softShadow}`}>
            <div>
              <p className="font-semibold text-navy">All machines are busy right now</p>
              <p className="text-slate-600 text-sm">Join the queue and we'll notify you when one frees up.</p>
            </div>
            <button
              onClick={handleNotify}
              className="bg-navy text-white rounded-xl px-5 py-3 font-semibold hover:bg-navy-dark transition whitespace-nowrap"
            >
              <span className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notify me when free</span>
            </button>
          </div>
        )}

        {/* Machines */}
        <h2 className="font-serif text-2xl font-bold text-navy mb-1">Laundry Machines</h2>
        <p className="text-slate-600 mb-4">Live status updates — no refresh needed</p>

        {loading ? (
          <p className="text-center text-slate-500">Loading machines...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => {
              const myEntry = myWaitlist.find((w) => w.machine_id === machine.id)
              const offeredToMe = myEntry && (myEntry.status === 'NOTIFIED' || myEntry.status === 'CONFIRMED')
              return (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  now={now}
                  shadow={softShadow}
                  offeredToMe={offeredToMe}
                  offerStatus={myEntry?.status}
                  onClick={() => setSelectedMachine(machine)}
                />
              )
            })}
          </div>
        )}
      </div>

      {selectedMachine && (
        <MachineModal
          machine={selectedMachine}
          myWaitlist={myWaitlist}
          onClose={() => setSelectedMachine(null)}
          onAction={() => { fetchMachines(); fetchMyStatus(); }}
        />
      )}
    </div>
  )
}

function StatCard({ icon, iconBg, value, label, sub, shadow }) {
  return (
    <div className={`bg-white rounded-2xl border border-cream-dark p-5 flex items-center gap-4 ${shadow}`}>
      <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-4xl font-bold text-navy leading-none mb-1">{value}</p>
        <p className="text-slate-700 text-sm font-medium">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </div>
  )
}
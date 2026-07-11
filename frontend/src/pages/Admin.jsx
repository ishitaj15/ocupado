import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API } from '../config'
import { Plus, LogOut, Wrench, UserPlus } from 'lucide-react'

export default function Admin() {
  const { student, token, logout } = useAuth()
  const navigate = useNavigate()

  const [machines, setMachines] = useState([])
  const [machineName, setMachineName] = useState('')
  const [loading, setLoading] = useState(false)

  // Add-student form state
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPassword, setSPassword] = useState('')
  const [sLoading, setSLoading] = useState(false)

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const fetchMachines = async () => {
    try {
      const res = await axios.get(`${API}/api/machines`)
      setMachines(res.data.machines)
    } catch (err) {
      toast.error('Failed to load machines')
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [])

  // Create a new machine
  const handleCreateMachine = async () => {
    if (!machineName.trim()) {
      toast.error('Enter a machine name')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/api/machines`, { name: machineName }, authHeader)
      toast.success(`${machineName} created`)
      setMachineName('')
      fetchMachines()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create machine')
    } finally {
      setLoading(false)
    }
  }

  // Add a new student account (Flow B)
  const handleAddStudent = async () => {
    if (!sName.trim() || !sEmail.trim() || !sPassword.trim()) {
      toast.error('Fill all student fields')
      return
    }
    setSLoading(true)
    try {
      await axios.post(
        `${API}/api/auth/register`,
        { name: sName, email: sEmail, password: sPassword },
        authHeader
      )
      toast.success(`Student ${sName} added`)
      setSName('')
      setSEmail('')
      setSPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student')
    } finally {
      setSLoading(false)
    }
  }

  // Toggle maintenance on/off for a machine
  const handleMaintenance = async (machine) => {
    const turnOn = machine.status !== 'MAINTENANCE'
    try {
      await axios.patch(
        `${API}/api/machines/${machine.id}/maintenance`,
        { isMaintenance: turnOn },
        authHeader
      )
      toast.success(turnOn ? `${machine.name} → maintenance` : `${machine.name} → free`)
      fetchMachines()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-navy text-white px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Ocupado Admin</h1>
          <p className="text-slate-300 text-sm">Welcome, {student?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Two forms side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Machine */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <h2 className="font-serif text-xl font-bold text-navy mb-4">Create Machine</h2>
            <input
              className="w-full border border-slate-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Machine name (e.g. Machine 8)"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
            />
            <button
              onClick={handleCreateMachine}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl p-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
            >
              <Plus className="w-5 h-5" /> Add Machine
            </button>
          </div>

          {/* Add Student */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <h2 className="font-serif text-xl font-bold text-navy mb-4">Add Student</h2>
            <input
              className="w-full border border-slate-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Student name"
              value={sName}
              onChange={(e) => setSName(e.target.value)}
            />
            <input
              className="w-full border border-slate-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Email"
              value={sEmail}
              onChange={(e) => setSEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full border border-slate-300 rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Temporary password"
              value={sPassword}
              onChange={(e) => setSPassword(e.target.value)}
            />
            <button
              onClick={handleAddStudent}
              disabled={sLoading}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl p-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" /> Add Student
            </button>
          </div>
        </div>

        {/* Machine list */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h2 className="font-serif text-xl font-bold text-navy mb-4">
            Machines ({machines.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {machines.map((m) => (
              <div key={m.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-navy">{m.name}</p>
                    <span
                      className={`text-xs font-medium ${
                        m.status === 'FREE'
                          ? 'text-green-600'
                          : m.status === 'MAINTENANCE'
                          ? 'text-orange-500'
                          : 'text-red-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMaintenance(m)}
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-2 transition"
                  >
                    <Wrench className="w-3 h-3" />
                    {m.status === 'MAINTENANCE' ? 'Set Free' : 'Maintenance'}
                  </button>
                </div>
                {m.qrUrl ? (
                  <img
                    src={m.qrUrl}
                    alt={`QR for ${m.name}`}
                    className="w-28 h-28 border border-slate-200 rounded-lg"
                  />
                ) : (
                  <p className="text-xs text-slate-400">No QR (older machine)</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { API } from '../config'
import { Plus, LogOut, Wrench, UserPlus, Trash2, Users } from 'lucide-react'

export default function Admin() {
  const { student, token, logout } = useAuth()
  const navigate = useNavigate()

  const [machines, setMachines] = useState([])
  const [students, setStudents] = useState([])
  const [machineName, setMachineName] = useState('')
  const [loading, setLoading] = useState(false)

  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPassword, setSPassword] = useState('')
  const [sLoading, setSLoading] = useState(false)

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }
  const softShadow = 'shadow-[0_12px_35px_rgba(0,0,0,0.06)]'

  const fetchMachines = async () => {
    try {
      const res = await axios.get(`${API}/api/machines`)
      setMachines(res.data.machines)
    } catch (err) {
      toast.error('Failed to load machines')
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/api/students`, authHeader)
      setStudents(res.data.students || [])
    } catch (err) {
      toast.error('Failed to load students')
    }
  }

  useEffect(() => {
    fetchMachines()
    fetchStudents()
  }, [])

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
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student')
    } finally {
      setSLoading(false)
    }
  }

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

  const handleDeleteMachine = async (machine) => {
    if (!window.confirm(`Remove ${machine.name}? This cannot be undone.`)) return
    try {
      await axios.delete(`${API}/api/machines/${machine.id}`, authHeader)
      toast.success(`${machine.name} removed`)
      fetchMachines()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove machine')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const statusColor = (status) =>
    status === 'FREE'
      ? 'text-green-600'
      : status === 'MAINTENANCE'
      ? 'text-orange-500'
      : 'text-red-500'

  return (
    <div className="min-h-screen bg-cream">
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
          <div className={`bg-white rounded-2xl border border-cream-dark p-6 ${softShadow}`}>
            <h2 className="font-serif text-xl font-bold text-navy mb-4">Create Machine</h2>
            <input
              className="w-full border border-cream-dark rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy bg-cream/40"
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
          <div className={`bg-white rounded-2xl border border-cream-dark p-6 ${softShadow}`}>
            <h2 className="font-serif text-xl font-bold text-navy mb-4">Add Student</h2>
            <input
              className="w-full border border-cream-dark rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy bg-cream/40"
              placeholder="Student name"
              value={sName}
              onChange={(e) => setSName(e.target.value)}
            />
            <input
              className="w-full border border-cream-dark rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy bg-cream/40"
              placeholder="Email"
              value={sEmail}
              onChange={(e) => setSEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full border border-cream-dark rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-navy bg-cream/40"
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
        <div className={`bg-white rounded-2xl border border-cream-dark p-6 ${softShadow}`}>
          <h2 className="font-serif text-xl font-bold text-navy mb-4">
            Machines ({machines.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {machines.map((m) => (
              <div key={m.id} className="border border-cream-dark rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-navy">{m.name}</p>
                    <span className={`text-xs font-medium ${statusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMaintenance(m)}
                      className="flex items-center gap-1 text-xs bg-cream hover:bg-cream-dark rounded-lg px-3 py-2 transition"
                    >
                      <Wrench className="w-3 h-3" />
                      {m.status === 'MAINTENANCE' ? 'Set Free' : 'Maintenance'}
                    </button>
                    <button
                      onClick={() => handleDeleteMachine(m)}
                      className="flex items-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-3 py-2 transition"
                      title="Remove machine"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {m.qrUrl ? (
                  <img
                    src={m.qrUrl}
                    alt={`QR for ${m.name}`}
                    className="w-28 h-28 border border-cream-dark rounded-lg bg-white"
                  />
                ) : (
                  <p className="text-xs text-slate-400">No QR</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registered students */}
        <div className={`bg-white rounded-2xl border border-cream-dark p-6 ${softShadow}`}>
          <h2 className="font-serif text-xl font-bold text-navy mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-warm" />
            Registered Students ({students.length})
          </h2>
          {students.length === 0 ? (
            <p className="text-slate-400 text-sm">No students registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-cream-dark">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-cream/60 last:border-0">
                      <td className="py-2 pr-4 font-medium text-navy">{s.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{s.email}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.role === 'admin'
                              ? 'bg-navy text-white'
                              : 'bg-cream text-warm'
                          }`}
                        >
                          {s.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
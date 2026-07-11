import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { API } from '../config'
import { ArrowLeft } from 'lucide-react'

export default function Machine() {
  const { id } = useParams()
  const [machine, setMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { student, token } = useAuth()
  const navigate = useNavigate()

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    if (!student) {
      navigate('/login')
      return
    }
    fetchMachine()
  }, [id])

  const fetchMachine = async () => {
    try {
      const res = await axios.get(`${API}/api/machines`)
      const found = res.data.machines.find((m) => m.id === id)
      setMachine(found || null)
    } catch (err) {
      toast.error('Failed to load machine')
    } finally {
      setLoading(false)
    }
  }

  // Start a wash with the chosen duration
  const startWash = async (duration) => {
    setUpdating(true)
    try {
      await axios.post(`${API}/api/machines/${id}/start-wash`, { duration }, authHeader)
      toast.success(`Wash started for ${duration} minutes`)
      fetchMachine()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start wash')
    } finally {
      setUpdating(false)
    }
  }

  // End the wash (only the current user can)
  const endWash = async () => {
    setUpdating(true)
    try {
      await axios.post(`${API}/api/machines/${id}/end-wash`, {}, authHeader)
      toast.success('Wash ended')
      fetchMachine()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not end wash')
    } finally {
      setUpdating(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    )

  if (!machine)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-500">Machine not found</p>
      </div>
    )

  // Is this machine currently being used by ME?
  const isMine = machine.status === 'ENGAGED' && machine.currentUserId === student.id

  const statusStyle = {
    FREE: 'text-green-600',
    ENGAGED: 'text-red-500',
    RESERVED: 'text-yellow-600',
    MAINTENANCE: 'text-orange-500',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-navy text-sm mb-4 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="font-serif text-2xl font-bold text-navy mb-1">{machine.name}</h1>
        <p className={`text-lg font-semibold mb-6 ${statusStyle[machine.status]}`}>
          {machine.status}
        </p>

        {/* FREE → pick a duration */}
        {machine.status === 'FREE' && (
          <div>
            <p className="text-slate-600 text-sm mb-3">Select wash duration:</p>
            <div className="grid grid-cols-3 gap-3">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => startWash(d)}
                  disabled={updating}
                  className="bg-navy text-white rounded-xl p-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ENGAGED by me → end wash */}
        {isMine && (
          <button
            onClick={endWash}
            disabled={updating}
            className="w-full bg-green-500 text-white rounded-xl p-3 font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            {updating ? 'Please wait...' : 'End My Wash'}
          </button>
        )}

        {/* ENGAGED by someone else */}
        {machine.status === 'ENGAGED' && !isMine && (
          <p className="text-slate-500 text-sm">
            This machine is currently in use. Go back to the dashboard to join the waitlist.
          </p>
        )}

        {/* RESERVED */}
        {machine.status === 'RESERVED' && (
          <p className="text-slate-500 text-sm">
            This machine is reserved for the next person in the queue.
          </p>
        )}

        {/* MAINTENANCE */}
        {machine.status === 'MAINTENANCE' && (
          <p className="text-orange-500 text-sm">This machine is under maintenance.</p>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:3000'

export default function Machine() {
  const { id } = useParams()
  const [machine, setMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const { student, token } = useAuth()
  const navigate = useNavigate()

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
      const found = res.data.machines.find(m => m.id === id)
      if (!found) {
        setMessage('Machine not found')
        return
      }
      setMachine(found)
    } catch (err) {
      setMessage('Failed to load machine')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status) => {
    setUpdating(true)
    try {
      await axios.patch(
        `${API}/api/machines/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(`Machine marked as ${status}`)
      fetchMachine()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  if (!machine) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">{message}</p>
    </div>
  )

  const statusColor = {
    FREE: 'text-green-600',
    ENGAGED: 'text-red-600',
    RESERVED: 'text-yellow-600'
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 text-sm mb-4 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {machine.name}
        </h1>

        <p className={`text-xl font-semibold mb-6 ${statusColor[machine.status]}`}>
          {machine.status === 'FREE' && '🟢 Free'}
          {machine.status === 'ENGAGED' && '🔴 Engaged'}
          {machine.status === 'RESERVED' && '🟡 Reserved'}
        </p>

        {message && (
          <p className="text-blue-600 text-sm mb-4 font-medium">{message}</p>
        )}

        <div className="flex flex-col gap-3">
          {machine.status === 'FREE' && (
            <button
              onClick={() => updateStatus('ENGAGED')}
              disabled={updating}
              className="w-full bg-red-500 text-white rounded-lg p-3 font-semibold hover:bg-red-600 transition disabled:opacity-50"
            >
              {updating ? 'Updating...' : '🔴 Mark as Engaged'}
            </button>
          )}

          {machine.status === 'ENGAGED' && (
            <button
              onClick={() => updateStatus('FREE')}
              disabled={updating}
              className="w-full bg-green-500 text-white rounded-lg p-3 font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {updating ? 'Updating...' : '🟢 Mark as Free'}
            </button>
          )}

          {machine.status === 'RESERVED' && (
            <button
              onClick={() => updateStatus('ENGAGED')}
              disabled={updating}
              className="w-full bg-red-500 text-white rounded-lg p-3 font-semibold hover:bg-red-600 transition disabled:opacity-50"
            >
              {updating ? 'Updating...' : '🔴 I am here — Mark Engaged'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { API } from '../config'
import { X } from 'lucide-react'

export default function MachineModal({ machine, myWaitlist = [], onClose, onAction }) {
  const { student, token } = useAuth()
  const navigate = useNavigate()
  const [updating, setUpdating] = useState(false)

  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const startWash = async (duration) => {
    setUpdating(true)
    try {
      await axios.post(`${API}/api/machines/${machine.id}/start-wash`, { duration }, authHeader)
      toast.success(`Wash started for ${duration} minutes`)
      onAction && onAction()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start wash')
    } finally {
      setUpdating(false)
    }
  }

  const endWash = async () => {
    setUpdating(true)
    try {
      await axios.post(`${API}/api/machines/${machine.id}/end-wash`, {}, authHeader)
      toast.success('Wash ended')
      onAction && onAction()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not end wash')
    } finally {
      setUpdating(false)
    }
  }

  const isMine = machine.status === 'ENGAGED' && machine.currentUserId === student.id
  const isMyReservation = machine.status === 'RESERVED' && machine.currentUserId === student.id

  // Is this machine offered (NOTIFIED) or reserved (CONFIRMED) to me via my queue entry?
  const myEntry = myWaitlist.find((w) => w.machine_id === machine.id)
  const offeredToMe = myEntry && (myEntry.status === 'NOTIFIED' || myEntry.status === 'CONFIRMED')

  const statusStyle = {
    FREE: 'text-green-600',
    ENGAGED: 'text-red-500',
    RESERVED: 'text-yellow-600',
    MAINTENANCE: 'text-orange-500',
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-7 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center p-1.5">
            <img src="/machine.png" alt="Washing machine" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy">{machine.name}</h2>
            <p className={`text-sm font-semibold ${statusStyle[machine.status]}`}>
              {machine.status}
            </p>
          </div>
        </div>

        <div className="mt-5">
          {/* FREE or RESERVED-for-me (by machine data) → pick duration */}
          {(machine.status === 'FREE' || isMyReservation) && (
            <div>
              {isMyReservation && (
                <p className="text-green-600 text-sm font-semibold mb-3">
                  This machine is reserved for you. Start your wash:
                </p>
              )}
              {machine.status === 'FREE' && (
                <p className="text-slate-600 text-sm mb-3">Select wash duration:</p>
              )}
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

          {/* Offered/reserved to ME via my queue entry → point to My Laundry */}
          {offeredToMe && !isMyReservation && !isMine && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-semibold mb-1">This machine is for you! 🎉</p>
              <p className="text-green-700 text-sm mb-3">
                Head to My Laundry to {myEntry?.status === 'CONFIRMED' ? 'start your wash' : 'confirm your spot'}.
              </p>
              <button
                onClick={() => navigate('/my-laundry')}
                className="bg-green-500 text-white rounded-xl px-5 py-2 font-semibold hover:bg-green-600 transition"
              >
                Go to My Laundry
              </button>
            </div>
          )}

          {/* ENGAGED by someone else */}
          {machine.status === 'ENGAGED' && !isMine && (
            <p className="text-slate-500 text-sm">
              This machine is currently in use. Close this and tap "Notify me when free" to join the queue.
            </p>
          )}

          {/* RESERVED for someone else (not offered to me) */}
          {machine.status === 'RESERVED' && !isMyReservation && !offeredToMe && (
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
    </div>
  )
}
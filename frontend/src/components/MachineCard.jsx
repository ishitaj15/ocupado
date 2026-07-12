import { useAuth } from '../context/AuthContext'
import { Wrench, Play, ArrowRight } from 'lucide-react'

const statusConfig = {
  FREE: { badge: 'bg-green-100 text-green-700', border: 'border-slate-200', label: 'Free' },
  ENGAGED: { badge: 'bg-red-100 text-red-600', border: 'border-red-200', label: 'In Use' },
  RESERVED: { badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-300', label: 'Reserved' },
  MAINTENANCE: { badge: 'bg-orange-100 text-orange-700', border: 'border-orange-300', label: 'Maintenance' },
}

export default function MachineCard({ machine, now = Date.now(), shadow = '', onClick, offeredToMe = false, offerStatus }) {
  const { student } = useAuth()
  const config = statusConfig[machine.status] || statusConfig.FREE

  const isMine =
    (machine.status === 'ENGAGED' || machine.status === 'RESERVED') &&
    machine.currentUserId === student.id

  // Progress + remaining time for engaged machines
  let percent = 0
  let minsLeft = 0
  if (machine.status === 'ENGAGED' && machine.endsAt && machine.washDuration) {
    const totalMs = machine.washDuration * 60 * 1000
    const remainingMs = new Date(machine.endsAt).getTime() - now
    minsLeft = Math.max(0, Math.ceil(remainingMs / 60000))
    percent = Math.min(100, Math.max(0, Math.round(((totalMs - remainingMs) / totalMs) * 100)))
  }

  return (
    <div
      className={`bg-white border rounded-2xl p-5 ${config.border} ${shadow} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-cream flex items-center justify-center p-2 shadow-inner">
            <img src="/machine.png" alt="Washing machine" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-lg font-bold text-navy">{machine.name}</h3>
        </div>
        <span className={`${config.badge} text-xs px-3 py-1 rounded-full font-medium`}>
          {config.label}
        </span>
      </div>

      {/* FREE */}
      {machine.status === 'FREE' && (
        <>
          <p className="text-green-600 text-sm font-medium flex items-center gap-1 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Ready to use
          </p>
          <button className="w-full bg-green-50 text-green-700 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition">
            <Play className="w-4 h-4" /> Start Wash
          </button>
        </>
      )}

      {/* ENGAGED — progress bar + remaining */}
      {machine.status === 'ENGAGED' && (
        <>
          <p className="text-red-500 text-sm font-medium flex items-center gap-1 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {isMine ? "You're washing" : 'Washing in progress'}
          </p>
          <p className="text-slate-500 text-sm mb-2">{minsLeft} min remaining</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full transition-all ease-out duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{percent}%</p>
        </>
      )}

      {/* RESERVED */}
      {machine.status === 'RESERVED' && (
        <>
          {offeredToMe ? (
            <>
              <p className="text-green-600 text-sm font-semibold flex items-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Reserved for you 🎉
              </p>
              <p className="text-slate-500 text-sm mb-3">
                {offerStatus === 'CONFIRMED' ? 'Tap to start your wash' : 'Tap to confirm your spot'}
              </p>
              <button className="w-full bg-green-50 text-green-700 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition">
                {offerStatus === 'CONFIRMED' ? 'Start Wash' : 'Confirm'} <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <p className="text-yellow-600 text-sm font-medium flex items-center gap-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> Reserved
              </p>
              <p className="text-slate-500 text-sm mb-3">Awaiting start</p>
              <button className="w-full bg-yellow-50 text-yellow-700 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-yellow-100 transition">
                View Machine <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </>
      )}

      {/* MAINTENANCE */}
      {machine.status === 'MAINTENANCE' && (
        <p className="text-orange-500 text-sm font-medium flex items-center gap-1">
          <Wrench className="w-4 h-4" /> Under maintenance
        </p>
      )}
    </div>
  )
}
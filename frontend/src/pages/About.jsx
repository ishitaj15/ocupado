import Navbar from '../components/Navbar'
import {
  Activity, Users, ShieldCheck, TrendingUp, Clock, RefreshCw,
  QrCode, Layers, Bell, Lock,
} from 'lucide-react'

export default function About() {
  const architecture = ['React', 'Node.js', 'Socket.io', 'Redis', 'PostgreSQL']

  const techStack = [
    ['Frontend', 'React, Tailwind CSS'],
    ['Backend', 'Node.js, Express.js'],
    ['Real-time', 'Socket.io'],
    ['Database', 'PostgreSQL'],
    ['Queue', 'Redis, BullMQ'],
    ['Auth', 'JWT, Bcrypt'],
  ]

  const highlights = [
    { icon: Activity, title: 'Real-time Updates', desc: 'Live machine status pushed instantly via WebSockets' },
    { icon: Users, title: 'Global Fair Queue', desc: 'One waitlist ordered by join time, served first-come-first-served' },
    { icon: ShieldCheck, title: 'Deadlock-free', desc: 'Eligible-user logic skips blocked people so the queue never stalls' },
    { icon: TrendingUp, title: 'Async Job Queue', desc: 'BullMQ + Redis run every timer as a durable job that survives restarts' },
  ]

  const features = [
    { icon: Activity, title: 'Live Machine Status', desc: 'Real-time status of every machine with progress and time remaining' },
    { icon: Users, title: 'Global Waitlist', desc: 'Join one queue and see your live position for the next free machine' },
    { icon: Bell, title: 'Two-phase Timeout', desc: '5 minutes to confirm an offer, then 3 minutes to start your wash' },
    { icon: RefreshCw, title: 'Auto Re-allocation', desc: 'If you miss the window, the machine passes to the next eligible person' },
    { icon: Clock, title: 'Wash Timers & Alerts', desc: 'Countdown timers with a 5-minute warning before your wash ends' },
    { icon: Layers, title: 'Dead Letter Queue', desc: 'Failed jobs retry with exponential backoff, then move to a DLQ' },
    { icon: Lock, title: 'Roles & Limits', desc: 'Admin/student roles, JWT-secured actions, 2-machine-per-user cap' },
    { icon: QrCode, title: 'QR Deep-links', desc: 'Each machine has a QR code that opens its page for quick access' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Heading */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy mb-1">About Ocupado</h1>
          <p className="text-slate-600">A real-time laundry queue management system for hostels.</p>
        </div>

        {/* Project Overview + highlights */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy mb-3">Project Overview</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ocupado eliminates wasted trips to the laundry room. It shows live machine
              availability, lets students join a single global queue, and fairly allocates the
              next free machine using an asynchronous job queue. When a machine frees up, the
              system offers it to the next eligible person, gives them a timed window to confirm
              and start, and automatically passes it along if they don't — all in real time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center shrink-0">
                  <h.icon className="w-5 h-5 text-warm" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm">{h.title}</p>
                  <p className="text-slate-500 text-xs">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture + Tech Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Architecture */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-cream-dark p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
            <h2 className="font-serif text-xl font-bold text-navy mb-5">System Architecture</h2>
            <div className="flex flex-wrap items-center gap-2">
              {architecture.map((tech, i) => (
                <div key={tech} className="flex items-center gap-2">
                  <div className="bg-cream border border-cream-dark rounded-xl px-4 py-3 text-sm font-semibold text-navy">
                    {tech}
                  </div>
                  {i < architecture.length - 1 && <span className="text-warm">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 inline-block bg-navy text-white rounded-xl px-4 py-3 text-sm font-semibold">
              BullMQ — Background Job Processing
            </div>
            <p className="text-slate-600 text-xs mt-3 leading-relaxed">
              The React client talks to a Node/Express API over REST and receives live updates over
              Socket.io. Time-based work — waitlist offers, confirm/start timeouts, auto-release, and
              wash-end warnings — is offloaded to BullMQ workers backed by Redis, so the API stays
              fast and the timers survive restarts. Failed jobs retry with exponential backoff and
              land in a Dead Letter Queue for inspection.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
            <h2 className="font-serif text-xl font-bold text-navy mb-5">Tech Stack</h2>
            <div className="space-y-3">
              {techStack.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm gap-2">
                  <span className="font-semibold text-navy">{label}</span>
                  <span className="text-slate-500 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-2xl border border-cream-dark p-6 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
          <h2 className="font-serif text-xl font-bold text-navy mb-5">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="border border-cream-dark rounded-xl p-4 hover:shadow-md transition">
                <div className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center mb-2">
                  <f.icon className="w-5 h-5 text-warm" />
                </div>
                <p className="font-semibold text-navy text-sm mb-1">{f.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © 2026 Ocupado. Built by Ishita.
        </p>
      </div>
    </div>
  )
}

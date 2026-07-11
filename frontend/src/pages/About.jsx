import Navbar from '../components/Navbar'
import { Activity, Users, ShieldCheck, TrendingUp } from 'lucide-react'

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
    { icon: Activity, title: 'Real-time Updates', desc: 'Live machine status and instant notifications' },
    { icon: Users, title: 'Smart Queue', desc: 'Join a queue and get notified when it\'s your turn' },
    { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'JWT authentication and secure data handling' },
    { icon: TrendingUp, title: 'Scalable System', desc: 'Async job queue built for concurrent load' },
  ]

  const features = [
    ['Machine Status', 'Check real-time status of all machines'],
    ['Queue System', 'Join a queue and see your position'],
    ['Confirmations', 'Get notified and confirm your turn'],
    ['Real-time Alerts', 'Get notified before your wash ends'],
    ['Admin Panel', 'Manage machines and students easily'],
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Heading */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy mb-1">About Ocupado</h1>
          <p className="text-slate-500">A real-time laundry management system for students.</p>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy mb-3">Project Overview</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Ocupado helps students find and use laundry machines in real time. It shows live
              machine status, lets users join queues, sends notifications when a machine frees up,
              and manages fair one-by-one allocation using an asynchronous job queue.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <h.icon className="w-5 h-5 text-navy" />
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
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-serif text-xl font-bold text-navy mb-5">System Architecture</h2>
            <div className="flex flex-wrap items-center gap-2">
              {architecture.map((tech, i) => (
                <div key={tech} className="flex items-center gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy">
                    {tech}
                  </div>
                  {i < architecture.length - 1 && <span className="text-slate-400">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 inline-block bg-navy text-white rounded-xl px-4 py-3 text-sm font-semibold">
              BullMQ — Queue Management
            </div>
            <p className="text-slate-500 text-xs mt-3">
              Requests hit the Node API; heavy work (waitlist notifications, timers) is offloaded to
              BullMQ background workers backed by Redis, keeping responses fast.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-serif text-xl font-bold text-navy mb-5">Tech Stack</h2>
            <div className="space-y-3">
              {techStack.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="font-semibold text-navy">{label}</span>
                  <span className="text-slate-500 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-serif text-xl font-bold text-navy mb-5">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(([title, desc]) => (
              <div key={title} className="border border-slate-200 rounded-xl p-4">
                <p className="font-semibold text-navy text-sm mb-1">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © 2025 Ocupado. Built for students.
        </p>
      </div>
    </div>
  )
}
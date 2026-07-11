import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import MyLaundry from './pages/MyLaundry'
import Admin from './pages/Admin'
import About from './pages/About'
import Machine from './pages/Machine'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { student } = useAuth()
  if (!student) return <Navigate to="/login" />
  return children
}

function AdminRoute({ children }) {
  const { student } = useAuth()
  if (!student) return <Navigate to="/login" />
  if (student.role !== 'admin') return <Navigate to="/" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/machine/:id" element={
        <ProtectedRoute><Machine /></ProtectedRoute>
      } />
      <Route path="/my-laundry" element={
        <ProtectedRoute><MyLaundry /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><Admin /></AdminRoute>
      } />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
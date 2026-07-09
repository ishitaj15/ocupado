import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import MyLaundry from './pages/MyLaundry'
import Admin from './pages/Admin'
import About from './pages/About'
import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { student } = useAuth()
  if (!student) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/my-laundry" element={
        <ProtectedRoute><MyLaundry /></ProtectedRoute>
      } />
      <Route path="/admin" element={<Admin />} />
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
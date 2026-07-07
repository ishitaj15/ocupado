import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Machine from './pages/Machine'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/machine/:id" element={<Machine />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
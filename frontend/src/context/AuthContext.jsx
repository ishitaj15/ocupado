import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(
    JSON.parse(localStorage.getItem('student')) || null
  )
  const [token, setToken] = useState(
    localStorage.getItem('token') || null
  )

  const login = (studentData, tokenData) => {
    setStudent(studentData)
    setToken(tokenData)
    localStorage.setItem('student', JSON.stringify(studentData))
    localStorage.setItem('token', tokenData)
  }

  const logout = () => {
    setStudent(null)
    setToken(null)
    localStorage.removeItem('student')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ student, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
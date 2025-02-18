import { createContext, useContext, useState, useEffect } from 'react'
import { userApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const response = await userApi.getProfile()
      setUser(response.data.user)
    } catch (error) {
      console.error('Error loading user:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    const response = await userApi.login(credentials)
    const { token, user } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    navigate('/')
    return user
  }

  const register = async (userData) => {
    const response = await userApi.register(userData)
    const { token, user } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    navigate('/')
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const updateProfile = async (profileData) => {
    const response = await userApi.updateProfile(profileData)
    setUser(response.data)
    return response.data
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth 
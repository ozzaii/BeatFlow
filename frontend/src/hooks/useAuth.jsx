import { createContext, useContext, useState, useEffect } from 'react'
import { userApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await userApi.getProfile()
          setUser(response.data.user)
        } catch (error) {
          console.error('Error loading user:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const response = await userApi.login(credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      navigate('/')
      return user
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await userApi.register(userData)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      navigate('/')
      return user
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await userApi.updateProfile(profileData)
      setUser(response.data)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  if (loading) {
    return null // or return a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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
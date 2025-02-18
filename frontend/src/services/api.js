import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Beat related API calls
export const beatApi = {
  getBeats: (page = 1, limit = 10, genre = '') => {
    return api.get(`/beats?page=${page}&limit=${limit}${genre ? `&genre=${genre}` : ''}`)
  },
  
  getBeat: (id) => {
    return api.get(`/beats/${id}`)
  },
  
  createBeat: (beatData) => {
    return api.post('/beats', beatData)
  },
  
  updateBeat: (id, beatData) => {
    return api.patch(`/beats/${id}`, beatData)
  },
  
  deleteBeat: (id) => {
    return api.delete(`/beats/${id}`)
  },
  
  likeBeat: (id) => {
    return api.post(`/beats/${id}/like`)
  },
  
  commentOnBeat: (id, text) => {
    return api.post(`/beats/${id}/comments`, { text })
  }
}

// User related API calls
export const userApi = {
  register: (userData) => {
    return api.post('/users/register', userData)
  },
  
  login: (credentials) => {
    return api.post('/users/login', credentials)
  },
  
  getProfile: () => {
    return api.get('/users/profile')
  },
  
  updateProfile: (profileData) => {
    const formData = new FormData()
    Object.keys(profileData).forEach(key => {
      formData.append(key, profileData[key])
    })
    return api.patch('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  followUser: (userId) => {
    return api.post(`/users/${userId}/follow`)
  },
  
  getFavorites: () => {
    return api.get('/users/favorites')
  },
  
  toggleFavorite: (beatId) => {
    return api.post(`/users/favorites/${beatId}`)
  }
}

// Socket connection for real-time features
let socket = null

export const connectSocket = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
  socket = io(socketUrl, {
    auth: {
      token
    }
  })
  
  socket.on('connect', () => {
    console.log('Connected to socket server')
  })
  
  socket.on('disconnect', () => {
    console.log('Disconnected from socket server')
  })
  
  return socket
}

export const getSocket = () => socket

export default api 
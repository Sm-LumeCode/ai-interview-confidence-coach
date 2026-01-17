const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('user')
  if (user) {
    const userData = JSON.parse(user)
    return userData.token || null
  }
  return null
}

// Helper function to create headers with auth token
const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (includeAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

export const api = {
  // ==================== Authentication ====================
  
  checkUserExists: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Check user exists error:', error)
      throw error
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  signup: async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username, email, password }),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(true),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  },

  // ==================== Questions ====================
  
  getQuestions: async (category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${category}`, {
        method: 'GET',
        headers: getHeaders(),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Get questions error:', error)
      throw error
    }
  },

  // ==================== Evaluation ====================

evaluateAnswer: async (question, answer, keywords = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        question, 
        answer,
        keywords 
      }),
    })
    return handleResponse(response)
  } catch (error) {
    console.error('Evaluate answer error:', error)
    throw error
  }
},

  // ==================== Progress & Statistics ====================
  
  getUserProgress: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/progress/${userId}`, {
        method: 'GET',
        headers: getHeaders(true),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Get user progress error:', error)
      throw error
    }
  },

  getCategoryProgress: async (userId, category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/progress/${userId}/${category}`, {
        method: 'GET',
        headers: getHeaders(true),
      })
      return handleResponse(response)
    } catch (error) {
      console.error('Get category progress error:', error)
      throw error
    }
  },
}

export default api
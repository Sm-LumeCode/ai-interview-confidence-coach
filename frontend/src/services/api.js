export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const bundledQuestionFiles = import.meta.glob('../data/questions/*.json', {
  import: 'default',
})

const DEFAULT_TIMEOUT_MS = 15000
const QUESTION_TIMEOUT_MS = 10000
const LONG_AI_TIMEOUT_MS = 90000

const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check that the backend is responding.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

const parseApiError = async (response, fallback) => {
  try {
    const data = await response.json()
    return data.detail || fallback
  } catch {
    return fallback
  }
}

const normalizeQuestions = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.questions)) return data.questions
  return []
}

const getBundledQuestions = async (category) => {
  const key = `../data/questions/${category}.json`
  const loadQuestions = bundledQuestionFiles[key]
  if (!loadQuestions) return []
  return normalizeQuestions(await loadQuestions())
}

const api = {
  // Get questions by category
  getQuestions: async (category, retries = 1) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/questions/${category}`, {}, QUESTION_TIMEOUT_MS)
      if (!response.ok) {
        throw new Error(await parseApiError(response, `Failed to fetch questions: ${response.statusText}`))
      }
      return normalizeQuestions(await response.json())
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed, retrying... (${retries} left)`, err)
        // Wait 1 second before retrying
        await new Promise(res => setTimeout(res, 1000))
        return api.getQuestions(category, retries - 1)
      }

      const bundledQuestions = await getBundledQuestions(category)
      if (bundledQuestions.length > 0) {
        console.warn(`Using bundled questions for ${category} because the backend request failed.`, err)
        return bundledQuestions
      }

      throw err
    }
  },

  // Evaluate user's answer (FAST - returns scores immediately)
  evaluateAnswer: async (question, answer, keywords = []) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        keywords
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to evaluate answer')
    }
    
    return response.json()
  },

  // Generate AI feedback (SEPARATE - called after scores are shown)
  generateFeedback: async (question, answer, keywords = [], scores = {}) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/generate-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        keywords,
        scores
      })
    }, LONG_AI_TIMEOUT_MS)
    
    if (!response.ok) {
      throw new Error('Failed to generate feedback')
    }
    
    return response.json()
  },

  // Generate ideal answer for a question
  generateIdealAnswer: async (question, keywords = []) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/generate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        keywords
      })
    }, LONG_AI_TIMEOUT_MS)
    
    if (!response.ok) {
      throw new Error('Failed to generate ideal answer')
    }
    
    return response.json()
  },

  signup: async ({ email, password, fullName }) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Registration failed.'))
    }

    return response.json()
  },

  login: async ({ email, password }) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Login failed.'))
    }

    return response.json()
  },

  listAuthUsers: async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/users`)
    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Failed to load users.'))
    }
    return response.json()
  },

  userExists: async (email) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/user-exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Failed to verify account.'))
    }

    return response.json()
  },

  sendOtp: async (email) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Failed to send verification code.'))
    }

    return response.json()
  },

  verifyOtp: async ({ email, otp }) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Invalid verification code.'))
    }

    return response.json()
  },

  resetPassword: async ({ email, password }) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error(await parseApiError(response, 'Password reset failed.'))
    }

    return response.json()
  }
}

export default api

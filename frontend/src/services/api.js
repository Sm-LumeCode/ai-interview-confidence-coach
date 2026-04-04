const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api'

const api = {
  // Get questions by category
  getQuestions: async (category, retries = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${category}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`)
      }
      return await response.json()
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed, retrying... (${retries} left)`, err)
        // Wait 1 second before retrying
        await new Promise(res => setTimeout(res, 1000))
        return api.getQuestions(category, retries - 1)
      }
      throw err
    }
  },

  // Evaluate user's answer (FAST - returns scores immediately)
  evaluateAnswer: async (question, answer, keywords = []) => {
    const response = await fetch(`${API_BASE_URL}/evaluate`, {
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
    const response = await fetch(`${API_BASE_URL}/generate-feedback`, {
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
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate feedback')
    }
    
    return response.json()
  },

  // Generate ideal answer for a question
  generateIdealAnswer: async (question, keywords = []) => {
    const response = await fetch(`${API_BASE_URL}/generate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        keywords
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate ideal answer')
    }
    
    return response.json()
  }
}

export default api
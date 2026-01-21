const API_BASE_URL = 'http://localhost:8000/api'

const api = {
  // Get questions by category
  getQuestions: async (category) => {
    const response = await fetch(`${API_BASE_URL}/questions/${category}`)
    if (!response.ok) {
      throw new Error('Failed to fetch questions')
    }
    return response.json()
  },

  // Evaluate user's answer
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
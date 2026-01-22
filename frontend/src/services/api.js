const API_BASE_URL = 'http://localhost:8000/api'

const api = {
  // Get questions by category
  getQuestions: async (category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${category}`)
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      return response.json()
    } catch (error) {
      console.error('Get questions error:', error)
      throw error
    }
  },

  // Evaluate user's answer
  evaluateAnswer: async (question, answer, keywords = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          answer: answer,
          keywords: keywords
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Evaluation failed:', errorText)
        throw new Error(`Evaluation failed: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Evaluate answer error:', error)
      throw error
    }
  },

  // Generate ideal answer for a question
  generateIdealAnswer: async (question, keywords = []) => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          keywords: keywords
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Generate answer failed:', errorText)
        throw new Error(`Generate answer failed: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Generate ideal answer error:', error)
      throw error
    }
  }
}

export default api
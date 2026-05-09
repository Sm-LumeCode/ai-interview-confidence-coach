import api from '../services/api'

// Save a question for review later
export const saveForReview = async (userId, questionData) => {
  if (!userId || userId.startsWith('guest_')) {
    // For guest users, just save in localStorage
    const saved = JSON.parse(localStorage.getItem(`saved_review_${userId}`) || '[]')
    const exists = saved.find(q => q.question === questionData.question)
    if (!exists) {
      saved.push({ ...questionData, savedAt: new Date().toISOString() })
      localStorage.setItem(`saved_review_${userId}`, JSON.stringify(saved))
    }
    return { status: 'saved_local' }
  }

  try {
    const response = await api.saveImprovementQuestion({
      email: userId,
      ...questionData
    })
    
    // Also update local cache
    const saved = JSON.parse(localStorage.getItem(`saved_review_${userId}`) || '[]')
    const exists = saved.find(q => q.question === questionData.question)
    if (!exists) {
      saved.push({ ...questionData, savedAt: new Date().toISOString() })
      localStorage.setItem(`saved_review_${userId}`, JSON.stringify(saved))
    }
    
    return response
  } catch (err) {
    console.error("Failed to save improvement question:", err)
    throw err
  }
}

// Get all saved review questions
export const getSavedReviewQuestions = async (userId) => {
  if (!userId) return []
  
  if (userId.startsWith('guest_')) {
    return JSON.parse(localStorage.getItem(`saved_review_${userId}`) || '[]')
  }

  try {
    const data = await api.getImprovementQuestions(userId)
    const questions = Object.values(data || {})
    localStorage.setItem(`saved_review_${userId}`, JSON.stringify(questions))
    return questions
  } catch (err) {
    console.error("Failed to fetch saved questions:", err)
    return JSON.parse(localStorage.getItem(`saved_review_${userId}`) || '[]')
  }
}

// Auto-save a weak performance question
export const saveWeakQuestion = async (userId, questionData) => {
  if (!userId || userId.startsWith('guest_')) return

  try {
    await api.saveWeakQuestion({
      email: userId,
      ...questionData,
      reason: 'low_score'
    })
  } catch (err) {
    console.error("Failed to save weak question:", err)
  }
}

// Get weak performance questions
export const getWeakQuestions = async (userId) => {
  if (!userId || userId.startsWith('guest_')) return []

  try {
    const data = await api.getWeakQuestions(userId)
    return Object.values(data || {})
  } catch (err) {
    console.error("Failed to fetch weak questions:", err)
    return []
  }
}

// Get AI recommendations
export const getRecommendations = async (userId) => {
  if (!userId || userId.startsWith('guest_')) {
    return ["Core Fundamentals", "Problem Solving", "Communication Skills"]
  }

  try {
    const data = await api.getRecommendations(userId)
    return data.recommendations || []
  } catch (err) {
    console.error("Failed to fetch recommendations:", err)
    return ["General Interview Prep"]
  }
}

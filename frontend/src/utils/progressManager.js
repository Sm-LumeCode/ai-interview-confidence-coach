// Save user progress for a specific category
export const saveProgress = (userId, category, questionIndex, totalQuestions) => {
  if (userId && userId.startsWith('guest_')) return // Skip saving for guest users
  const progressKey = `progress_${userId}_${category}`
  const progress = {
    currentQuestionIndex: questionIndex,
    totalQuestions: totalQuestions,
    lastUpdated: new Date().toISOString()
  }
  localStorage.setItem(progressKey, JSON.stringify(progress))
}

// Get user progress for a specific category
export const getProgress = (userId, category) => {
  const progressKey = `progress_${userId}_${category}`
  const saved = localStorage.getItem(progressKey)
  if (saved) {
    return JSON.parse(saved)
  }
  return null
}

// Reset progress for a category
export const resetProgress = (userId, category) => {
  const progressKey = `progress_${userId}_${category}`
  localStorage.removeItem(progressKey)
}

// Get all progress for a user
export const getAllProgress = (userId) => {
  const allProgress = {}
  const categories = [
    'software_development', 
    'data_analytics', 
    'data_science_ml', 
    'cloud_devops', 
    'cybersecurity',
    'hr_round'
  ]
  
  categories.forEach(category => {
    const progress = getProgress(userId, category)
    if (progress) {
      allProgress[category] = progress
    }
  })
  
  return allProgress
}
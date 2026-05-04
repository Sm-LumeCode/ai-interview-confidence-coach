const normalizeCategory = (category) =>
  category.replace(/&/g, '').replace(/\s+/g, '_').toLowerCase()

export const saveCategoryProgress = (
  userId,
  category,
  technicalScore,
  confidenceScore
) => {
  if (userId && userId.startsWith('guest_')) return // Skip saving for guest users
  const key = `category_progress_${userId}_${normalizeCategory(category)}`

  const existing = localStorage.getItem(key)

  let data
  if (existing) {
    data = JSON.parse(existing)
    data.completed += 1
    data.technicalScores.push(technicalScore)
    data.confidenceScores.push(confidenceScore)
  } else {
    data = {
      category,
      completed: 1,
      technicalScores: [technicalScore],
      confidenceScores: [confidenceScore]
    }
  }

  localStorage.setItem(key, JSON.stringify(data))
}

export const getCategoryProgress = (userId, category) => {
  const key = `category_progress_${userId}_${normalizeCategory(category)}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}
export const CATEGORY_TOTALS = {
  'Software Development': 831,
  'Data & Analytics': 340,
  'Data Science & ML': 355,
  'Cloud & DevOps': 212,
  'Cybersecurity': 343,
  'HR Round': 205
}

export const saveCategoryProgress = (
  userId,
  category,
  technicalScore,
  confidenceScore
) => {
  const key = `category_progress_${userId}_${category}`

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
  const key = `category_progress_${userId}_${category}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

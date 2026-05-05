// utils/categoryProgressManager.js
import api from '../services/api'

const normalizeCategory = (category) =>
  category.replace(/&/g, '').replace(/\s+/g, '_').toLowerCase()

export const saveCategoryProgress = (
  userId,
  category,
  technicalScore,
  confidenceScore
) => {
  if (userId && userId.startsWith('guest_')) return // Skip saving for guest users
  const normalized = normalizeCategory(category)
  const key = `category_progress_${userId}_${normalized}`

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

  // Sync to backend
  api.saveCategoryProgress(userId, normalized, technicalScore, confidenceScore)
    .catch(e => console.error("Failed to sync category progress:", e))
}

export const getCategoryProgress = (userId, category) => {
  const key = `category_progress_${userId}_${normalizeCategory(category)}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

export const getAllCategoryProgress = (userId) => {
  const categories = [
    'software_development',
    'data_analytics',
    'data_science_ml',
    'cloud_devops',
    'cybersecurity',
    'hr_round'
  ]
  const all = {}
  categories.forEach(cat => {
    const data = getCategoryProgress(userId, cat)
    if (data) all[cat] = data
  })
  return all
}

export const syncCategoryProgressFromBackend = async (userId) => {
  if (!userId || userId.startsWith('guest_')) return
  try {
    const data = await api.getCategoryProgress(userId)
    if (data) {
      Object.keys(data).forEach(cat => {
        const key = `category_progress_${userId}_${cat}`
        localStorage.setItem(key, JSON.stringify(data[cat]))
      })
    }
  } catch (err) {
    console.error("Failed to sync category progress from backend:", err)
  }
}
export const CATEGORY_TOTALS = {
  'Software Development': 831,
  'Data & Analytics': 340,
  'Data Science & ML': 355,
  'Cloud & DevOps': 212,
  'Cybersecurity': 343,
  'HR Round': 205
}

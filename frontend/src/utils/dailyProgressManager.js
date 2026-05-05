// utils/dailyProgressManager.js
import api from '../services/api'

const getTodayKey = (userId) => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `daily_progress_${userId}_${today}`
}

export const saveDailyProgress = (
  userId,
  { technicalScore, confidenceScore }
) => {
  if (userId && userId.startsWith('guest_')) return // Skip saving for guest users
  const today = new Date().toISOString().split('T')[0]
  const key = getTodayKey(userId)

  const existing = localStorage.getItem(key)
  let data

  if (existing) {
    data = JSON.parse(existing)

    data.technicalScores.push(technicalScore)
    data.confidenceScores.push(confidenceScore)

    // increment question count
    data.questionCount = (data.questionCount || 0) + 1
  } else {
    data = {
      date: today,
      technicalScores: [technicalScore],
      confidenceScores: [
        typeof confidenceScore === 'number' ? confidenceScore : 0
      ],
      questionCount: 1,
      didPractice: true
    }
  }

  localStorage.setItem(key, JSON.stringify(data))
  
  // Sync to backend asynchronously
  api.saveDailyProgress(userId, today, technicalScore, typeof confidenceScore === 'number' ? confidenceScore : 0)
    .catch(e => console.error("Failed to sync daily progress:", e))
}

export const getDailyProgress = (userId, date) => {
  const key = `daily_progress_${userId}_${date}`
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : null
}

// Get progress timeline from Day 1 to today
export const getDailyProgressTimeline = (userId) => {
  const timeline = []

  const startKey = `daily_progress_start_${userId}`
  let startDate = localStorage.getItem(startKey)

  // If first time, set today as Day 1
  if (!startDate) {
    startDate = new Date().toISOString().split('T')[0]
    localStorage.setItem(startKey, startDate)
  }

  const start = new Date(startDate)
  const today = new Date()

  for (
    let d = new Date(start);
    d <= today;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = d.toISOString().split('T')[0]
    const saved = localStorage.getItem(`daily_progress_${userId}_${dateStr}`)

    if (saved) {
      const parsed = JSON.parse(saved)

      const avgTechnical =
        parsed.technicalScores.reduce((a, b) => a + b, 0) /
        parsed.technicalScores.length

      const confidenceArr = Array.isArray(parsed.confidenceScores)
        ? parsed.confidenceScores
        : [0]

      const avgConfidence =
        confidenceArr.reduce((a, b) => a + b, 0) /
        confidenceArr.length

      timeline.push({
        date: dateStr,
        technicalScore: Math.round(avgTechnical),
        confidenceScore: Math.round(avgConfidence),
        questionCount : parsed.questionCount ||0,
        didPractice: true
      })
    } else {
      // Missed day
      timeline.push({
        date: dateStr,
        technicalScore: null,
        confidenceScore: null,
        didPractice: false
      })
    }
  }

  return timeline
}

// Sync daily progress from backend to localStorage
export const syncDailyProgressFromBackend = async (userId) => {
  if (!userId || userId.startsWith('guest_')) return
  try {
    const data = await api.getDailyProgress(userId)
    if (data) {
      let earliestDate = null
      Object.keys(data).forEach(dateStr => {
        const key = `daily_progress_${userId}_${dateStr}`
        localStorage.setItem(key, JSON.stringify(data[dateStr]))
        if (!earliestDate || new Date(dateStr) < new Date(earliestDate)) {
          earliestDate = dateStr
        }
      })
      if (earliestDate) {
        const startKey = `daily_progress_start_${userId}`
        const currentStart = localStorage.getItem(startKey)
        if (!currentStart || new Date(earliestDate) < new Date(currentStart)) {
          localStorage.setItem(startKey, earliestDate)
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync daily progress from backend:", err)
  }
}
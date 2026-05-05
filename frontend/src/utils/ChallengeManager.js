// ── Master challenge definitions ──────────────────────────────────────────────
// "id" must match the backend route param used in api.getChallenge(id)
export const LEVELS = [
  {
    id: 1,
    title: 'The Warmup',
    description: 'Get started with the basics',
    badgeIcon: 'Shield',
    color: '#10b981',
  },
  {
    id: 2,
    title: 'The Specialist',
    description: 'Show your domain expertise',
    badgeIcon: 'Medal',
    color: '#059669',
  },
  {
    id: 3,
    title: 'The Master',
    description: 'Flawless execution across the board',
    badgeIcon: 'Crown',
    color: '#047857',
  },
  {
    id: 4,
    title: 'The Elite',
    description: 'Pushing the boundaries of expertise',
    badgeIcon: 'Zap',
    color: '#065f46',
  },
  {
    id: 5,
    title: 'The Legend',
    description: 'A level beyond human comprehension',
    badgeIcon: 'Trophy',
    color: '#064e3b',
  }
]

export const CHALLENGES = [
  {
    id: 'first-victory',
    title: 'First Victory',
    description: 'Complete your first interview session',
    icon: 'Target',
    points: 300,
    color: '#10b981',
    colorLight: '#ecfdf5',
    requiredScore: 0,
    metricKey: 'sessionsCompleted',
    metricTotal: 1,
    level: 1,
    unlockedBy: null,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 10 questions in under 2 minutes each',
    icon: 'Zap',
    points: 500,
    color: '#059669',
    colorLight: '#d1fae5',
    requiredScore: 70,
    metricKey: 'fastAnswers',
    metricTotal: 10,
    level: 1,
    unlockedBy: null,
  },
  {
    id: 'consistency-king',
    title: 'Consistency Master',
    description: 'Practice for 7 consecutive days',
    icon: 'Calendar',
    points: 600,
    color: '#34d399',
    colorLight: '#f0fdf4',
    requiredScore: 70,
    metricKey: 'streak',
    metricTotal: 7,
    level: 1,
    unlockedBy: null,
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Achieve 100% score in any category',
    icon: 'Target',
    points: 1000,
    color: '#10b981',
    colorLight: '#d1fae5',
    requiredScore: 100,
    metricKey: 'perfectSessions',
    metricTotal: 1,
    level: 2,
    unlockedBy: null, // Unlocked by default
  },
  {
    id: 'communication-expert',
    title: 'Communication Expert',
    description: 'Achieve 95%+ communication score in 5 interviews',
    icon: 'Users',
    points: 800,
    color: '#059669',
    colorLight: '#ecfdf5',
    requiredScore: 95,
    metricKey: 'highCommSessions',
    metricTotal: 5,
    level: 2,
    unlockedBy: null, // Unlocked by default
  },
  {
    id: 'category-master',
    title: 'Category Master',
    description: 'Complete all questions in one full category',
    icon: 'Crown',
    points: 750,
    color: '#047857',
    colorLight: '#d1fae5',
    requiredScore: 70,
    metricKey: 'categoryCompleted',
    metricTotal: 1,
    level: 3,
    unlockedBy: 'perfect-score', // Requires a level 2 challenge
  },
  {
    id: 'grand-master',
    title: 'Grand Master',
    description: 'Complete all categories with 90%+ average',
    icon: 'Trophy',
    points: 2000,
    color: '#064e3b',
    colorLight: '#ecfdf5',
    requiredScore: 90,
    metricKey: 'allCatHighScore',
    metricTotal: 6,
    level: 3,
    unlockedBy: 'category-master', // Requires previous level 3 challenge
  },
  {
    id: 'tech-visionary',
    title: 'Tech Visionary',
    description: 'Achieve 98%+ technical score in 10 consecutive sessions',
    icon: 'Shield',
    points: 2500,
    color: '#059669',
    colorLight: '#ecfdf5',
    requiredScore: 98,
    metricKey: 'highTechStreak',
    metricTotal: 10,
    level: 4,
    unlockedBy: 'grand-master',
  },
  {
    id: 'interview-beast',
    title: 'Interview Beast',
    description: 'Complete 50 full interview sessions',
    icon: 'Zap',
    points: 3000,
    color: '#047857',
    colorLight: '#d1fae5',
    requiredScore: 70,
    metricKey: 'sessionsCompleted',
    metricTotal: 50,
    level: 4,
    unlockedBy: 'tech-visionary',
  },
  {
    id: 'flawless-run',
    title: 'Flawless Run',
    description: 'Achieve 100% in all categories simultaneously',
    icon: 'Star',
    points: 5000,
    color: '#065f46',
    colorLight: '#ecfdf5',
    requiredScore: 100,
    metricKey: 'allPerfectSessions',
    metricTotal: 1,
    level: 5,
    unlockedBy: 'interview-beast',
  },
  {
    id: 'ultimate-champion',
    title: 'Ultimate Champion',
    description: 'Reach 10,000 total points and 30-day streak',
    icon: 'Crown',
    points: 10000,
    color: '#064e3b',
    colorLight: '#d1fae5',
    requiredScore: 95,
    metricKey: 'streak',
    metricTotal: 30,
    level: 5,
    unlockedBy: 'flawless-run',
  },
]

// ── Storage helpers ────────────────────────────────────────────────────────────

export const getChallengeData = (email) => {
  const key = `challenge_progress_${email}`
  const data = localStorage.getItem(key)
  if (!data) return { totalPoints: 0, challenges: {} }
  return JSON.parse(data)
}

export const saveChallengeResult = (email, challengeId, score, points) => {
  if (email && email.startsWith('guest_')) return // Skip saving for guest users
  const data = getChallengeData(email)
  if (!data.challenges[challengeId]) {
    data.challenges[challengeId] = { completed: false, bestScore: 0, attempts: 0 }
  }
  const ch = data.challenges[challengeId]
  ch.attempts += 1
  ch.bestScore = Math.max(ch.bestScore, score)

  const def = CHALLENGES.find(c => c.id === challengeId)
  const threshold = def?.requiredScore ?? 70

  if (!ch.completed && score >= threshold) {
    ch.completed = true
    data.totalPoints = (data.totalPoints || 0) + points
  }

  localStorage.setItem(`challenge_progress_${email}`, JSON.stringify(data))
}

// Increment a custom metric counter for a challenge
export const incrementChallengeMetric = (email, challengeId, amount = 1) => {
  const data = getChallengeData(email)
  if (!data.challenges[challengeId]) {
    data.challenges[challengeId] = { completed: false, bestScore: 0, attempts: 0, metricCount: 0 }
  }
  const ch = data.challenges[challengeId]
  ch.metricCount = (ch.metricCount || 0) + amount
  localStorage.setItem(`challenge_progress_${email}`, JSON.stringify(data))
}

// ── Derived progress for display ──────────────────────────────────────────────
// Returns enriched challenge list with real progress from localStorage + lock state

export const getEnrichedChallenges = (email, streak = 0) => {
  const data = getChallengeData(email)
  const completedIds = new Set(
    Object.entries(data.challenges)
      .filter(([, v]) => v.completed)
      .map(([k]) => k)
  )

  // Dynamically compute completed sessions
  let totalSessionsCompleted = 0;
  try {
    const categories = [
      'software_development', 'data_analytics', 'data_science_ml', 
      'cloud_devops', 'cybersecurity', 'hr_round'
    ];
    categories.forEach(cat => {
      const saved = localStorage.getItem(`progress_${email}_${cat}`);
      if (saved) {
        const p = JSON.parse(saved);
        totalSessionsCompleted += Math.floor((p.currentQuestionIndex || 0) / 5);
      }
    });
  } catch (e) {}

  return CHALLENGES.map(def => {
    const saved = data.challenges[def.id] || {}
    const isLocked = def.unlockedBy ? !completedIds.has(def.unlockedBy) : false

    // Derive metric progress from different sources
    let metricProgress = saved.metricCount || 0
    if (def.metricKey === 'streak') metricProgress = streak
    if (def.metricKey === 'sessionsCompleted') metricProgress = Math.max(metricProgress, totalSessionsCompleted)

    let isCompleted = saved.completed || false;
    if (!isCompleted && metricProgress >= def.metricTotal) {
      isCompleted = true;
      // We don't save to localStorage here to avoid side effects during render,
      // but the UI will show it as completed!
    }

    return {
      ...def,
      locked: isLocked,
      completed: isCompleted,
      bestScore: saved.bestScore || 0,
      attempts: saved.attempts || 0,
      metricProgress: Math.min(metricProgress, def.metricTotal),
    }
  })
}

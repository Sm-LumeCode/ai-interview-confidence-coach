export const getChallengeData = (email) => {
  const key = `challenge_progress_${email}`
  const data = localStorage.getItem(key)

  if (!data) {
    return {
      totalPoints: 0,
      challenges: {}
    }
  }

  return JSON.parse(data)
}

export const saveChallengeResult = (email, challengeId, score, points) => {
  const data = getChallengeData(email)

  if (!data.challenges[challengeId]) {
    data.challenges[challengeId] = {
      completed: false,
      bestScore: 0,
      attempts: 0
    }
  }

  const challenge = data.challenges[challengeId]
  challenge.attempts += 1
  challenge.bestScore = Math.max(challenge.bestScore, score)

  if (!challenge.completed && score >= 70) {
    challenge.completed = true
    data.totalPoints += points
  }

  localStorage.setItem(
    `challenge_progress_${email}`,
    JSON.stringify(data)
  )
}

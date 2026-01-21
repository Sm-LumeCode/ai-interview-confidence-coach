import React, { useEffect, useState } from "react"
import Navbar from "./Navbar"
import { getProgress } from "../utils/progressManager"
import { getDailyProgress } from "../utils/dailyProgressManager"
import {
  Zap,
  Timer,
  Flame,
  Award
} from "lucide-react"

const Challenges = ({ user, onLogout }) => {
  const [progress, setProgress] = useState(null)
  const [daily, setDaily] = useState([])

  useEffect(() => {
    if (!user?.email) return

    // Overall progress
    const overall = getProgress(user.email, "overall") || {
      currentQuestionIndex: 0,
      totalQuestions: 0
    }

    // Daily attempts
    const dailyData = getDailyProgress(user.email) || []

    setProgress(overall)
    setDaily(dailyData)
  }, [user])

  if (!progress) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex justify-center items-center h-screen text-white">
          Loading challenges...
        </div>
      </div>
    )
  }

  /* ----------------- DERIVED METRICS ----------------- */

  const attemptsToday = daily.length > 0
    ? daily[daily.length - 1]?.attempts || 0
    : 0

  const avgTime = daily.length > 0
    ? Math.round(
        daily.reduce((a, b) => a + (b.timeTaken || 0), 0) / daily.length
      )
    : 0

  const streak = daily.reduce((count, day) => {
    return day.attempts > 0 ? count + 1 : count
  }, 0)

  /* ----------------- UI ----------------- */

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-8">
          Challenges
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SPEED DEMON */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Speed Demon
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Answer questions quickly and efficiently.
            </p>
            <p className="text-gray-800 font-medium">
              Avg Time:{" "}
              <span className="text-amber-700">
                {avgTime || "—"} sec
              </span>
            </p>
          </div>

          {/* CONSISTENCY KING */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Consistency King
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Maintain daily interview practice streaks.
            </p>
            <p className="text-gray-800 font-medium">
              Streak:{" "}
              <span className="text-red-600">
                {streak} days
              </span>
            </p>
          </div>

          {/* DAILY WARRIOR */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Timer className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Daily Warrior
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Complete multiple questions in a single day.
            </p>
            <p className="text-gray-800 font-medium">
              Attempts Today:{" "}
              <span className="text-blue-600">
                {attemptsToday}
              </span>
            </p>
          </div>

          {/* INTERVIEW CHAMP */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Interview Champ
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Overall interview completion.
            </p>
            <p className="text-gray-800 font-medium">
              Completed:{" "}
              <span className="text-green-700">
                {progress.currentQuestionIndex || 0}
              </span>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Challenges
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import RoleSelector from './RoleSelector'
import { getAllProgress } from '../utils/progressManager'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager'
import { Target, Flame, TrendingUp, BarChart3, Quote } from 'lucide-react'

const THEME_COLOR = '#10b981' // Vibrant Emerald Green
const THEME_LIGHT = '#f0fdf4'

const TypewriterQuote = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index])
        setIndex(prev => prev + 1)
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [index, text])

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: '#64748b', fontStyle: 'italic', fontSize: 16, lineHeight: 1.6 }}>
      <Quote size={20} style={{ flexShrink: 0, marginTop: 4, opacity: 0.4, color: THEME_COLOR }} />
      <span>{displayedText}<span style={{ borderRight: `2px solid ${THEME_COLOR}`, marginLeft: 2, animation: 'blink 0.7s infinite' }} /></span>
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </div>
  )
}

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [userProgress, setUserProgress] = useState({})
  const [stats, setStats] = useState({ totalQuestions: 0, streak: 0, avgScore: 0 })

  useEffect(() => {
    const progress = getAllProgress(user.email)
    setUserProgress(progress)

    const timeline = getDailyProgressTimeline(user.email)
    const totalQuestions = timeline.reduce((s, d) => s + (d.questionCount || 0), 0)

    // streak
    let streak = 0
    const sorted = [...timeline].reverse()
    for (const day of sorted) {
      if (day.didPractice) streak++
      else break
    }

    const practiced = timeline.filter(d => d.technicalScore !== null)
    const avgScore = practiced.length
      ? Math.round(
          practiced.reduce((s, d) => s + ((d.technicalScore + (d.confidenceScore || 0)) / 2), 0) /
          practiced.length
        )
      : 0

    setStats({ totalQuestions, streak, avgScore })
  }, [user.email])

  // Clicking a category goes to the sessions list, not directly into interview
  const handleSelectRole = (categoryId) => {
    navigate(`/sessions/${categoryId}`)
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user.username}</h1>
          <p className="page-subtitle">Here's your preparation overview.</p>
        </div>

        {/* Stats Row - Standardized Colors */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 32 }}>
          {[
            { label: 'Problems Solved', value: stats.totalQuestions, icon: Target },
            { label: 'Current Streak', value: stats.streak, icon: Flame, unit: 'days' },
            { label: 'Avg Score', value: stats.avgScore, icon: TrendingUp, unit: '%' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="stat-card-icon" style={{ background: THEME_LIGHT }}>
                <s.icon size={20} color={THEME_COLOR} />
              </div>
              <p className="stat-card-label">{s.label}</p>
              <p className="stat-card-value">
                {s.value} {s.unit && <span style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>{s.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Category picker */}
        <div className="animate-fade-in" style={{ marginTop: 40 }}>
          <div style={{ textAlign: 'left', paddingLeft: 60, marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 32, color: '#0f172a', marginBottom: 16 }}>
              Choose your Category
            </h2>
            <div style={{ maxWidth: 650 }}>
              <TypewriterQuote text="Success is where preparation and opportunity meet. Start your journey today." />
            </div>
          </div>
          <RoleSelector onSelectRole={handleSelectRole} userProgress={userProgress} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
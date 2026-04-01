import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import RoleSelector from './RoleSelector'
import { getAllProgress } from '../utils/progressManager'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager'
import { Target, Flame, TrendingUp, BarChart3 } from 'lucide-react'

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

  const handleSelectRole = (category) => {
    navigate(`/interview/${category}`)
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user.username}! 👋</h1>
          <p className="page-subtitle">Here's your preparation overview.</p>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 32 }}>
          <div className="stat-card animate-slide-up">
            <div className="stat-card-icon" style={{ background: '#d1fae5' }}>
              <Target size={20} color="#10b981" />
            </div>
            <p className="stat-card-label">Problems Solved</p>
            <p className="stat-card-value">{stats.totalQuestions}</p>
          </div>

          <div className="stat-card animate-slide-up" style={{ animationDelay: '80ms' }}>
            <div className="stat-card-icon" style={{ background: '#fef3c7' }}>
              <Flame size={20} color="#f59e0b" />
            </div>
            <p className="stat-card-label">Current Streak</p>
            <p className="stat-card-value">{stats.streak} <span style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>days</span></p>
          </div>

          <div className="stat-card animate-slide-up" style={{ animationDelay: '160ms' }}>
            <div className="stat-card-icon" style={{ background: '#dbeafe' }}>
              <TrendingUp size={20} color="#3b82f6" />
            </div>
            <p className="stat-card-label">Avg Score</p>
            <p className="stat-card-value">{stats.avgScore}<span style={{ fontSize: 18, color: '#64748b' }}>%</span></p>
          </div>

          <div className="stat-card animate-slide-up" style={{ animationDelay: '240ms' }}>
            <div className="stat-card-icon" style={{ background: '#ede9fe' }}>
              <BarChart3 size={20} color="#8b5cf6" />
            </div>
            <p className="stat-card-label">Categories</p>
            <p className="stat-card-value">6</p>
          </div>
        </div>

        {/* Category picker */}
        <div className="card animate-fade-in">
          <h2 className="card-title">Choose a Category</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, marginTop: -8 }}>
            Select an area to start your interview practice session
          </p>
          <RoleSelector onSelectRole={handleSelectRole} userProgress={userProgress} />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
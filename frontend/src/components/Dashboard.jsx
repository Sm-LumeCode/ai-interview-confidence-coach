import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import RoleSelector, { categories } from './RoleSelector'
import { getAllProgress, syncProgressFromBackend } from '../utils/progressManager'
import { getDailyProgressTimeline, syncDailyProgressFromBackend } from '../utils/dailyProgressManager'
import { Target, Flame, TrendingUp, Quote } from 'lucide-react'

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
  const [activeCategory, setActiveCategory] = useState('')

  const loadLocalData = () => {
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
  }

  useEffect(() => {
    // 1. Immediately load whatever is in localStorage
    loadLocalData()

    // 2. Sync from backend, then reload local data
    const syncData = async () => {
      try {
        await Promise.all([
          syncProgressFromBackend(user.email),
          syncDailyProgressFromBackend(user.email)
        ])
        loadLocalData() // Refresh UI with synced data
      } catch (err) {
        console.error("Failed to sync dashboard data:", err)
      }
    }
    
    if (!user.email?.startsWith('guest_')) {
      syncData()
    }
  }, [user.email])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150
      for (const cat of categories) {
        const element = document.getElementById(`category-${cat.id}`)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(cat.id)
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Clicking a category goes to the sessions list, not directly into interview
  const handleSelectRole = (categoryId) => {
    navigate(`/sessions/${categoryId}`)
  }

  const scrollToCategory = (categoryId) => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content" style={{ paddingTop: 0, position: 'relative' }}>
        
        {/* Sticky Top Navbar for Categories */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 40,
          padding: '16px 36px',
          margin: '0 -36px 32px -36px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 99,
                background: activeCategory === cat.id ? THEME_COLOR : 'transparent',
                color: activeCategory === cat.id ? 'white' : '#64748b',
                border: `1px solid ${activeCategory === cat.id ? THEME_COLOR : '#e2e8f0'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeCategory === cat.id ? `0 4px 12px ${THEME_COLOR}33` : 'none'
              }}
              onMouseEnter={e => {
                if (activeCategory !== cat.id) {
                  e.currentTarget.style.background = '#f8fafc'
                  e.currentTarget.style.color = '#0f172a'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }
              }}
              onMouseLeave={e => {
                if (activeCategory !== cat.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }
              }}
            >
              <cat.icon size={16} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="page-header" style={{ marginTop: 20 }}>
          <h1 className="page-title">Welcome back, {user.username}</h1>
          <p className="page-subtitle">Here's your preparation overview.</p>
        </div>

        {/* Stats Row - Standardized Colors */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 40 }}>
          {[
            { label: 'Problems Solved', value: stats.totalQuestions, icon: Target },
            { label: 'Current Streak', value: stats.streak, icon: Flame, unit: 'days' },
            { label: 'Avg Score', value: stats.avgScore, icon: TrendingUp, unit: '%' },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms`, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
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
        <div className="animate-fade-in" style={{ marginTop: 20 }}>
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
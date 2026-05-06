import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RoleSelector, { categories } from './RoleSelector'
import { getAllProgress, syncProgressFromBackend } from '../utils/progressManager'
import { getDailyProgressTimeline, syncDailyProgressFromBackend } from '../utils/dailyProgressManager'
import { getAllCategoryProgress, syncCategoryProgressFromBackend, CATEGORY_TOTALS } from '../utils/categoryProgressManager'
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
    const roadmapProgress = getAllProgress(user.email)
    const categoryProgress = getAllCategoryProgress(user.email)
    
    // Unify progress: map roadmap index or completed count
    const unifiedProgress = {}
    categories.forEach(cat => {
      const catData = categoryProgress[cat.id]
      unifiedProgress[cat.id] = {
        completed: catData?.completed || 0,
        totalQuestions: CATEGORY_TOTALS[cat.name] || 100,
        currentQuestionIndex: roadmapProgress[cat.id]?.currentQuestionIndex || 0
      }
    })
    setUserProgress(unifiedProgress)

    const timeline = getDailyProgressTimeline(user.email)
    
    // Link "Problems Solved" to the sum of completions across all categories
    const totalQuestions = Object.values(categoryProgress).reduce((s, d) => s + (d.completed || 0), 0)

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
          syncDailyProgressFromBackend(user.email),
          syncCategoryProgressFromBackend(user.email)
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
    <div className="app-layout" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main className="main-content" style={{ paddingTop: '20px', position: 'relative', background: 'transparent' }}>
        {/* Background Mesh Decor */}
        <div style={{
          position: 'fixed', top: 0, right: 0, width: '40vw', height: '40vw',
          background: `radial-gradient(circle, ${THEME_COLOR}08 0%, transparent 70%)`,
          zIndex: -1, pointerEvents: 'none'
        }} />
        
        {/* Sticky Top Navbar for Categories */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 40,
          padding: '16px 36px',
          margin: '0 -36px 32px -36px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          boxShadow: '0 4px 30px rgba(0,0,0,0.03)',
        }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              style={{
                padding: '10px 20px',
                borderRadius: 99,
                background: activeCategory === cat.id ? THEME_COLOR : 'white',
                color: activeCategory === cat.id ? 'white' : '#64748b',
                border: `1px solid ${activeCategory === cat.id ? THEME_COLOR : '#e2e8f0'}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeCategory === cat.id ? `0 8px 20px ${THEME_COLOR}44` : '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <cat.icon size={15} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Header Section */}
        <div style={{ marginBottom: 48, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
            <div style={{ width: 48, height: 4, background: THEME_COLOR, borderRadius: 2 }} />
            <span style={{ color: THEME_COLOR, fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overview</span>
          </div>
          <h1 style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 42, 
            fontWeight: 800, 
            color: '#0f172a', 
            letterSpacing: '-0.02em',
            marginBottom: 12
          }}>
            Welcome back, {user.username}
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', fontWeight: 500 }}>
            You've solved <span style={{ color: THEME_COLOR, fontWeight: 800 }}>{stats.totalQuestions}</span> problems so far. Keep pushing!
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 24, 
          marginBottom: 60 
        }}>
          {[
            { label: 'Problems Solved', value: stats.totalQuestions, icon: Target, color: THEME_COLOR },
            { label: 'Current Streak', value: stats.streak, icon: Flame, color: '#f59e0b', unit: 'days' },
            { label: 'Avg Accuracy', value: stats.avgScore, icon: TrendingUp, color: '#3b82f6', unit: '%' },
          ].map((s, i) => (
            <div key={i} className="animate-slide-up" style={{ 
              animationDelay: `${i * 100}ms`,
              background: 'white',
              padding: '32px',
              borderRadius: 24,
              border: '1px solid rgba(226, 232, 240, 0.6)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 54, height: 54, borderRadius: 16, 
                  background: `${s.color}10`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <s.icon size={26} color={s.color} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{s.value}</span>
                {s.unit && <span style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginLeft: 6 }}>{s.unit}</span>}
              </div>
              <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '70%', height: '100%', background: s.color, borderRadius: 2, opacity: 0.3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Learning Paths */}
        <div className="animate-fade-in" style={{ marginTop: 20 }}>
          <div style={{ textAlign: 'left', paddingLeft: 60, marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 36, color: '#0f172a', letterSpacing: '-0.02em' }}>
                Preparation Roadmap
              </h2>
              <div style={{ height: 2, flex: 1, background: 'linear-gradient(to right, #e2e8f0, transparent)', marginLeft: 20 }} />
            </div>
            <div style={{ maxWidth: 650 }}>
              <TypewriterQuote text="Success is the sum of small efforts, repeated day in and day out. Select your path and master it." />
            </div>
          </div>
          <RoleSelector onSelectRole={handleSelectRole} userProgress={userProgress} />
        </div>
      </main>
      <style>{`
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

export default Dashboard
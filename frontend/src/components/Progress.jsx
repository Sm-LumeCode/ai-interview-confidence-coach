import Navbar from './Navbar'
import { TrendingUp, Award, Target, CheckCircle, BarChart2, Star, Calendar, Brain, Zap, Shield, Cpu, Database, Users } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import { getCategoryProgress, CATEGORY_TOTALS } from '../utils/categoryProgressManager'
import { motion, AnimatePresence } from 'framer-motion'

const categories = [
  { name: 'Software Development', icon: Cpu },
  { name: 'Data & Analytics', icon: Database },
  { name: 'Data Science & ML', icon: Brain },
  { name: 'Cloud & DevOps', icon: Zap },
  { name: 'Cybersecurity', icon: Shield },
  { name: 'HR Round', icon: Users }
]

const CAT_COLORS = {
  'Software Development': '#3b82f6',
  'Data & Analytics': '#8b5cf6',
  'Data Science & ML': '#10b981',
  'Cloud & DevOps': '#f59e0b',
  'Cybersecurity': '#6366f1',
  'HR Round': '#ec4899'
}

const ContributionCalendar = ({ timeline }) => {
  const today = new Date()
  const weeks = []
  const activityMap = {}
  timeline.forEach(d => { if (d.date) activityMap[d.date] = d.questionCount || 0 })

  const startDate = new Date()
  startDate.setDate(today.getDate() - (52 * 7))
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1)

  const currentDate = new Date(startDate)
  for (let w = 0; w < 53; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      week.push({ date: dateStr, count: activityMap[dateStr] || 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }

  const getColor = (count) => {
    if (count === 0) return '#f1f5f9'
    if (count < 3) return '#d1fae5'
    if (count < 6) return '#6ee7b7'
    if (count < 10) return '#10b981'
    return '#059669'
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '20px', overflowX: 'auto', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="card-title" style={{ margin: 0, fontSize: 15 }}>Activity Heatmap</h3>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, color: '#94a3b8' }}>
          <span>Less</span>
          {[0, 2, 5, 8, 12].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: 2, background: getColor(c) }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'space-between', padding: '14px 4px 4px 0', fontSize: 9, color: '#94a3b8' }}>
          <span>M</span><span>W</span><span>F</span>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => (
                <div key={di} title={`${day.date}: ${day.count} questions`}
                  style={{ width: 10, height: 10, borderRadius: 1.5, background: getColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const HexagonNode = ({ cat, data, index, hoveredId, setHoveredId }) => {
  const isHovered = hoveredId === cat.name
  const color = CAT_COLORS[cat.name] || '#10b981'
  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
  
  // Larger size and radius
  const angle = (index * 60) * (Math.PI / 180)
  const radius = 220 
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius

  const easy = Math.floor(data.completed * 0.5)
  const medium = Math.floor(data.completed * 0.3)
  const hard = data.completed - easy - medium

  const Icon = cat.icon
  const isRightSide = x >= 0

  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, zIndex: isHovered ? 100 : 10 }}>
      <motion.div
        onMouseEnter={() => setHoveredId(cat.name)}
        onMouseLeave={() => setHoveredId(null)}
        whileHover={{ scale: 1.15 }}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        {/* Connection Line to Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.svg 
              initial={{ opacity: 0, scale: 0 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: 55, left: isRightSide ? 120 : -40, width: 40, height: 2, zIndex: -1, pointerEvents: 'none', overflow: 'visible' }}
            >
              <line x1="0" y1="0" x2={isRightSide ? 30 : -30} y2="0" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
              <circle cx={isRightSide ? 30 : -30} cy="0" r="3" fill={color} />
            </motion.svg>
          )}
        </AnimatePresence>

        <svg width="120" height="130" viewBox="0 0 100 110">
          <path d="M50 0 L100 25 L100 85 L50 110 L0 85 L0 25 Z" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
          <clipPath id={`clip-${index}`}>
            <rect x="0" y={110 - (pct * 1.1)} width="100" height={pct * 1.1} />
          </clipPath>
          <path d="M50 0 L100 25 L100 85 L50 110 L0 85 L0 25 Z" fill={color} opacity="0.1" />
          <path d="M50 0 L100 25 L100 85 L50 110 L0 85 L0 25 Z" fill={color} clipPath={`url(#clip-${index})`} />
          <foreignObject x="25" y="30" width="50" height="50">
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pct > 40 ? '#fff' : '#0f172a' }}>
              <Icon size={32} />
            </div>
          </foreignObject>
        </svg>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: isRightSide ? 20 : -20 }}
              animate={{ opacity: 1, x: isRightSide ? 150 : -270 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', top: -30,
                width: 240, background: '#fff', borderRadius: 20, padding: 20,
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: `1px solid ${color}30`,
                pointerEvents: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{cat.name}</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Avg Score</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: color }}>{data.score}%</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Solved</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{pct}%</p>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Easy', val: easy, c: '#10b981' },
                  { label: 'Medium', val: medium, c: '#f59e0b' },
                  { label: 'Hard', val: hard, c: '#ef4444' }
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.c }} />
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{l.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{l.val} Qs</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Category Name Label underneath */}
      <div style={{ position: 'absolute', top: 125, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', width: 140 }}>
        {cat.name}
      </div>
    </div>
  )
}

const Progress = ({ user, onLogout }) => {
  const [dailyTimeline, setDailyTimeline] = useState([])
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    if (!user?.email) return
    setDailyTimeline(getDailyProgressTimeline(user.email))
  }, [user])

  const categoryProgress = useMemo(() => categories.map(cat => {
    const data = getCategoryProgress(user.email, cat.name)
    if (!data) return { name: cat.name, completed: 0, total: CATEGORY_TOTALS[cat.name] || 0, score: 0 }
    const avgScore =
      [...data.technicalScores, ...data.confidenceScores].reduce((a, b) => a + b, 0) /
      (data.technicalScores.length + data.confidenceScores.length)
    return { name: cat.name, completed: data.completed, total: CATEGORY_TOTALS[cat.name] || 0, score: Math.round(avgScore) }
  }), [user.email])

  const practicedDays = dailyTimeline.filter(d => d.didPractice).length
  const validDays = dailyTimeline.filter(d => d.technicalScore !== null)
  const avgTechnical = validDays.length ? Math.round(validDays.reduce((s, d) => s + d.technicalScore, 0) / validDays.length) : 0
  const avgConfidence = validDays.length ? Math.round(validDays.reduce((s, d) => s + (d.confidenceScore || 0), 0) / validDays.length) : 0
  const totalQuestions = dailyTimeline.reduce((s, d) => s + (d.questionCount || 0), 0)

  const strongestCategory = categoryProgress.every(c => c.score === 0) ? '—' : categoryProgress.reduce((best, c) => c.score > best.score ? c : best, categoryProgress[0]).name

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1 className="page-title" style={{ fontSize: 24 }}>Analytics</h1>
          <p className="page-subtitle" style={{ fontSize: 14 }}>Track your performance and mastery across all categories</p>
        </div>

        {/* ── Top Stats Cards (Increased Height & Padding) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Questions', val: totalQuestions, icon: Target, c: ['#10b981', '#059669'] },
            { label: 'Practice Days', val: practicedDays, icon: Calendar, c: ['#34d399', '#10b981'] },
            { label: 'Technical %', val: `${avgTechnical}%`, icon: TrendingUp, c: ['#059669', '#047857'] },
            { label: 'Confidence %', val: `${avgConfidence}%`, icon: Award, c: ['#10b981', '#059669'] },
            { label: 'Best Skill', val: strongestCategory.split(' ')[0], icon: Star, c: ['#34d399', '#059669'] }
          ].map((s, i) => (
            <div key={i} style={{ 
              background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})`, 
              borderRadius: 24, padding: '32px 24px', color: '#fff', 
              boxShadow: '0 12px 30px rgba(16,185,129,0.25)',
              position: 'relative', overflow: 'hidden',
              minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <s.icon size={110} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.12 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>{s.label}</p>
                <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{s.val}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* ── Heatmap ── */}
        <ContributionCalendar timeline={dailyTimeline} />

        {/* ── Hexagonal Skill Mastery Section (Moved Down & Refined) ── */}
        <div className="card animate-fade-in" style={{ flex: 1, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 680, overflow: 'visible', padding: '40px 24px' }}>
          <h2 className="card-title" style={{ width: '100%', textAlign: 'left', fontSize: 18, marginBottom: 40 }}>Skill Mastery Honeycomb</h2>
          
          <div style={{ position: 'relative', width: 500, height: 500, marginTop: 40 }}>
            {/* Central Node */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5 }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#fff', border: '10px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.06)' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Overall</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#10b981' }}>{avgTechnical}%</p>
                </div>
              </div>
            </div>

            {/* Connecting Lines */}
            <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              {categories.map((_, i) => {
                const angle = (i * 60) * (Math.PI / 180)
                const x2 = 250 + Math.cos(angle) * 220
                const y2 = 250 + Math.sin(angle) * 220
                return <line key={i} x1="250" y1="250" x2={x2} y2={y2} stroke="#e2e8f0" strokeWidth="2.5" strokeDasharray="6 4" />
              })}
            </svg>

            {/* Hexagon Category Nodes */}
            {categories.map((cat, i) => (
              <HexagonNode 
                key={cat.name} 
                cat={cat} 
                data={categoryProgress.find(cp => cp.name === cat.name)}
                index={i} 
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 32, right: 32, textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Mastery Insights</p>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Fill depth represents relative practice volume</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Progress
import Navbar from './Navbar'
import { TrendingUp, Award, Target, CheckCircle, BarChart2, Star, Calendar, Brain, Zap, Shield, Cpu, Database, Users, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import { getCategoryProgress, CATEGORY_TOTALS } from '../utils/categoryProgressManager'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const currentYear = new Date().getFullYear()

const categories = [
  { name: 'Software Development', icon: Cpu },
  { name: 'Data & Analytics', icon: Database },
  { name: 'Data Science & ML', icon: Brain },
  { name: 'Cloud & DevOps', icon: Zap },
  { name: 'Cybersecurity', icon: Shield },
  { name: 'HR Round', icon: Users }
]

const CAT_COLORS = {
  'Software Development': '#059669',
  'Data & Analytics': '#10b981',
  'Data Science & ML': '#34d399',
  'Cloud & DevOps': '#047857',
  'Cybersecurity': '#064e3b',
  'HR Round': '#6ee7b7'
}

const HeatmapTooltip = ({ active, date, count, x, y }) => {
  if (!active) return null
  return (
    <div style={{
      position: 'absolute', left: x, top: y - 45, transform: 'translateX(-50%)',
      background: '#0f172a', color: '#fff', padding: '6px 12px', borderRadius: 8,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 100,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', pointerEvents: 'none'
    }}>
      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      <div style={{ color: '#10b981' }}>{count} questions</div>
    </div>
  )
}

const ContributionCalendar = ({ timeline }) => {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [tooltip, setTooltip] = useState({ active: false, date: '', count: 0, x: 0, y: 0 })

  const { weeks, monthLabels } = useMemo(() => {
    const weeks = []
    const monthLabels = []
    const activityMap = {}
    timeline.forEach(d => { if (d.date) activityMap[d.date] = d.questionCount || 0 })

    const startDate = new Date(selectedYear, 0, 1)
    while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1)

    const currentDate = new Date(startDate)
    let lastMonth = -1

    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const month = currentDate.getMonth()
        const year = currentDate.getFullYear()
        if (month !== lastMonth && year === selectedYear) {
          monthLabels.push({ label: currentDate.toLocaleString('default', { month: 'short' }), index: w })
          lastMonth = month
        }
        week.push({ date: dateStr, count: year === selectedYear ? (activityMap[dateStr] || 0) : 0, inYear: year === selectedYear })
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(week)
    }
    return { weeks, monthLabels }
  }, [timeline, selectedYear])

  const getColor = (count, inYear) => {
    if (!inYear) return 'transparent'
    if (count === 0) return '#f1f5f9'
    if (count < 3) return '#d1fae5'
    if (count < 6) return '#6ee7b7'
    if (count < 10) return '#10b981'
    return '#059669'
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '24px', overflowX: 'auto', marginBottom: 20, position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, background: '#ecfdf5', borderRadius: 10 }}>
            <Calendar size={18} color="#10b981" />
          </div>
          <h3 className="card-title" style={{ margin: 0, fontSize: 16 }}>Practice Intensity</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', padding: '4px 12px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <button onClick={() => setSelectedYear(y => y - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', minWidth: 40, textAlign: 'center' }}>{selectedYear}</span>
          <button onClick={() => setSelectedYear(y => Math.min(currentYear, y + 1))} disabled={selectedYear >= currentYear} style={{ background: 'none', border: 'none', cursor: selectedYear >= currentYear ? 'not-allowed' : 'pointer', color: selectedYear >= currentYear ? '#cbd5e1' : '#64748b' }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div style={{ position: 'relative', paddingLeft: 35, width: '100%' }}>
        <div style={{ position: 'relative', height: 20, marginBottom: 8, display: 'flex', width: '100%' }}>
          {monthLabels.map((m, i) => (
            <div key={i} style={{ position: 'absolute', left: `${(m.index / 53) * 100}%`, fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{m.label}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'absolute', left: 0, top: 28, fontSize: 8, color: '#94a3b8', fontWeight: 800 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <span key={day} style={{ height: 12, display: 'flex', alignItems: 'center' }}>{day}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'space-between' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                {week.map((day, di) => (
                  <div key={di}
                    onMouseEnter={(e) => {
                      if (!day.inYear) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const containerRect = e.currentTarget.closest('.card').getBoundingClientRect()
                      setTooltip({ active: true, date: day.date, count: day.count, x: rect.left - containerRect.left + 6, y: rect.top - containerRect.top })
                    }}
                    onMouseLeave={() => setTooltip({ ...tooltip, active: false })}
                    style={{ height: 12, borderRadius: 2, background: getColor(day.count, day.inYear), transition: 'all 0.2s', cursor: day.inYear ? 'pointer' : 'default', width: '100%' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <HeatmapTooltip {...tooltip} />
    </div>
  )
}

const BladeNode = ({ cat, data, index, hoveredId, setHoveredId }) => {
  const isHovered = hoveredId === cat.name
  const color = CAT_COLORS[cat.name] || '#10b981'
  const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0

  const angle = (index * 60) * (Math.PI / 180)
  const radius = 175
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius

  const Icon = cat.icon
  const rotation = (index * 60) + 90

  // Hexagon path
  const HEX_PATH = "M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z"

  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, zIndex: isHovered ? 100 : 10 }}>
      <motion.div
        onMouseEnter={() => setHoveredId(cat.name)}
        onMouseLeave={() => setHoveredId(null)}
        whileHover={{ scale: 1.1 }}
        style={{ cursor: 'pointer', position: 'relative', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.12))' }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: `rotate(${rotation}deg)` }}>
          <path d={HEX_PATH} fill="#fff" stroke={color} strokeWidth="1.5" />
          <clipPath id={`clip-${index}`}>
            <rect x="0" y={100 - pct} width="100" height={pct} />
          </clipPath>
          <path d={HEX_PATH} fill={color} opacity="0.1" />
          <path d={HEX_PATH} fill={color} clipPath={`url(#clip-${index})`} />
          <foreignObject x="25" y="25" width="50" height="50" style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: 'center' }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pct > 50 ? '#fff' : '#0f172a' }}>
              <Icon size={28} />
            </div>
          </foreignObject>
        </svg>
      </motion.div>
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
    const avgScore = [...data.technicalScores, ...data.confidenceScores].reduce((a, b) => a + b, 0) / (data.technicalScores.length + data.confidenceScores.length)
    return { name: cat.name, completed: data.completed, total: CATEGORY_TOTALS[cat.name] || 0, score: Math.round(avgScore) }
  }), [user.email])

  const practicedDays = dailyTimeline.filter(d => d.didPractice).length
  const validDays = dailyTimeline.filter(d => d.technicalScore !== null)
  const avgTechnical = validDays.length ? Math.round(validDays.reduce((s, d) => s + d.technicalScore, 0) / validDays.length) : 0
  const avgConfidence = validDays.length ? Math.round(validDays.reduce((s, d) => s + (d.confidenceScore || 0), 0) / validDays.length) : 0
  const totalQuestions = dailyTimeline.reduce((s, d) => s + (d.questionCount || 0), 0)
  const strongestCategory = categoryProgress.every(c => c.score === 0) ? '—' : categoryProgress.reduce((best, c) => c.score > best.score ? c : best, categoryProgress[0]).name

  // Find data for currently hovered category
  const hoveredData = useMemo(() => {
    if (!hoveredId) return null
    const index = categories.findIndex(c => c.name === hoveredId)
    const data = categoryProgress.find(cp => cp.name === hoveredId)

    const angle = (index * 60) * (Math.PI / 180)
    const radius = 175
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    return { ...data, x, y, color: CAT_COLORS[hoveredId], isRight: x >= 0 }
  }, [hoveredId, categoryProgress])

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h1 className="page-title" style={{ fontSize: 24 }}>Analytics</h1>
          <p className="page-subtitle" style={{ fontSize: 14 }}>Track your performance and mastery across all categories</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Questions', val: totalQuestions, icon: Target, c: ['#10b981', '#059669'] },
            { label: 'Practice Days', val: practicedDays, icon: Calendar, c: ['#34d399', '#10b981'] },
            { label: 'Technical %', val: `${avgTechnical}%`, icon: TrendingUp, c: ['#059669', '#047857'] },
            { label: 'Confidence %', val: `${avgConfidence}%`, icon: Award, c: ['#10b981', '#059669'] },
            { label: 'Best Skill', val: strongestCategory.split(' ')[0], icon: Star, c: ['#34d399', '#059669'] }
          ].map((s, i) => (
            <div key={i} style={{ background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[1]})`, borderRadius: 24, padding: '24px 20px', color: '#fff', boxShadow: '0 12px 30px rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden', minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <s.icon size={100} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.12 }} />
              <div style={{ position: 'relative', zIndex: 1 }}><p style={{ margin: 0, fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{s.label}</p><h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>{s.val}</h2></div>
            </div>
          ))}
        </div>

        <ContributionCalendar timeline={dailyTimeline} />

        <div className="card animate-fade-in" style={{ flex: 1, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 600, overflow: 'visible', padding: '32px', background: '#f0fdf4', border: '1px solid #10b98120', boxShadow: '0 15px 40px rgba(0,0,0,0.03)' }}>
          {/* Vibrant Green Grid Background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none', backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`, backgroundSize: '40px 40px', borderRadius: 24 }} />

          <h2 className="card-title" style={{ width: '100%', textAlign: 'left', fontSize: 18, fontWeight: 900, marginBottom: 30, position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
            <div style={{ padding: 8, background: '#ecfdf5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} style={{ color: '#10b981' }} />
            </div>
            Enterprise Skill Proficiency Architecture
          </h2>
          <div style={{ position: 'relative', width: 440, height: 440, marginTop: 40, marginBottom: 60 }}>
            {/* Connection Lines and Labels */}
            <svg style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'visible' }}>
              {categories.map((cat, i) => {
                const angle = (i * 60) * (Math.PI / 180)
                const x = 220 + Math.cos(angle) * 175
                const y = 220 + Math.sin(angle) * 175
                const labelX = 220 + Math.cos(angle) * 260
                const labelY = 220 + Math.sin(angle) * 260
                const color = CAT_COLORS[cat.name]
                const isHovered = hoveredId === cat.name

                return (
                  <g key={i}>
                    <motion.line
                      x1="220" y1="220" x2={x} y2={y}
                      stroke={color} strokeWidth="2.5" strokeDasharray="6 4"
                      animate={{ strokeDashoffset: [0, -20] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      opacity={isHovered ? 0.8 : 0.2}
                    />
                    <text
                      x={labelX} y={labelY}
                      textAnchor={Math.cos(angle) > 0.1 ? 'start' : (Math.cos(angle) < -0.1 ? 'end' : 'middle')}
                      dominantBaseline="middle"
                      style={{ fontSize: 14, fontWeight: 900, fill: isHovered ? color : '#475569', transition: 'all 0.3s' }}
                    >
                      {cat.name}
                    </text>
                  </g>
                )
              })}

              {/* Line connecting Hexagon to Tooltip */}
              {hoveredData && (
                <motion.line
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x1={220 + hoveredData.x} y1={220 + hoveredData.y}
                  x2={hoveredData.isRight ? 220 + 400 : 220 - 400} y2={220 + hoveredData.y}
                  stroke={hoveredData.color} strokeWidth="2.5" strokeDasharray="4 2"
                />
              )}
            </svg>

            {/* Tooltip Overlay */}
            <AnimatePresence>
              {hoveredData && (
                <motion.div
                  initial={{ opacity: 0, x: hoveredData.isRight ? 100 : -100 }}
                  animate={{
                    opacity: 1,
                    x: hoveredData.isRight ? 400 : -620,
                    y: 220 + hoveredData.y - 100
                  }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', left: '50%', width: 220, background: '#fff', borderRadius: 12, padding: 16,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.18)', border: `1px solid ${hoveredData.color}50`, pointerEvents: 'none', zIndex: 200
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{hoveredData.name}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                    <div><p style={{ margin: 0, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Avg Score</p><p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: hoveredData.color }}>{hoveredData.score}%</p></div>
                    <div><p style={{ margin: 0, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Solved</p><p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{Math.round((hoveredData.completed / hoveredData.total) * 100)}%</p></div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Easy', val: Math.floor(hoveredData.completed * 0.5), c: '#10b981' },
                      { label: 'Medium', val: Math.floor(hoveredData.completed * 0.3), c: '#f59e0b' },
                      { label: 'Hard', val: hoveredData.completed - Math.floor(hoveredData.completed * 0.5) - Math.floor(hoveredData.completed * 0.3), c: '#ef4444' }
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{l.label} Questions</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: l.c }}>{l.val}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 5 }}>
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }}
                style={{ width: 140, height: 140, borderRadius: '50%', background: '#fff', border: '12px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Overall</p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#10b981' }}>{avgTechnical}%</p>
                </div>
              </motion.div>
            </div>
            {categories.map((cat, i) => (
              <BladeNode key={cat.name} cat={cat} data={categoryProgress.find(cp => cp.name === cat.name)} index={i} hoveredId={hoveredId} setHoveredId={setHoveredId} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Progress
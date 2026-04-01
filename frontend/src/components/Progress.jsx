import Navbar from './Navbar'
import { TrendingUp, Award, Target, CheckCircle, BarChart2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { getDailyProgressTimeline } from '../utils/dailyProgressManager.js'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { getCategoryProgress, CATEGORY_TOTALS } from '../utils/categoryProgressManager'

const categories = [
  'Software Development', 'Data & Analytics', 'Data Science & ML',
  'Cloud & DevOps', 'Cybersecurity', 'HR Round'
]

const CAT_COLORS = {
  'Software Development': '#3b82f6',
  'Data & Analytics': '#8b5cf6',
  'Data Science & ML': '#10b981',
  'Cloud & DevOps': '#f59e0b',
  'Cybersecurity': '#6366f1',
  'HR Round': '#ec4899'
}

const Progress = ({ user, onLogout }) => {
  const [dailyTimeline, setDailyTimeline] = useState([])

  useEffect(() => {
    if (!user?.email) return
    setDailyTimeline(getDailyProgressTimeline(user.email))
  }, [user])

  const categoryProgress = categories.map(cat => {
    const data = getCategoryProgress(user.email, cat)
    if (!data) return { name: cat, completed: 0, total: CATEGORY_TOTALS[cat] || 0, score: 0 }
    const avgScore =
      [...data.technicalScores, ...data.confidenceScores].reduce((a, b) => a + b, 0) /
      (data.technicalScores.length + data.confidenceScores.length)
    return { name: cat, completed: data.completed, total: CATEGORY_TOTALS[cat] || 0, score: Math.round(avgScore) }
  })

  const practicedDays = dailyTimeline.filter(d => d.didPractice).length
  const validDays = dailyTimeline.filter(d => d.technicalScore !== null)
  const avgTechnical = validDays.length
    ? Math.round(validDays.reduce((s, d) => s + d.technicalScore, 0) / validDays.length) : 0
  const avgConfidence = validDays.length
    ? Math.round(validDays.reduce((s, d) => s + (d.confidenceScore || 0), 0) / validDays.length) : 0
  const totalQuestions = dailyTimeline.reduce((s, d) => s + (d.questionCount || 0), 0)

  const strongestCategory = categoryProgress.every(c => c.score === 0)
    ? '—'
    : categoryProgress.reduce((best, c) => c.score > best.score ? c : best, categoryProgress[0]).name

  const totalDays = dailyTimeline.length
  const startDay = Math.max(1, totalDays - 6)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = dailyTimeline[startDay - 1 + i]
    return {
      day: `Day ${startDay + i}`,
      technical: d?.didPractice ? d.technicalScore : null,
      communication: d?.didPractice ? d.confidenceScore : null,
      date: d?.date || null
    }
  })
  const currentDayLabel = `Day ${Math.min(totalDays, 7)}`

  const StatCard = ({ icon: Icon, iconBg, iconColor, label, value }) => (
    <div className="stat-card animate-slide-up">
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} />
      </div>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value" style={{ fontSize: 26 }}>{value}</p>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a' }}>
          {payload[0]?.payload?.date || label}
        </p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.dataKey === 'technical' ? 'Technical' : 'Communication'}: {p.value}%
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your progress and performance over time</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Target} iconBg="#d1fae5" iconColor="#10b981" label="Questions Answered" value={totalQuestions} />
          <StatCard icon={CheckCircle} iconBg="#ede9fe" iconColor="#8b5cf6" label="Practice Days" value={practicedDays} />
          <StatCard icon={TrendingUp} iconBg="#dbeafe" iconColor="#3b82f6" label="Technical Score" value={`${avgTechnical}%`} />
          <StatCard icon={Award} iconBg="#fef3c7" iconColor="#f59e0b" label="Communication" value={`${avgConfidence}%`} />
          <div className="stat-card animate-slide-up" style={{ animationDelay: '320ms' }}>
            <div className="stat-card-icon" style={{ background: '#fce7f3' }}>
              <BarChart2 size={18} color="#ec4899" />
            </div>
            <p className="stat-card-label">Best Category</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginTop: 4 }}>{strongestCategory}</p>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {[
            { key: 'technical', color: '#3b82f6', label: 'Technical Progress' },
            { key: 'communication', color: '#10b981', label: 'Communication Progress' }
          ].map(({ key, color, label }) => (
            <div key={key} className="card animate-fade-in">
              <h3 className="card-title">{label}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <ReferenceLine x={currentDayLabel} stroke="#f59e0b" strokeDasharray="4 4"
                    label={{ value: 'Today', position: 'top', fill: '#f59e0b', fontSize: 11 }} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2.5}
                    dot={{ fill: color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }}
                    connectNulls={false} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="card animate-fade-in">
          <h2 className="card-title">Category Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {categoryProgress.map((cat, i) => {
              const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0
              const color = CAT_COLORS[cat.name] || '#10b981'
              return (
                <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span className="badge badge-blue" style={{ background: `${color}18`, color }}>
                        Score: {cat.score}%
                      </span>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{cat.completed}/{cat.total}</span>
                    </div>
                  </div>
                  <div className="progress-bar-track" style={{ height: 8 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Progress
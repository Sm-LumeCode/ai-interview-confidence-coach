import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import api from '../services/api'
import { getProgress } from '../utils/progressManager'
import {
  ChevronRight, Lock, CheckCircle2, PlayCircle,
  ArrowLeft, Clock, Zap, BarChart2
} from 'lucide-react'

const QUESTIONS_PER_SESSION = 5

const CATEGORY_LABELS = {
  software_development: 'Software Development',
  data_analytics:       'Data & Analytics',
  data_science_ml:      'Data Science & ML',
  cloud_devops:         'Cloud & DevOps',
  cybersecurity:        'Cybersecurity',
  hr_round:             'HR Round'
}

const DIFF_STYLE = {
  easy:   { label: 'Easy',   color: '#10b981', bg: '#d1fae5' },
  medium: { label: 'Med.',   color: '#f59e0b', bg: '#fef3c7' },
  hard:   { label: 'Hard',   color: '#ef4444', bg: '#fee2e2' },
}

const SessionList = ({ user, onLogout }) => {
  const { category } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    api.getQuestions(category)
      .then(data => { setQuestions(data); setLoading(false) })
      .catch(() => { setError('Failed to load questions.'); setLoading(false) })
  }, [category])

  // How many questions has the user answered in this category?
  const progress = getProgress(user.email, category)
  const answeredCount = progress?.currentQuestionIndex ?? 0

  // Split all questions into sessions of 5
  const sessions = []
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_SESSION) {
    sessions.push(questions.slice(i, i + QUESTIONS_PER_SESSION))
  }

  const totalSessions = sessions.length
  const completedSessions = Math.floor(answeredCount / QUESTIONS_PER_SESSION)

  const categoryLabel = CATEGORY_LABELS[category] || category.replace(/_/g, ' ')

  // ── Determine status of each session ──────────────────────────────────────
  // completed  = all 5 questions answered
  // active     = currently in progress (or next to start)
  // locked     = not yet reached
  const getSessionStatus = (sessionIdx) => {
    const firstQ = sessionIdx * QUESTIONS_PER_SESSION
    const lastQ  = firstQ + QUESTIONS_PER_SESSION - 1
    if (answeredCount > lastQ) return 'completed'
    if (answeredCount >= firstQ) return 'active'
    return 'locked'
  }

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '3px solid #1e2430', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b' }}>Loading sessions…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 380, textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748b', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 500, marginBottom: 20, padding: 0
        }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">{categoryLabel}</h1>
          <p className="page-subtitle">
            {totalSessions} sessions · {questions.length} total questions · {QUESTIONS_PER_SESSION} per session
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: CheckCircle2, bg: '#d1fae5', color: '#10b981', label: 'Completed Sessions', value: completedSessions },
            { icon: BarChart2,    bg: '#dbeafe', color: '#3b82f6', label: 'Questions Answered',  value: answeredCount },
            { icon: Zap,          bg: '#fef3c7', color: '#f59e0b', label: 'Remaining Sessions',  value: Math.max(0, totalSessions - completedSessions) },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="stat-card">
              <div className="stat-card-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
              <p className="stat-card-label">{label}</p>
              <p className="stat-card-value" style={{ fontSize: 26 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Session list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 80px 100px 80px',
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 11, fontWeight: 700, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.07em'
          }}>
            <span>Session</span>
            <span style={{ textAlign: 'center' }}>Questions</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Difficulty</span>
            <span style={{ textAlign: 'center' }}>Action</span>
          </div>

          {/* Session rows */}
          {sessions.map((sessionQs, sessionIdx) => {
            const status = getSessionStatus(sessionIdx)
            const isLocked = status === 'locked'
            const isDone   = status === 'completed'
            const isActive = status === 'active'

            // Difficulty distribution of this session
            const diffCounts = { easy: 0, medium: 0, hard: 0 }
            sessionQs.forEach(q => {
              const d = (q.difficulty || 'medium').toLowerCase()
              if (diffCounts[d] !== undefined) diffCounts[d]++
            })
            const mainDiff = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0][0]
            const ds = DIFF_STYLE[mainDiff] || DIFF_STYLE.medium

            // Progress within active session
            const sessionStartQ = sessionIdx * QUESTIONS_PER_SESSION
            const doneInSession = Math.max(0, Math.min(QUESTIONS_PER_SESSION, answeredCount - sessionStartQ))

            return (
              <div
                key={sessionIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 80px 100px 80px',
                  padding: '14px 20px',
                  borderBottom: sessionIdx < sessions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  alignItems: 'center',
                  background: isActive ? '#f0fdf4' : 'white',
                  transition: 'background 0.15s',
                  opacity: isLocked ? 0.55 : 1,
                  cursor: isLocked ? 'default' : 'pointer'
                }}
                onMouseEnter={e => { if (!isLocked) e.currentTarget.style.background = isActive ? '#ecfdf5' : '#f8fafc' }}
                onMouseLeave={e => { e.currentTarget.style.background = isActive ? '#f0fdf4' : 'white' }}
                onClick={() => {
                  if (!isLocked) navigate(`/interview/${category}/${sessionIdx}`)
                }}
              >
                {/* Session title + mini progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Session icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? '#d1fae5' : isActive ? '#dbeafe' : '#f1f5f9'
                  }}>
                    {isDone
                      ? <CheckCircle2 size={18} color="#10b981" />
                      : isLocked
                      ? <Lock size={16} color="#94a3b8" />
                      : <PlayCircle size={18} color="#3b82f6" />
                    }
                  </div>

                  <div>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700, fontSize: 14,
                      color: isLocked ? '#94a3b8' : '#0f172a',
                      marginBottom: 3
                    }}>
                      Session {sessionIdx + 1}
                      {isDone && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          background: '#d1fae5', color: '#065f46',
                          padding: '2px 7px', borderRadius: 999
                        }}>COMPLETED</span>
                      )}
                      {isActive && !isDone && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          background: '#dbeafe', color: '#1e40af',
                          padding: '2px 7px', borderRadius: 999
                        }}>IN PROGRESS</span>
                      )}
                    </p>

                    {/* Mini progress bar for active sessions */}
                    {isActive && !isDone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 100, background: '#e2e8f0', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(doneInSession / QUESTIONS_PER_SESSION) * 100}%`,
                            height: '100%', background: '#3b82f6', borderRadius: 999,
                            transition: 'width 0.5s'
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {doneInSession}/{QUESTIONS_PER_SESSION}
                        </span>
                      </div>
                    )}

                    {/* Question titles preview */}
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: isDone || isActive ? 0 : 2 }}>
                      {sessionQs.slice(0, 2).map(q => q.question?.substring(0, 30)).join(' · ')}…
                    </p>
                  </div>
                </div>

                {/* Q count */}
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {QUESTIONS_PER_SESSION}
                </div>

                {/* Status */}
                <div style={{ textAlign: 'center' }}>
                  {isDone
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>✓ Done</span>
                    : isLocked
                    ? <span style={{ fontSize: 11, color: '#94a3b8' }}>🔒 Locked</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>▶ Active</span>
                  }
                </div>

                {/* Difficulty badge */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: ds.color, background: ds.bg,
                    padding: '3px 10px', borderRadius: 999
                  }}>
                    {ds.label}
                  </span>
                </div>

                {/* Action */}
                <div style={{ textAlign: 'center' }}>
                  {isLocked ? (
                    <span style={{ color: '#94a3b8' }}>
                      <Lock size={16} />
                    </span>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/interview/${category}/${sessionIdx}`) }}
                      style={{
                        background: isDone ? '#f1f5f9' : '#10b981',
                        color: isDone ? '#64748b' : 'white',
                        border: 'none', borderRadius: 6,
                        padding: '5px 12px', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                      }}
                    >
                      {isDone ? 'Retry' : 'Start'}
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Badge legend */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 16, fontSize: 12, color: '#94a3b8', alignItems: 'center'
        }}>
          <span>Difficulty: </span>
          {Object.entries(DIFF_STYLE).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
          <span style={{ marginLeft: 'auto' }}>
            Sessions unlock one at a time as you complete them.
          </span>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default SessionList
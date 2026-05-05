import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import api from '../services/api'
import { getProgress } from '../utils/progressManager'
import {
  ChevronRight, Lock, CheckCircle2, PlayCircle,
  ArrowLeft, Clock, Zap, BarChart2, AlertCircle
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

const TypewriterTitle = ({ title }) => {
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [speed, setSpeed] = useState(150)

  useEffect(() => {
    const handleType = () => {
      setText(prev => {
        if (isDeleting) {
          if (prev === '') {
            setIsDeleting(false)
            setSpeed(150)
            return ''
          }
          setSpeed(50)
          return prev.slice(0, -1)
        } else {
          if (prev === title) {
            setIsDeleting(true)
            setSpeed(2000) // Pause at full word
            return prev
          }
          setSpeed(150)
          return title.slice(0, prev.length + 1)
        }
      })
    }

    const timer = setTimeout(handleType, speed)
    return () => clearTimeout(timer)
  }, [text, isDeleting, title, speed])

  return (
    <h1 className="page-title" style={{ fontSize: 32, minHeight: '1.2em', display: 'flex', alignItems: 'center' }}>
      {text}<span style={{ borderRight: '3px solid #10b981', marginLeft: 4, height: '0.8em', animation: 'blink 0.7s infinite' }} />
    </h1>
  )
}

const DIFF_STYLE = {
  easy:      { label: 'Easy',   color: '#10b981', bg: '#d1fae5' },
  medium:    { label: 'Med.',   color: '#f59e0b', bg: '#fef3c7' },
  tough:     { label: 'Tough',  color: '#ef4444', bg: '#fee2e2' },
  hard:      { label: 'Tough',  color: '#ef4444', bg: '#fee2e2' },
  difficult: { label: 'Tough',  color: '#ef4444', bg: '#fee2e2' },
}

const SessionList = ({ user, onLogout }) => {
  const { category } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0) // ← NEW: Simulated progress
  const [error, setError]         = useState('')

  useEffect(() => {
    let interval
    if (loading) {
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval)
            return 95
          }
          const increment = Math.random() * 40
          return Math.min(prev + increment, 95)
        })
      }, 50)
    }

    api.getQuestions(category)
      .then(data => { 
        setLoadingProgress(100)
        setTimeout(() => {
          setQuestions(data)
          setLoading(false) 
        }, 100)
      })
      .catch((err) => { 
        setError(err.message || 'Failed to load questions.')
        setLoading(false) 
      })

    return () => { if (interval) clearInterval(interval) }
  }, [category, loading])

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
  
  // Show 10 sessions initially, add 5 more when 5 are completed
  const visibleSessionsCount = Math.max(10, (Math.floor(completedSessions / 5) + 1) * 5 + 5)
  const visibleSessions = sessions.slice(0, visibleSessionsCount)

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
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <div style={{ 
                height: 8, width: '100%', background: '#e2e8f0', borderRadius: 999, overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  height: '100%', width: `${loadingProgress}%`, 
                  background: 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: 999, transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                }} />
              </div>
              <p style={{ position: 'absolute', right: 0, top: 12, fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                {Math.round(loadingProgress)}%
              </p>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Assembling Sessions
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Preparing {categoryLabel} questions for you…</p>
          </div>
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
            <div style={{ width: 48, height: 48, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={24} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: 18, color: '#0f172a', marginBottom: 8 }}>Failed to Load Questions</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{error} Make sure the backend is running at http://localhost:8000.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Back to Dashboard</button>
              <button 
                onClick={() => {
                  setError('')
                  setLoading(true)
                  api.getQuestions(category)
                    .then(data => { setQuestions(data); setLoading(false) })
                    .catch((err) => { setError(err.message || 'Failed to load questions.'); setLoading(false) })
                }} 
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Try Again
              </button>
            </div>
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
        <div style={{ marginBottom: 32 }}>
          <TypewriterTitle title={categoryLabel} />
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: CheckCircle2, bg: '#d1fae5', color: '#10b981', label: 'Completed Sessions', value: completedSessions },
            { icon: BarChart2,    bg: '#dbeafe', color: '#3b82f6', label: 'Questions Answered',  value: answeredCount },
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
            gridTemplateColumns: '2fr 80px 100px 80px',
            padding: '12px 20px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontSize: 11, fontWeight: 700, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.07em'
          }}>
            <span>Session</span>
            <span style={{ textAlign: 'center' }}>Status</span>
            <span style={{ textAlign: 'center' }}>Difficulty</span>
            <span style={{ textAlign: 'center' }}>Action</span>
          </div>

          {/* Session rows */}
          {visibleSessions.map((sessionQs, sessionIdx) => {
            const status = getSessionStatus(sessionIdx)
            const isLocked = status === 'locked'
            const isDone   = status === 'completed'
            const isActive = status === 'active'

            // Standardized session difficulty distribution (Cycle of 10)
            // Pattern: E, M, E, M, T, E, M, E, M, T (4-4-2 spread)
            const modIdx = sessionIdx % 10
            let mainDiff = 'easy'
            if ([4, 9].includes(modIdx)) {
              mainDiff = 'tough'
            } else if ([1, 3, 6, 8].includes(modIdx)) {
              mainDiff = 'medium'
            }
            
            const ds = DIFF_STYLE[mainDiff] || DIFF_STYLE.medium

            // Progress within active session
            const sessionStartQ = sessionIdx * QUESTIONS_PER_SESSION
            const doneInSession = Math.max(0, Math.min(QUESTIONS_PER_SESSION, answeredCount - sessionStartQ))

            return (
              <div
                key={sessionIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 80px 100px 80px',
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
          {visibleSessions.length < sessions.length && (
            <div style={{
              padding: '24px', textAlign: 'center', background: '#f8fafc',
              borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}>
              <Lock size={20} color="#94a3b8" />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                Complete more sessions to unlock further challenges
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>
                Keep practicing to see what's next!
              </p>
            </div>
          )}
        </div>

        {/* Badge legend */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 16, fontSize: 12, color: '#94a3b8', alignItems: 'center'
        }}>
          <span>Difficulty: </span>
          {Object.entries(DIFF_STYLE).reduce((acc, [k, v]) => {
            if (!acc.find(item => item.label === v.label)) {
              acc.push({ ...v, key: k })
            }
            return acc
          }, []).map((v) => (
            <span key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}

export default SessionList

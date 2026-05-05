import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import api from '../services/api'
import { getProgress, syncProgressFromBackend } from '../utils/progressManager'
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
  const [answeredCount, setAnsweredCount] = useState(0)

  const loadLocalProgress = () => {
    const progress = getProgress(user.email, category)
    setAnsweredCount(progress?.currentQuestionIndex ?? 0)
  }

  useEffect(() => {
    // Load initially
    loadLocalProgress()

    // Sync from backend
    const syncData = async () => {
      try {
        await syncProgressFromBackend(user.email)
        loadLocalProgress()
      } catch (err) {
        console.error("Failed to sync progress:", err)
      }
    }

    if (!user.email?.startsWith('guest_')) {
      syncData()
    }
  }, [user.email, category])

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

  // Split all questions into sessions of 5
  const sessions = []
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_SESSION) {
    sessions.push(questions.slice(i, i + QUESTIONS_PER_SESSION))
  }

  const totalSessions = sessions.length
  const completedSessions = Math.floor(answeredCount / QUESTIONS_PER_SESSION)
  
  // Show 10 unlocked sessions initially, plus 5 locked ones to preview
  const visibleSessionsCount = 10 + Math.floor(completedSessions / 5) * 5 + 5
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

        {/* Session list Roadmap */}
        <div style={{ position: 'relative', maxWidth: 800, margin: '20px auto', paddingLeft: 60 }}>
          {/* Vertical Line on the left */}
          <div style={{
            position: 'absolute',
            left: 20,
            top: 20,
            bottom: 20,
            width: 2,
            background: `linear-gradient(to bottom, #f0fdf4, #10b98133, #f0fdf4)`,
            zIndex: 0
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {visibleSessions.map((sessionQs, sessionIdx) => {
              
              const completedCount = Math.floor(answeredCount / QUESTIONS_PER_SESSION)
              const unlockedLimit = 10 + Math.floor(completedCount / 5) * 5
              
              const isDone = answeredCount > (sessionIdx * QUESTIONS_PER_SESSION + QUESTIONS_PER_SESSION - 1)
              const isLocked = sessionIdx >= unlockedLimit
              const isActive = !isDone && !isLocked

              const modIdx = sessionIdx % 10
              let mainDiff = 'easy'
              if ([4, 9].includes(modIdx)) mainDiff = 'tough'
              else if ([1, 3, 6, 8].includes(modIdx)) mainDiff = 'medium'
              
              const ds = DIFF_STYLE[mainDiff] || DIFF_STYLE.medium

              const sessionStartQ = sessionIdx * QUESTIONS_PER_SESSION
              const doneInSession = Math.max(0, Math.min(QUESTIONS_PER_SESSION, answeredCount - sessionStartQ))

              return (
                <div key={sessionIdx} style={{ position: 'relative' }}>
                  {/* Dot on the line with Glow */}
                  <div style={{
                    position: 'absolute',
                    left: -48,
                    top: 40,
                    width: 18,
                    height: 18,
                    background: 'white',
                    border: `4.5px solid ${isDone ? '#10b981' : isLocked ? '#cbd5e1' : '#3b82f6'}`,
                    borderRadius: '50%',
                    zIndex: 2,
                    boxShadow: isActive ? `0 0 0 6px #3b82f615, 0 0 15px #3b82f625` : 'none'
                  }} />

                  {/* Horizontal Connector Line */}
                  <div style={{
                    position: 'absolute',
                    left: -32,
                    top: 48,
                    width: 32,
                    height: 2,
                    background: isLocked ? '#e2e8f0' : `${isDone ? '#10b981' : '#3b82f6'}33`,
                    zIndex: 1
                  }} />

                  {/* Card */}
                  <button
                    onClick={() => { if (!isLocked) navigate(`/interview/${category}/${sessionIdx}`) }}
                    className="animate-slide-up"
                    style={{
                      width: '100%',
                      animationDelay: `${(sessionIdx % 10) * 80}ms`,
                      background: 'white',
                      border: `1px solid ${isActive ? '#bfdbfe' : '#e2e8f0'}`,
                      borderRadius: 20,
                      padding: '24px 32px',
                      textAlign: 'left',
                      cursor: isLocked ? 'default' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      boxShadow: isActive ? '0 4px 20px rgba(59, 130, 246, 0.08)' : '0 4px 20px rgba(0,0,0,0.03)',
                      opacity: isLocked ? 0.6 : 1,
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = isDone ? '#10b981' : '#3b82f6'
                        e.currentTarget.style.boxShadow = isDone ? '0 12px 30px #10b98115' : '0 12px 30px #3b82f615'
                        e.currentTarget.style.transform = 'translateX(10px)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = isActive ? '#bfdbfe' : '#e2e8f0'
                        e.currentTarget.style.boxShadow = isActive ? '0 4px 20px rgba(59, 130, 246, 0.08)' : '0 4px 20px rgba(0,0,0,0.03)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    {/* Icon Box */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 16,
                      background: isDone ? '#d1fae5' : isLocked ? '#f1f5f9' : '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `inset 0 0 0 1px ${isDone ? '#10b98133' : isLocked ? '#cbd5e1' : '#3b82f633'}`
                    }}>
                      {isDone ? <CheckCircle2 size={30} color="#10b981" /> : isLocked ? <Lock size={26} color="#94a3b8" /> : <PlayCircle size={30} color="#3b82f6" />}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 800, fontSize: 19, color: isLocked ? '#64748b' : '#0f172a'
                        }}>
                          Session {sessionIdx + 1}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: ds.color, background: ds.bg,
                          padding: '3px 10px', borderRadius: 999
                        }}>
                          {ds.label}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>
                        {sessionQs.slice(0, 2).map(q => q.question?.substring(0, 45)).join(' · ')}…
                      </div>

                      {/* Mini progress bar for active sessions */}
                      {isActive && doneInSession > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 140, background: '#e2e8f0', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                            <div style={{
                              width: `${(doneInSession / QUESTIONS_PER_SESSION) * 100}%`,
                              height: '100%', background: '#3b82f6', borderRadius: 999,
                              transition: 'width 0.5s'
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                            {doneInSession}/{QUESTIONS_PER_SESSION}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div style={{ textAlign: 'right', minWidth: 120 }}>
                      {isDone ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', marginBottom: 6, letterSpacing: '0.05em' }}>
                            COMPLETED
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                            Retry <ChevronRight size={14} />
                          </div>
                        </div>
                      ) : isLocked ? (
                        <div style={{
                          background: '#f1f5f9', color: '#94a3b8',
                          padding: '8px 16px', borderRadius: 99,
                          fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em'
                        }}>
                          LOCKED <Lock size={14} />
                        </div>
                      ) : (
                        <div style={{
                          background: '#eff6ff', color: '#3b82f6',
                          padding: '8px 16px', borderRadius: 99,
                          fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em',
                          border: '1px solid #bfdbfe'
                        }}>
                          START <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}
            
            {visibleSessionsCount < sessions.length && (
              <div style={{ position: 'relative', marginTop: 20 }}>
                 <div style={{
                    position: 'absolute', left: -42, top: 24, width: 6, height: 6,
                    background: '#cbd5e1', borderRadius: '50%', zIndex: 2
                  }} />
                 <div style={{
                    position: 'absolute', left: -42, top: 40, width: 6, height: 6,
                    background: '#e2e8f0', borderRadius: '50%', zIndex: 2
                  }} />
                 <div style={{
                    position: 'absolute', left: -42, top: 56, width: 6, height: 6,
                    background: '#f1f5f9', borderRadius: '50%', zIndex: 2
                  }} />
                 
                 <div style={{
                   background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 20, padding: '32px', textAlign: 'center'
                 }}>
                   <Lock size={24} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                   <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 4 }}>More Sessions Locked</p>
                   <p style={{ fontSize: 13, color: '#64748b' }}>Complete 5 more sessions to unlock the next batch.</p>
                 </div>
              </div>
            )}
          </div>
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

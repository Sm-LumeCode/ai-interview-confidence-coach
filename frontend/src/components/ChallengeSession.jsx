import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import { Home, Clock, Trophy, Zap, Target, ArrowLeft, RotateCcw } from 'lucide-react'
import api from '../services/api'
import { saveChallengeResult } from '../utils/ChallengeManager'

const ChallengeSession = ({ user, onLogout }) => {
  const { challengeId } = useParams()
  const navigate = useNavigate()

  const [challenge, setChallenge] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [challengeStarted, setChallengeStarted] = useState(false)

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true); setError('')
        const data = await api.getChallenge(challengeId)
        setChallenge(data)
        setTimeRemaining(data.timeLimit)
      } catch { setError('Failed to load challenge. Please try again.') }
      finally { setLoading(false) }
    }
    fetchChallenge()
  }, [challengeId])

  useEffect(() => {
    let interval = null
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { setTimerActive(false); handleChallengeSubmit(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [timerActive, timeRemaining])

  const startChallenge = () => { setChallengeStarted(true); setTimerActive(true) }

  const handleRecordingComplete = (answerText) => {
    if (!answerText || !challenge.questions[currentQuestionIndex]) { alert('Please provide an answer'); return }
    const q = challenge.questions[currentQuestionIndex]
    const newAnswer = { question: q.question, answer: answerText, keywords: q.keywords || [] }
    const updatedAnswers = [...answers, newAnswer]
    setAnswers(updatedAnswers)
    if (currentQuestionIndex < challenge.totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleChallengeSubmit(updatedAnswers)
    }
  }

  const handleChallengeSubmit = async (finalAnswers = answers) => {
    setTimerActive(false); setEvaluating(true); setError('')
    try {
      const result = await api.evaluateBulk(finalAnswers)
      setResults(result)
      setShowResults(true)
      saveChallengeResult(user.email, challenge.id, result.average_scores.overall_score, challenge.points)
    } catch { setError('Failed to evaluate answers. Make sure the backend is running.') }
    finally { setEvaluating(false) }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const pctRemaining = challenge ? (timeRemaining / challenge.timeLimit) * 100 : 100
  const timerColor = pctRemaining <= 20 ? '#ef4444' : pctRemaining <= 50 ? '#f59e0b' : '#10b981'
  const timerBg = pctRemaining <= 20 ? 'rgba(239,68,68,0.1)' : pctRemaining <= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '3px solid #1e2430', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b' }}>Loading challenge…</p>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 380, textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
            <button onClick={() => navigate('/challenges')} className="btn-primary">Back to Challenges</button>
          </div>
        </main>
      </div>
    )
  }

  // ── START SCREEN ──
  if (!challengeStarted && !showResults) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content">
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button onClick={() => navigate('/challenges')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, marginBottom: 24, padding: 0
            }}>
              <ArrowLeft size={16} /> Back to Challenges
            </button>

            <div className="card animate-slide-up">
              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(245,158,11,0.3)'
                }}>
                  <Trophy size={28} color="white" />
                </div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                  {challenge.title}
                </h1>
                <p style={{ fontSize: 15, color: '#64748b' }}>{challenge.description}</p>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: Clock, color: '#3b82f6', bg: '#dbeafe', label: 'Time Limit', value: fmt(challenge.timeLimit) },
                  { icon: Zap, color: '#8b5cf6', bg: '#ede9fe', label: 'Questions', value: challenge.totalQuestions },
                  { icon: Trophy, color: '#f59e0b', bg: '#fef3c7', label: 'Points', value: challenge.points },
                ].map(({ icon: Icon, color, bg, label, value }) => (
                  <div key={label} style={{ background: bg, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', opacity: 0.9 }}>
                      <Icon size={18} color={color} />
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Rules */}
              <div style={{ background: '#fefbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Target size={13} color="#92400e" /> Challenge Rules</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    `Answer all ${challenge.totalQuestions} questions within ${fmt(challenge.timeLimit)}`,
                    'Timer starts immediately when you begin',
                    'You cannot pause or skip questions',
                    'Final score is based on average performance'
                  ].map((rule, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#78350f', marginBottom: i < 3 ? 6 : 0, display: 'flex', gap: 8 }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>·</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => navigate('/challenges')} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={startChallenge} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  <Trophy size={16} /> Start Challenge
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── RESULTS SCREEN ──
  if (showResults && results) {
    const overall = Math.round(results.average_scores.overall_score)
    const passed = overall >= 70
    const metrics = [
      { label: 'Technical', value: Math.round(results.average_scores.technical_score), color: '#3b82f6', bg: '#dbeafe' },
      { label: 'Structure', value: Math.round(results.average_scores.structure_score), color: '#8b5cf6', bg: '#ede9fe' },
      { label: 'Communication', value: Math.round(results.average_scores.communication_score), color: '#f59e0b', bg: '#fef3c7' },
      { label: 'Confidence', value: Math.round(results.average_scores.confidence_score), color: '#10b981', bg: '#d1fae5' },
    ]

    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="card animate-slide-up">
              {/* Result header */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: passed ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#64748b,#475569)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: passed ? '0 8px 28px rgba(16,185,129,0.35)' : '0 8px 28px rgba(0,0,0,0.2)'
                }}>
                  <Trophy size={32} color="white" />
                </div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                  {passed ? 'Challenge Completed!' : 'Challenge Attempted'}
                </h1>
                <p style={{ fontSize: 14, color: '#64748b' }}>
                  {passed ? `You earned ${challenge.points} points!` : 'Keep practicing to improve your score!'}
                </p>
              </div>

              {/* Overall score ring */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  background: passed ? '#d1fae5' : '#f1f5f9', borderRadius: 16, padding: '20px 40px'
                }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 52, fontWeight: 800, color: passed ? '#065f46' : '#475569', lineHeight: 1 }}>
                    {overall}%
                  </span>
                  <span style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 600 }}>Overall Score</span>
                </div>
              </div>

              {/* Score breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                {metrics.map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color }}>{value}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 1s ease-out' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => navigate('/challenges')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Home size={16} /> Back to Challenges
                </button>
                <button onClick={() => window.location.reload()} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <RotateCcw size={16} /> Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── QUESTION SCREEN ──
  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>{challenge.title}</h1>
            <p className="page-subtitle">Question {currentQuestionIndex + 1} of {challenge.totalQuestions}</p>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: timerBg, border: `1px solid ${timerColor}44`,
            borderRadius: 12, padding: '10px 18px'
          }}>
            <Clock size={18} color={timerColor} />
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: timerColor, lineHeight: 1 }}>
                {fmt(timeRemaining)}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>remaining</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
            <span>{answers.length}/{challenge.totalQuestions} answered</span>
            <span>{Math.round((answers.length / challenge.totalQuestions) * 100)}%</span>
          </div>
          <div className="progress-bar-track" style={{ height: 6 }}>
            <div className="progress-bar-fill" style={{
              width: `${(answers.length / challenge.totalQuestions) * 100}%`,
              background: 'linear-gradient(90deg, #f59e0b, #d97706)'
            }} />
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: '#991b1b', fontSize: 14 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuestionCard
            question={challenge.questions[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={challenge.totalQuestions}
          />

          {!evaluating && <Recorder onRecordingComplete={handleRecordingComplete} />}

          {evaluating && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#0f172a', fontWeight: 600 }}>Evaluating your challenge performance…</p>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Analysing all {challenge.totalQuestions} answers</p>
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default ChallengeSession
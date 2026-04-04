import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import IdealAnswer from './IdealAnswer'
import { ChevronRight, ChevronLeft, Home, RotateCcw, Clock, AlertCircle, Trophy } from 'lucide-react'
import api from '../services/api'
import { saveProgress, getProgress, resetProgress } from '../utils/progressManager'
import { saveDailyProgress } from '../utils/dailyProgressManager'
import { saveCategoryProgress } from '../utils/categoryProgressManager'

const QUESTIONS_PER_SESSION = 5

const CATEGORY_MAP = {
  software_development: 'Software Development',
  data_analytics:       'Data Analytics',
  data_science_ml:      'Data Science & ML',
  cloud_devops:         'Cloud & DevOps',
  cybersecurity:        'Cybersecurity',
  hr_round:             'HR Round'
}

const InterviewSession = ({ user, onLogout }) => {
  const { category, sessionIndex: sessionIndexParam } = useParams()
  const navigate = useNavigate()

  const sessionIndex = sessionIndexParam !== undefined ? parseInt(sessionIndexParam, 10) : 0

  const [allQuestions, setAllQuestions]         = useState([])
  const [sessionQuestions, setSessionQuestions] = useState([])
  const [currentIdx, setCurrentIdx]             = useState(0)
  const [showResults, setShowResults]           = useState(false)
  const [results, setResults]                   = useState(null)
  const [submittedAnswer, setSubmittedAnswer]   = useState('')   // ← NEW: store transcribed answer
  const [idealAnswer, setIdealAnswer]           = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [evaluating, setEvaluating]             = useState(false)
  const [generatingAnswer, setGeneratingAnswer] = useState(false)
  const [generatingFeedback, setGeneratingFeedback] = useState(false)
  const [aiFeedback, setAiFeedback]             = useState(null)
  const [error, setError]                       = useState('')
  const [sessionComplete, setSessionComplete]   = useState(false)

  // Timer
  const [timeRemaining, setTimeRemaining]   = useState(0)
  const [timerActive, setTimerActive]       = useState(false)
  const [timerExpired, setTimerExpired]     = useState(false)
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false)

  // ── Load questions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.getQuestions(category)
        setAllQuestions(data)

        const start = sessionIndex * QUESTIONS_PER_SESSION
        const slice = data.slice(start, start + QUESTIONS_PER_SESSION)
        setSessionQuestions(slice)

        const globalAnswered = getProgress(user.email, category)?.currentQuestionIndex ?? 0
        const sessionStart = sessionIndex * QUESTIONS_PER_SESSION
        const doneInSession = Math.max(0, globalAnswered - sessionStart)
        if (doneInSession > 0 && doneInSession < QUESTIONS_PER_SESSION) {
          setCurrentIdx(doneInSession)
        }
      } catch {
        setError('Failed to load questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [category, sessionIndex, user.email])

  // ── Timer per question ─────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionQuestions.length > 0 && !showResults) {
      const diff = sessionQuestions[currentIdx]?.difficulty || 'medium'
      const time = diff === 'easy' ? 180 : diff === 'hard' ? 480 : 300
      setTimeRemaining(time)
      setTimerActive(true)
      setTimerExpired(false)
    }
  }, [currentIdx, sessionQuestions, showResults])

  useEffect(() => {
    let interval = null
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            setTimerExpired(true)
            setShowTimeUpPopup(true)
            setTimeout(() => { setShowTimeUpPopup(false); handleTimeUpAutoAdvance() }, 2000)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [timerActive, timeRemaining])

  // ── Answer submitted ───────────────────────────────────────────────────────
  const handleRecordingComplete = async (answerText) => {
    if (!answerText || !sessionQuestions[currentIdx]) return
    setTimerActive(false)
    setEvaluating(true)
    setGeneratingAnswer(true)
    setGeneratingFeedback(false)
    setAiFeedback(null)
    setError('')
    setSubmittedAnswer(answerText)   // ← store it for display

    try {
      const q = sessionQuestions[currentIdx]
      const evaluation = await api.evaluateAnswer(q.question, answerText, q.keywords || [])

      saveCategoryProgress(user.email, CATEGORY_MAP[category], evaluation.technical_score, evaluation.communication_score)
      setResults(evaluation)
      saveDailyProgress(user.email, { technicalScore: evaluation.technical_score, confidenceScore: evaluation.communication_score })

      const globalIndex = sessionIndex * QUESTIONS_PER_SESSION + currentIdx + 1
      saveProgress(user.email, category, globalIndex, allQuestions.length)

      setGeneratingFeedback(true)
      api.generateFeedback(q.question, answerText, q.keywords || [], evaluation)
        .then(r => { setAiFeedback(r.feedback); setGeneratingFeedback(false) })
        .catch(() => setGeneratingFeedback(false))

      const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
      setIdealAnswer(ideal)
      setGeneratingAnswer(false)
      setShowResults(true)
      setEvaluating(false)
    } catch {
      setError('Failed to evaluate answer. Make sure the backend is running.')
      setEvaluating(false)
      setGeneratingAnswer(false)
      setGeneratingFeedback(false)
    }
  }

  const handleTimeUpAutoAdvance = async () => {
    if (!sessionQuestions[currentIdx]) return
    setTimerActive(false); setEvaluating(true); setGeneratingAnswer(true)
    const autoAnswer = 'Time ran out - no answer provided'
    setSubmittedAnswer(autoAnswer)
    try {
      const q = sessionQuestions[currentIdx]
      const evaluation = await api.evaluateAnswer(q.question, autoAnswer, q.keywords || [])
      saveCategoryProgress(user.email, CATEGORY_MAP[category] || category, evaluation.technical_score, evaluation.communication_score)
      setResults(evaluation)
      saveDailyProgress(user.email, { technicalScore: evaluation.technical_score, confidenceScore: evaluation.communication_score })
      const globalIndex = sessionIndex * QUESTIONS_PER_SESSION + currentIdx + 1
      saveProgress(user.email, category, globalIndex, allQuestions.length)
      const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
      setIdealAnswer(ideal)
      setShowResults(true)
    } catch {
      setError('Failed to process time up.')
      handleNextQuestion()
    } finally {
      setEvaluating(false); setGeneratingAnswer(false)
    }
  }

  const resetQuestion = () => {
    setShowResults(false); setResults(null); setIdealAnswer(null)
    setAiFeedback(null); setGeneratingFeedback(false); setSubmittedAnswer('')
  }

  const handleNextQuestion = () => {
    resetQuestion()
    if (currentIdx < QUESTIONS_PER_SESSION - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      setSessionComplete(true)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentIdx > 0) { resetQuestion(); setCurrentIdx(currentIdx - 1) }
  }

  const handleResetSession = () => {
    if (window.confirm('Restart this session from Q1? Progress for this session will be lost.')) {
      const globalStart = sessionIndex * QUESTIONS_PER_SESSION
      saveProgress(user.email, category, globalStart, allQuestions.length)
      setCurrentIdx(0); resetQuestion()
    }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const q = sessionQuestions[currentIdx]
  const totalTime = q?.difficulty === 'easy' ? 180 : q?.difficulty === 'hard' ? 480 : 300
  const pct = (timeRemaining / totalTime) * 100
  const timerColor = timeRemaining <= 30 ? '#ef4444' : timeRemaining <= 60 ? '#f59e0b' : '#10b981'
  const timerBg    = timeRemaining <= 30 ? 'rgba(239,68,68,0.1)' : timeRemaining <= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontSize: 15 }}>Loading session…</p>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Session complete screen ────────────────────────────────────────────────
  if (sessionComplete) {
    const nextSession = sessionIndex + 1
    const hasNextSession = nextSession * QUESTIONS_PER_SESSION < allQuestions.length

    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-slide-up" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 28px rgba(16,185,129,0.35)'
            }}>
              <Trophy size={32} color="white" />
            </div>

            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
              Session {sessionIndex + 1} Complete! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              You've answered all 5 questions in this session.
              {hasNextSession ? ' Session ' + (nextSession + 1) + ' is now unlocked!' : ' You\'ve completed all sessions in this category!'}
            </p>

            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 12, padding: '14px 20px', marginBottom: 24,
              display: 'inline-flex', alignItems: 'center', gap: 10
            }}>
              <Trophy size={18} color="#10b981" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
                Session {sessionIndex + 1} Badge Earned!
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => navigate(`/sessions/${category}`)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Home size={15} /> All Sessions
              </button>
              {hasNextSession && (
                <button
                  onClick={() => navigate(`/interview/${category}/${nextSession}`)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Session {nextSession + 1} <ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Main interview UI ──────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 20 }}>
              {CATEGORY_MAP[category] || category} — Session {sessionIndex + 1}
            </h1>
            <p className="page-subtitle">
              Question {currentIdx + 1} of {QUESTIONS_PER_SESSION}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!showResults && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: timerBg, border: `1px solid ${timerColor}44`,
                borderRadius: 12, padding: '10px 16px'
              }}>
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke={timerColor} strokeWidth="3"
                      strokeDasharray={`${(pct / 100) * 100} 100`} strokeLinecap="round" />
                  </svg>
                  <Clock size={14} color={timerColor} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: timerColor, lineHeight: 1 }}>
                    {fmt(timeRemaining)}
                  </div>
                  <span className={`badge ${q?.difficulty === 'easy' ? 'badge-green' : q?.difficulty === 'hard' ? 'badge-red' : 'badge-yellow'}`}
                    style={{ fontSize: 10, marginTop: 3 }}>
                    {(q?.difficulty || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <button onClick={handleResetSession} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>
              <RotateCcw size={13} /> Reset
            </button>
            <button onClick={() => navigate(`/sessions/${category}`)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>
              <Home size={13} /> Sessions
            </button>
          </div>
        </div>

        {/* Session progress bar */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
              Session {sessionIndex + 1} Progress
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {currentIdx}/{QUESTIONS_PER_SESSION} complete
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: QUESTIONS_PER_SESSION }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 999,
                background: i < currentIdx ? '#10b981' : i === currentIdx ? '#3b82f6' : '#e2e8f0',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {Array.from({ length: QUESTIONS_PER_SESSION }).map((_, i) => (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i <= currentIdx ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                Q{i + 1}
              </span>
            ))}
          </div>
        </div>

        {timerExpired && !showResults && !showTimeUpPopup && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ color: '#991b1b', fontWeight: 600, fontSize: 14 }}>⏰ Time's up! Submit your answer.</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: '#991b1b', fontSize: 14 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuestionCard question={q} currentQuestion={currentIdx + 1} totalQuestions={QUESTIONS_PER_SESSION} />

          {!showResults && <Recorder onRecordingComplete={handleRecordingComplete} />}

          {evaluating && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Analysing your response…</p>
            </div>
          )}

          {showResults && !evaluating && results && (
            <>
              {/* ── Transcribed Answer Display ── */}
              <div className="card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Your Answer (Transcribed)</h3>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
                    {submittedAnswer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: '#1e293b', lineHeight: 1.7,
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '14px 16px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {submittedAnswer || '—'}
                </p>
              </div>

              <ResultPanel
                results={results}
                aiFeedback={aiFeedback}
                generatingFeedback={generatingFeedback}
              />

              {generatingAnswer && (
                <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
                  <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: 14 }}>Generating ideal answer…</p>
                </div>
              )}

              {idealAnswer && !generatingAnswer && <IdealAnswer idealAnswer={idealAnswer} />}

              <div className="card" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentIdx === 0}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', opacity: currentIdx === 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <button onClick={handleNextQuestion} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    {currentIdx < QUESTIONS_PER_SESSION - 1
                      ? <> Next Question <ChevronRight size={15} /> </>
                      : <> Complete Session <Trophy size={15} /> </>
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showTimeUpPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 380, textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={32} color="#ef4444" />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Time's Up!</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Moving to next question…</p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default InterviewSession
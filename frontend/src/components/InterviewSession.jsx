import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import IdealAnswer from './IdealAnswer'
import { ChevronRight, ChevronLeft, Home, RotateCcw, Clock, AlertCircle, Trophy, Zap } from 'lucide-react'
import api from '../services/api'
import { saveProgress, getProgress, resetProgress, syncProgressFromBackend } from '../utils/progressManager'
import { saveDailyProgress, syncDailyProgressFromBackend } from '../utils/dailyProgressManager'
import { saveCategoryProgress } from '../utils/categoryProgressManager'
import { incrementChallengeMetric, getChallengeData } from '../utils/ChallengeManager'
import { saveForReview, saveWeakQuestion } from '../utils/improvementsManager'
import { Bookmark, Star } from 'lucide-react'

const QUESTIONS_PER_SESSION = 5

const CATEGORY_MAP = {
  software_development: 'Software Development',
  data_analytics:       'Data Analytics',
  data_science_ml:      'Data Science & ML',
  cloud_devops:         'Cloud & DevOps',
  cybersecurity:        'Cybersecurity',
  hr_round:             'HR Round',
  improvements:         'Personalized Revision'
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
  const [showInstructions, setShowInstructions] = useState(true) // ← NEW: Show instructions first
  const [sessionType, setSessionType]           = useState('easy')
  const [sessionCounts, setSessionCounts]       = useState({ easy: 4, medium: 1, tough: 0 })
  const submissionInFlightRef = useRef(false)
  const recorderRef = useRef(null) // ← NEW: Ref for recorder
  const idealAnswerRequestRef = useRef('')

  // Timer
  const [timeRemaining, setTimeRemaining]   = useState(0)
  const [timerActive, setTimerActive]       = useState(false)
  const [timerExpired, setTimerExpired]     = useState(false)
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0) // ← NEW: for circle progress
  const [isSaved, setIsSaved] = useState(false) // ← NEW: for review later toast

  // ── Load questions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError('')

        // Sync from backend first to handle new devices
        if (user.email && !user.email.startsWith('guest_')) {
          await Promise.all([
            syncProgressFromBackend(user.email),
            syncDailyProgressFromBackend(user.email)
          ]).catch(e => console.error("Session sync failed:", e))
        }

        if (category === 'improvements') {
          // Specialized practice mode for revision
          const saved = await getSavedReviewQuestions(user.email)
          const weak = await getWeakQuestions(user.email)
          const pool = [...saved, ...weak]
          
          if (pool.length === 0) {
            setError('No questions found for revision. Save some questions first!')
            setLoading(false)
            return
          }

          // Shuffle and take 5 (or less if pool is smaller)
          const sampled = pool.sort(() => 0.5 - Math.random()).slice(0, QUESTIONS_PER_SESSION)
          setSessionQuestions(sampled)
          setAllQuestions(pool)
          setSessionType('revision')
          setSessionCounts({ easy: 0, medium: 0, tough: 0, revision: sampled.length })
          setLoading(false)
          return
        }

        const data = await api.getQuestions(category)
        setAllQuestions(data)

        // Determine session type based on index (Cycle of 10)
        // Pattern: E, M, E, M, T, E, M, E, M, T (4-4-2 spread)
        const modIndex = sessionIndex % 10
        let type = 'easy'
        let counts = { easy: 4, medium: 1, tough: 0 }

        if ([4, 9].includes(modIndex)) {
          type = 'tough'
          counts = { easy: 3, medium: 1, tough: 1 }
        } else if ([1, 3, 6, 8].includes(modIndex)) {
          type = 'medium'
          counts = { easy: 3, medium: 2, tough: 0 }
        }

        setSessionType(type)
        setSessionCounts(counts)

        // Split questions into pools
        const easyPool   = data.filter(q => q.difficulty?.toLowerCase() === 'easy')
        const mediumPool = data.filter(q => q.difficulty?.toLowerCase() === 'medium')
        const toughPool  = data.filter(q => q.difficulty?.toLowerCase() === 'hard' || q.difficulty?.toLowerCase() === 'tough')

        const sample = (arr, n) => {
          if (!arr || arr.length === 0) return []
          const shuffled = [...arr].sort(() => 0.5 - Math.random())
          return shuffled.slice(0, n)
        }

        const sampled = [
          ...sample(easyPool, counts.easy),
          ...sample(mediumPool, counts.medium),
          ...sample(toughPool, counts.tough)
        ]
        
        setSessionQuestions(sampled)

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

  // Simulation for loading progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 98) return 98
          const increment = Math.random() * 30
          return Math.min(prev + increment, 98)
        })
      }, 50)
      return () => clearInterval(interval)
    } else {
      setLoadingProgress(100)
    }
  }, [loading])

  // ── Timer per question ─────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionQuestions.length > 0 && !showResults && !showInstructions) { // ← Added !showInstructions
      const diff = (sessionQuestions[currentIdx]?.difficulty || 'medium').toLowerCase()
      const time = (diff === 'easy') ? 180 : (diff === 'hard' || diff === 'difficult') ? 480 : 300
      setTimeRemaining(time)
      setTimerActive(true)
      setTimerExpired(false)
    }
  }, [currentIdx, sessionQuestions, showResults, showInstructions])

  useEffect(() => {
    let interval = null
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            setTimerExpired(true)
            if (recorderRef.current) {
              recorderRef.current.forceSubmit()
            }
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
    if (submissionInFlightRef.current) return
    submissionInFlightRef.current = true

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

      // 1. Save specific category progress (linked to dashboard cards)
      saveCategoryProgress(user.email, category, evaluation.technical_score, evaluation.communication_score)
      
      // 2. Save daily progress timeline
      saveDailyProgress(user.email, { technicalScore: evaluation.technical_score, confidenceScore: evaluation.communication_score })

      // 3. Save roadmap progress (unlocking logic)
      const globalIndex = sessionIndex * QUESTIONS_PER_SESSION + currentIdx + 1
      saveProgress(user.email, category, globalIndex, allQuestions.length)
      
      setResults(evaluation)
      
      // Auto-save weak questions if scores are low (<60%)
      if (evaluation.technical_score < 60 || evaluation.communication_score < 60) {
        saveWeakQuestion(user.email, {
          question: q.question,
          category: q.category || category, // Use original category if available
          previousAnswer: answerText,
          technicalScore: evaluation.technical_score,
          confidenceScore: evaluation.communication_score
        })
      }

      // --- Challenge Logic ---
      if (evaluation.communication_score >= 95) {
        incrementChallengeMetric(user.email, 'communication-expert', 1)
      }
      if (evaluation.overall_score === 100 || evaluation.technical_score === 100) {
        incrementChallengeMetric(user.email, 'perfect-score', 1)
      }
      
      const qTime = sessionQuestions[currentIdx]?.difficulty === 'easy' ? 180 : sessionQuestions[currentIdx]?.difficulty === 'hard' ? 480 : 300;
      if (qTime - timeRemaining < 120) {
        incrementChallengeMetric(user.email, 'speed-demon', 1)
      }
      // -----------------------

      setShowResults(true)
      setEvaluating(false)
      submissionInFlightRef.current = false

      setGeneratingFeedback(true)
      api.generateFeedback(q.question, answerText, q.keywords || [], evaluation)
        .then(r => setAiFeedback(r.feedback))
        .catch(() => {})
        .finally(() => setGeneratingFeedback(false))

      const idealRequestKey = `${category}:${sessionIndex}:${currentIdx}:${q.question}`
      idealAnswerRequestRef.current = idealRequestKey
      try {
        const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
        if (idealAnswerRequestRef.current === idealRequestKey) {
          setIdealAnswer(ideal)
        }
      } catch {
        if (idealAnswerRequestRef.current) {
          setIdealAnswer(null)
        }
      } finally {
        if (idealAnswerRequestRef.current === idealRequestKey) {
          setGeneratingAnswer(false)
        }
      }
    } catch {
      setError('Failed to evaluate answer. Make sure the backend is running.')
      setEvaluating(false)
      setGeneratingAnswer(false)
      setGeneratingFeedback(false)
    } finally {
      submissionInFlightRef.current = false
    }
  }

  const handleTimeUpAutoAdvance = async () => {
    if (!sessionQuestions[currentIdx]) return
    if (submissionInFlightRef.current) return
    submissionInFlightRef.current = true

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
      setShowResults(true)
      setEvaluating(false)
      submissionInFlightRef.current = false

      const idealRequestKey = `${category}:${sessionIndex}:${currentIdx}:${q.question}`
      idealAnswerRequestRef.current = idealRequestKey
      try {
        const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
        if (idealAnswerRequestRef.current === idealRequestKey) {
          setIdealAnswer(ideal)
        }
      } catch {
        if (idealAnswerRequestRef.current) {
          setIdealAnswer(null)
        }
      } finally {
        if (idealAnswerRequestRef.current === idealRequestKey) {
          setGeneratingAnswer(false)
        }
      }
    } catch {
      setError('Failed to process time up.')
      setGeneratingAnswer(false)
      handleNextQuestion()
    } finally {
      setEvaluating(false)
      submissionInFlightRef.current = false
    }
  }

  const resetQuestion = () => {
    idealAnswerRequestRef.current = ''
    setShowResults(false); setResults(null); setIdealAnswer(null)
    setAiFeedback(null); setGeneratingFeedback(false); setSubmittedAnswer('')
    setIsSaved(false)
  }

  const handleReviewLater = async () => {
    if (isSaved) return
    try {
      const q = sessionQuestions[currentIdx]
      await saveForReview(user.email, {
        question: q.question,
        category: category,
        previousAnswer: submittedAnswer,
        technicalScore: results.technical_score,
        confidenceScore: results.communication_score
      })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save for review:", err)
    }
  }

  const handleNextQuestion = () => {
    resetQuestion()
    if (currentIdx < QUESTIONS_PER_SESSION - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      setSessionComplete(true)
      // Session finished
      incrementChallengeMetric(user.email, 'first-victory', 1)
      
      // Check if category is completed
      const progress = getProgress(user.email, category);
      if (progress && progress.currentQuestionIndex >= progress.totalQuestions) {
        incrementChallengeMetric(user.email, 'category-master', 1)
      }
    }
  }

  const handlePreviousQuestion = () => {
    if (currentIdx > 0) { resetQuestion(); setCurrentIdx(currentIdx - 1) }
  }

  const handleResetSession = () => {
    const globalStart = sessionIndex * QUESTIONS_PER_SESSION
    saveProgress(user.email, category, globalStart, allQuestions.length)
    setCurrentIdx(0); resetQuestion()
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const q = sessionQuestions[currentIdx]
  const totalTime = q?.difficulty === 'easy' ? 180 : q?.difficulty === 'hard' ? 480 : 300
  const pct = (timeRemaining / totalTime) * 100
  const timerColor = timeRemaining <= 30 ? '#ef4444' : timeRemaining <= 60 ? '#f59e0b' : '#10b981'
  const timerBg    = timeRemaining <= 30 ? 'rgba(239,68,68,0.1)' : timeRemaining <= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'

  // ── Instructions Modal ───────────────────────────────────────────────────
  if (showInstructions) {
    const totalMinutes = (sessionCounts.easy * 3) + (sessionCounts.medium * 5) + (sessionCounts.tough * 8)

    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-slide-up" style={{ maxWidth: 480, textAlign: 'center', padding: '40px 32px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Zap size={32} color="#10b981" />
            </div>

            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: '#0f172a', marginBottom: 12 }}>
              Session Instructions
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
              This session consists of 5 questions designed to test your knowledge across different levels.
            </p>

            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 12, padding: '20px', marginBottom: 32 }}>
              {sessionCounts.easy > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>• {sessionCounts.easy} Easy Questions</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>3 min each</span>
                </div>
              )}
              {sessionCounts.medium > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>• {sessionCounts.medium} Medium Question{sessionCounts.medium > 1 ? 's' : ''}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>5 min each</span>
                </div>
              )}
              {sessionCounts.tough > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>• {sessionCounts.tough} Tough Question{sessionCounts.tough > 1 ? 's' : ''}</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>8 min each</span>
                </div>
              )}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>Total Session Time</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalMinutes} Minutes</span>
              </div>
            </div>

            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
              All the best! 👍
            </p>

            <button
              onClick={() => setShowInstructions(false)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Start the Session
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    const radius = 30
    const circum = 2 * Math.PI * radius
    const offset = circum - (loadingProgress / 100) * circum

    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r={radius} fill="none" stroke="#10b981" strokeWidth="5"
                  strokeDasharray={circum}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: '#10b981'
              }}>
                {Math.round(loadingProgress)}%
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500 }}>Preparing your questions…</p>
          </div>
        </main>
      </div>
    )
  }

  // ── Session complete screen ────────────────────────────────────────────────
  if (sessionComplete) {
    const nextSession = sessionIndex + 1
    const hasNextSession = false // Always hide next session button

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
                background: timerBg, border: `1.5px solid ${timerColor}88`,
                borderRadius: 999, padding: '6px 16px',
                boxShadow: `0 2px 8px ${timerColor}15`
              }}>
                <Clock size={16} color={timerColor} />
                <div style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif", 
                  fontSize: 20, fontWeight: 800, color: timerColor, 
                  letterSpacing: '-0.5px' 
                }}>
                  {fmt(timeRemaining)}
                </div>
                <div style={{ width: 1, height: 16, background: timerColor, opacity: 0.2 }} />
                <span style={{ 
                  fontSize: 9, fontWeight: 800, color: timerColor, 
                  textTransform: 'uppercase', letterSpacing: '0.05em' 
                }}>
                  {(q?.difficulty || 'medium').toUpperCase()}
                </span>
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

          {!showResults && <Recorder ref={recorderRef} onRecordingComplete={handleRecordingComplete} />}

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

              <div className="card" style={{ padding: '16px 24px', position: 'relative' }}>
                <AnimatePresence>
                  {isSaved && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ 
                        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                        background: '#10b981', color: 'white', padding: '6px 16px', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', gap: 6, zIndex: 100
                      }}
                    >
                      <Star size={14} fill="white" /> Added to Improvements
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentIdx === 0}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', opacity: currentIdx === 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  
                  <button 
                    onClick={handleReviewLater} 
                    className="btn-secondary" 
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      background: isSaved ? '#f0fdf4' : 'white',
                      borderColor: isSaved ? '#10b981' : '#e2e8f0',
                      color: isSaved ? '#10b981' : '#475569'
                    }}
                  >
                    <Bookmark size={15} fill={isSaved ? '#10b981' : 'none'} /> {isSaved ? 'Saved' : 'Review Later'}
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


      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default InterviewSession

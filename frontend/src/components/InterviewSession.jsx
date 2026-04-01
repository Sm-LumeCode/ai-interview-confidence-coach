import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import IdealAnswer from './IdealAnswer'
import { ChevronRight, ChevronLeft, Home, RotateCcw, Clock, AlertCircle } from 'lucide-react'
import api from '../services/api'
import { saveProgress, getProgress, resetProgress } from '../utils/progressManager'
import { saveDailyProgress } from '../utils/dailyProgressManager'
import { saveCategoryProgress } from '../utils/categoryProgressManager'

const CATEGORY_MAP = {
  software_development: 'Software Development',
  data_analytics: 'Data Analytics',
  data_science_ml: 'Data Science & ML',
  cloud_devops: 'Cloud & DevOps',
  cybersecurity: 'Cybersecurity',
  hr_round: 'HR Round'
}

const InterviewSession = ({ user, onLogout }) => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [idealAnswer, setIdealAnswer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [generatingAnswer, setGeneratingAnswer] = useState(false)
  const [generatingFeedback, setGeneratingFeedback] = useState(false)
  const [aiFeedback, setAiFeedback] = useState(null)
  const [error, setError] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timerExpired, setTimerExpired] = useState(false)
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.getQuestions(category)
        setQuestions(data)
        const saved = getProgress(user.email, category)
        if (saved && saved.currentQuestionIndex < data.length) {
          setCurrentQuestionIndex(saved.currentQuestionIndex)
        }
      } catch (err) {
        setError('Failed to load questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [category, user.email])

  useEffect(() => {
    if (questions.length > 0 && !showResults) {
      const diff = questions[currentQuestionIndex]?.difficulty || 'medium'
      const time = diff === 'easy' ? 180 : diff === 'hard' ? 480 : 300
      setTimeRemaining(time)
      setTimerActive(true)
      setTimerExpired(false)
    }
  }, [currentQuestionIndex, questions, showResults])

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

  const handleRecordingComplete = async (answerText) => {
    if (!answerText || !questions[currentQuestionIndex]) return
    setTimerActive(false)
    setEvaluating(true)
    setGeneratingAnswer(true)
    setGeneratingFeedback(false)
    setAiFeedback(null)
    setError('')
    try {
      const q = questions[currentQuestionIndex]
      const evaluation = await api.evaluateAnswer(q.question, answerText, q.keywords || [])
      saveCategoryProgress(user.email, CATEGORY_MAP[category], evaluation.technical_score, evaluation.communication_score)
      setResults(evaluation)
      saveDailyProgress(user.email, { technicalScore: evaluation.technical_score, confidenceScore: evaluation.communication_score })
      setGeneratingFeedback(true)
      api.generateFeedback(q.question, answerText, q.keywords || [], evaluation)
        .then(r => { setAiFeedback(r.feedback); setGeneratingFeedback(false) })
        .catch(() => setGeneratingFeedback(false))
      const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
      setIdealAnswer(ideal)
      setGeneratingAnswer(false)
      setShowResults(true)
      setEvaluating(false)
      saveProgress(user.email, category, currentQuestionIndex + 1, questions.length)
    } catch (err) {
      setError('Failed to evaluate answer. Make sure the backend is running.')
      setEvaluating(false)
      setGeneratingAnswer(false)
      setGeneratingFeedback(false)
    }
  }

  const handleTimeUpAutoAdvance = async () => {
    if (!questions[currentQuestionIndex]) return
    setTimerActive(false)
    setEvaluating(true)
    setGeneratingAnswer(true)
    try {
      const q = questions[currentQuestionIndex]
      const evaluation = await api.evaluateAnswer(q.question, 'Time ran out - no answer provided', q.keywords || [])
      saveCategoryProgress(user.email, CATEGORY_MAP[category] || category, evaluation.technical_score, evaluation.communication_score)
      setResults(evaluation)
      saveDailyProgress(user.email, { technicalScore: evaluation.technical_score, confidenceScore: evaluation.communication_score })
      const ideal = await api.generateIdealAnswer(q.question, q.keywords || [])
      setIdealAnswer(ideal)
      setShowResults(true)
      saveProgress(user.email, category, currentQuestionIndex + 1, questions.length)
    } catch (err) {
      setError('Failed to process time up.')
      handleNextQuestion()
    } finally {
      setEvaluating(false)
      setGeneratingAnswer(false)
    }
  }

  const resetQuestion = () => {
    setShowResults(false)
    setResults(null)
    setIdealAnswer(null)
    setAiFeedback(null)
    setGeneratingFeedback(false)
  }

  const handleNextQuestion = () => {
    resetQuestion()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      alert('Interview session complete! Check your analytics for detailed insights.')
      resetProgress(user.email, category)
      navigate('/dashboard')
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      resetQuestion()
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleResetProgress = () => {
    if (window.confirm('Restart from the beginning? Your progress will be lost.')) {
      resetProgress(user.email, category)
      setCurrentQuestionIndex(0)
      resetQuestion()
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const timerColor = timeRemaining <= 30 ? '#ef4444' : timeRemaining <= 60 ? '#f59e0b' : '#10b981'
  const timerBg = timeRemaining <= 30 ? '#fee2e2' : timeRemaining <= 60 ? '#fef3c7' : '#d1fae5'
  const q = questions[currentQuestionIndex]
  const totalTime = q?.difficulty === 'easy' ? 180 : q?.difficulty === 'hard' ? 480 : 300
  const pct = (timeRemaining / totalTime) * 100

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar user={user} onLogout={onLogout} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#10b981',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748b', fontSize: 15 }}>Loading questions…</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content">
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>
              {(CATEGORY_MAP[category] || category).toUpperCase()} Interview
            </h1>
            <p className="page-subtitle">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Timer */}
            {!showResults && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: timerBg, border: `1px solid ${timerColor}44`,
                borderRadius: 12, padding: '10px 16px'
              }}>
                {/* Circular */}
                <div style={{ position: 'relative', width: 44, height: 44 }}>
                  <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke={timerColor} strokeWidth="3"
                      strokeDasharray={`${(pct / 100) * 113} 113`} strokeLinecap="round" />
                  </svg>
                  <Clock size={16} color={timerColor} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, color: timerColor, lineHeight: 1 }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <span className={`badge ${q?.difficulty === 'easy' ? 'badge-green' : q?.difficulty === 'hard' ? 'badge-red' : 'badge-yellow'}`}
                    style={{ fontSize: 10, marginTop: 3 }}>
                    {(q?.difficulty || 'medium').toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <button onClick={handleResetProgress} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
              <Home size={14} /> Home
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
            <span>Progress</span>
            <span>{Math.round((currentQuestionIndex / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar-track" style={{ height: 6 }}>
            <div className="progress-bar-fill" style={{
              width: `${(currentQuestionIndex / questions.length) * 100}%`,
              background: 'linear-gradient(90deg, #10b981, #059669)'
            }} />
          </div>
        </div>

        {/* Time's up banner */}
        {timerExpired && !showResults && !showTimeUpPopup && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10
          }}>
            <AlertCircle size={18} color="#ef4444" />
            <span style={{ color: '#991b1b', fontWeight: 600, fontSize: 14 }}>⏰ Time's up! Submit your answer.</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ color: '#991b1b', fontSize: 14 }}>{error}</p>
          </div>
        )}

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <QuestionCard question={q} currentQuestion={currentQuestionIndex + 1} totalQuestions={questions.length} />

          {!showResults && <Recorder onRecordingComplete={handleRecordingComplete} />}

          {evaluating && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{
                width: 48, height: 48, border: '3px solid #e2e8f0', borderTopColor: '#10b981',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
              }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Analyzing your response…</p>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>This takes just a moment</p>
            </div>
          )}

          {showResults && !evaluating && results && (
            <>
              <ResultPanel results={results} aiFeedback={aiFeedback} generatingFeedback={generatingFeedback} />

              {generatingAnswer && (
                <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
                  <div style={{
                    width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#10b981',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
                  }} />
                  <p style={{ color: '#64748b', fontSize: 14 }}>Generating ideal answer…</p>
                </div>
              )}

              {idealAnswer && !generatingAnswer && <IdealAnswer idealAnswer={idealAnswer} />}

              {/* Nav buttons */}
              <div className="card" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', opacity: currentQuestionIndex === 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button onClick={handleNextQuestion} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>Next Question <ChevronRight size={16} /></>
                    ) : (
                      <>Complete <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Time up modal */}
      {showTimeUpPopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 40, maxWidth: 380,
            textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
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
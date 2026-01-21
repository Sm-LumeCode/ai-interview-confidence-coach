import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import IdealAnswer from './IdealAnswer'
import { ChevronRight, ChevronLeft, Home, RotateCcw, Clock } from 'lucide-react'
import api from '../services/api'
import { saveProgress, getProgress, resetProgress } from '../utils/progressManager'
import { saveDailyProgress } from '../utils/dailyProgressManager'
import { saveCategoryProgress } from '../utils/categoryProgressManager'

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
  
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timerExpired, setTimerExpired] = useState(false)
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false)

  // Load questions and restore progress
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.getQuestions(category)
        setQuestions(data)
        
        const savedProgress = getProgress(user.email, category)
        if (savedProgress && savedProgress.currentQuestionIndex < data.length) {
          setCurrentQuestionIndex(savedProgress.currentQuestionIndex)
        }
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Failed to load questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [category, user.email])

  // Start timer when question loads
  useEffect(() => {
    if (questions.length > 0 && !showResults) {
      const currentQuestion = questions[currentQuestionIndex]
      const difficulty = currentQuestion?.difficulty || 'medium'
      
      let time = 300
      if (difficulty === 'easy') time = 180
      else if (difficulty === 'hard') time = 480
      
      setTimeRemaining(time)
      setTimerActive(true)
      setTimerExpired(false)
    }
  }, [currentQuestionIndex, questions, showResults])

  // Timer countdown
  useEffect(() => {
    let interval = null

    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            setTimerExpired(true)
            setShowTimeUpPopup(true)

            setTimeout(() => {
              setShowTimeUpPopup(false)
              handleTimeUpAutoAdvance()
            }, 2000)

            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeRemaining])

  const handleRecordingComplete = async (answerText) => {
    if (!answerText || !questions[currentQuestionIndex]) {
      alert('Please provide an answer')
      return
    }

    setTimerActive(false)
    setEvaluating(true)
    setGeneratingAnswer(true)
    setGeneratingFeedback(false)
    setAiFeedback(null)
    setError('')
    
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // STEP 1: Fast evaluation (<2 seconds) - Get scores immediately
      console.log('⚡ Starting fast evaluation...')
      const evaluationStartTime = Date.now()
      
      const evaluation = await api.evaluateAnswer(
        currentQuestion.question,
        answerText,
        currentQuestion.keywords || []
      )
      
      const evaluationTime = Date.now() - evaluationStartTime
      console.log(`✅ Evaluation completed in ${evaluationTime}ms`)
      
      // Save scores and display results immediately
      const normalizedCategory = category
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

      saveCategoryProgress(
        user.email,
        normalizedCategory,
        evaluation.technical_score,
        evaluation.communication_score
      )
      
      setResults(evaluation)

      saveDailyProgress(user.email, {
        technicalScore: evaluation.technical_score,
        confidenceScore: evaluation.communication_score
      })

      // STEP 2: Generate ideal answer (parallel with AI feedback)
      const idealAnswerPromise = api.generateIdealAnswer(
        currentQuestion.question,
        currentQuestion.keywords || []
      )
      
      // STEP 3: Generate AI feedback (separate, non-blocking)
      // Start feedback generation in background
      console.log('🤖 Starting AI feedback generation...')
      setGeneratingFeedback(true)
      
      const feedbackPromise = api.generateFeedback(
        currentQuestion.question,
        answerText,
        currentQuestion.keywords || [],
        evaluation
      ).then(feedbackResult => {
        console.log(`✅ AI feedback received (method: ${feedbackResult.method})`)
        setAiFeedback(feedbackResult.feedback)
        setGeneratingFeedback(false)
        return feedbackResult
      }).catch(err => {
        console.error('AI feedback generation failed:', err)
        setGeneratingFeedback(false)
        // Don't fail the whole flow - just show scores without AI feedback
        return null
      })
      
      // Wait for ideal answer
      const ideal = await idealAnswerPromise
      setIdealAnswer(ideal)
      setGeneratingAnswer(false)
      
      // Show results immediately (AI feedback will appear when ready)
      setShowResults(true)
      setEvaluating(false)
      
      // Save progress
      saveProgress(user.email, category, currentQuestionIndex + 1, questions.length)
      
      // AI feedback will update when ready (via feedbackPromise)
      
    } catch (err) {
      console.error('Evaluation error:', err)
      setError('Failed to evaluate answer. Make sure Ollama is running.')
      alert('Evaluation failed. Please check if Ollama is running on http://localhost:11434')
      setEvaluating(false)
      setGeneratingAnswer(false)
      setGeneratingFeedback(false)
    }
  }

  const handleNextQuestion = () => {
    setShowResults(false)
    setResults(null)
    setIdealAnswer(null)
    setAiFeedback(null)
    setGeneratingFeedback(false)
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      alert('Interview session complete! Check your progress page for detailed analytics.')
      resetProgress(user.email, category)
      navigate('/dashboard')
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setShowResults(false)
      setResults(null)
      setIdealAnswer(null)
      setAiFeedback(null)
      setGeneratingFeedback(false)
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleGoHome = () => {
    navigate('/dashboard')
  }

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to restart from the beginning? Your progress will be lost.')) {
      resetProgress(user.email, category)
      setCurrentQuestionIndex(0)
      setShowResults(false)
      setResults(null)
      setIdealAnswer(null)
      setAiFeedback(null)
      setGeneratingFeedback(false)
    }
  }

  const handleTimeUpAutoAdvance = async () => {
    if (questions[currentQuestionIndex]) {
      setTimerActive(false)
      setEvaluating(true)
      setGeneratingAnswer(true)
      setGeneratingFeedback(false)
      setError('')

      try {
        const currentQuestion = questions[currentQuestionIndex]

        const evaluation = await api.evaluateAnswer(
          currentQuestion.question,
          "Time ran out - no answer provided",
          currentQuestion.keywords || []
        )

        const normalizedCategory = category
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        saveCategoryProgress(
          user.email,
          normalizedCategory,
          evaluation.technical_score,
          evaluation.communication_score
        )

        setResults(evaluation)

        saveDailyProgress(user.email, {
          technicalScore: evaluation.technical_score,
          confidenceScore: evaluation.communication_score
        })

        const ideal = await api.generateIdealAnswer(
          currentQuestion.question,
          currentQuestion.keywords || []
        )

        setIdealAnswer(ideal)
        setShowResults(true)

        saveProgress(user.email, category, currentQuestionIndex + 1, questions.length)
      } catch (err) {
        console.error('Time up evaluation error:', err)
        setError('Failed to process time up. Moving to next question.')
        saveProgress(user.email, category, currentQuestionIndex + 1, questions.length)
        handleNextQuestion()
      } finally {
        setEvaluating(false)
        setGeneratingAnswer(false)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeRemaining <= 30) return 'text-red-600'
    if (timeRemaining <= 60) return 'text-orange-600'
    return 'text-green-600'
  }

  const getTimerBgColor = () => {
    if (timeRemaining <= 30) return 'bg-red-50 border-red-300'
    if (timeRemaining <= 60) return 'bg-orange-50 border-orange-300'
    return 'bg-green-50 border-green-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading questions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="card max-w-md text-center">
            <p className="text-red-600 text-lg">{error}</p>
            <button onClick={handleGoHome} className="btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = getProgress(user.email, category)
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {category.replace(/_/g, ' ').toUpperCase()} Interview
            </h1>
            {progress && (
              <p className="text-white text-sm mt-1 opacity-90">
                Progress: {currentQuestionIndex} of {questions.length} questions completed
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!showResults && (
              <div className={`relative inline-flex items-center gap-4 px-6 py-4 rounded-2xl border-2 shadow-xl backdrop-blur-sm ${getTimerBgColor()} transition-all duration-300 hover:shadow-2xl`}>
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-300"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${((timeRemaining / (currentQuestion?.difficulty === 'easy' ? 180 : currentQuestion?.difficulty === 'hard' ? 480 : 300)) * 100)}, 100`}
                      className={`${getTimerColor()} transition-all duration-1000 ease-linear`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className={`w-6 h-6 ${getTimerColor()}`} />
                  </div>
                </div>

                <div className="text-center">
                  <div className={`text-3xl font-bold ${getTimerColor()} tabular-nums leading-none tracking-wider`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                      currentQuestion?.difficulty === 'easy' ? 'bg-green-100 text-green-800 border border-green-200' :
                      currentQuestion?.difficulty === 'hard' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {currentQuestion?.difficulty?.toUpperCase() || 'MEDIUM'}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">
                      {currentQuestion?.difficulty === 'easy' ? '3 min' :
                       currentQuestion?.difficulty === 'hard' ? '8 min' :
                       '5 min'}
                    </span>
                  </div>
                </div>

                {timeRemaining <= 30 && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-red-400 animate-ping opacity-20"></div>
                )}
              </div>
            )}

            {isLastQuestion && (
              <button
                onClick={handleResetProgress}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                title="Restart from beginning"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            )}
            <button
              onClick={handleGoHome}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
          </div>
        </div>

        {timerExpired && !showResults && !showTimeUpPopup && (
          <div className="mb-4">
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <Clock className="w-6 h-6" />
              <span className="font-bold text-lg">⏰ Time's up! Please submit your answer.</span>
            </div>
          </div>
        )}

        {showTimeUpPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md mx-4 animate-bounce">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Time's Up!</h2>
                <p className="text-gray-600">Moving to the next question automatically...</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-500 h-2 rounded-full transition-all duration-2000 ease-linear animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-500"
              style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <QuestionCard
            question={currentQuestion}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          {!showResults && (
            <Recorder onRecordingComplete={handleRecordingComplete} />
          )}

          {evaluating && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">⚡ Analyzing your response...</p>
              <p className="text-gray-500 text-sm mt-2">
                Fast evaluation in progress (should complete in &lt;2s)
              </p>
            </div>
          )}

          {showResults && !evaluating && results && (
            <>
              <ResultPanel 
                results={results} 
                aiFeedback={aiFeedback}
                generatingFeedback={generatingFeedback}
              />
              
              {generatingAnswer && (
                <div className="card text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating ideal answer...</p>
                </div>
              )}

              {idealAnswer && !generatingAnswer && (
                <IdealAnswer idealAnswer={idealAnswer} />
              )}
              
              <div className="card">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 ${
                      currentQuestionIndex === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous Question
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 btn-primary inline-flex items-center justify-center gap-2"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ChevronRight className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        Complete Interview
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterviewSession
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import { ChevronRight, Home, Clock, Trophy, Zap } from 'lucide-react'
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
  
  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [challengeStarted, setChallengeStarted] = useState(false)

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.getChallenge(challengeId)
        setChallenge(data)
        setTimeRemaining(data.timeLimit)
      } catch (err) {
        console.error('Error fetching challenge:', err)
        setError('Failed to load challenge. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchChallenge()
  }, [challengeId])

  // Timer countdown
  useEffect(() => {
    let interval = null
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            handleChallengeSubmit()
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

  const startChallenge = () => {
    setChallengeStarted(true)
    setTimerActive(true)
  }

  const handleRecordingComplete = (answerText) => {
    if (!answerText || !challenge.questions[currentQuestionIndex]) {
      alert('Please provide an answer')
      return
    }

    const currentQuestion = challenge.questions[currentQuestionIndex]
    
    // Save answer
    const newAnswer = {
      question: currentQuestion.question,
      answer: answerText,
      keywords: currentQuestion.keywords || []
    }
    
    setAnswers([...answers, newAnswer])

    // Move to next question or submit
    if (currentQuestionIndex < challenge.totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered - submit for evaluation
      handleChallengeSubmit([...answers, newAnswer])
    }
  }

  const handleChallengeSubmit = async (finalAnswers = answers) => {
    setTimerActive(false)
    setEvaluating(true)
    setError('')

    try {
      // Bulk evaluate all answers
      const result = await api.evaluateBulk(finalAnswers)
      
      setResults(result)
      setShowResults(true)
      
      saveChallengeResult(
      user.email,
      challenge.id,
      result.average_scores.overall_score,
      challenge.points
    )
    } catch (err) {
      console.error('Evaluation error:', err)
      setError('Failed to evaluate answers. Make sure Ollama is running.')
      alert('Evaluation failed. Please check if Ollama is running.')
    } finally {
      setEvaluating(false)
    }
  }

  const saveChallengeProgress = (chalId, score) => {
    const key = `challenge_${user.email}_${chalId}`
    const existing = localStorage.getItem(key)
    
    const progress = existing ? JSON.parse(existing) : { attempts: 0, bestScore: 0 }
    progress.attempts += 1
    progress.bestScore = Math.max(progress.bestScore, score)
    progress.lastAttempt = new Date().toISOString()
    
    localStorage.setItem(key, JSON.stringify(progress))
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const percentRemaining = (timeRemaining / (challenge?.timeLimit || 1)) * 100
    if (percentRemaining <= 20) return 'text-red-600'
    if (percentRemaining <= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  const getTimerBgColor = () => {
    const percentRemaining = (timeRemaining / (challenge?.timeLimit || 1)) * 100
    if (percentRemaining <= 20) return 'bg-red-50 border-red-300'
    if (percentRemaining <= 50) return 'bg-orange-50 border-orange-300'
    return 'bg-green-50 border-green-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading challenge...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="card max-w-md text-center">
            <p className="text-red-600 text-lg">{error}</p>
            <button onClick={() => navigate('/challenges')} className="btn-primary mt-4">
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Start Screen
  if (!challengeStarted && !showResults) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="card animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{challenge.title}</h1>
              <p className="text-xl text-gray-600">{challenge.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Time Limit</p>
                <p className="text-2xl font-bold text-gray-800">{formatTime(challenge.timeLimit)}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-800">{challenge.totalQuestions}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Points</p>
                <p className="text-2xl font-bold text-gray-800">{challenge.points}</p>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <h3 className="font-bold text-amber-800 mb-2">Challenge Rules:</h3>
              <ul className="list-disc list-inside text-amber-700 space-y-1">
                <li>Answer all {challenge.totalQuestions} questions within {formatTime(challenge.timeLimit)}</li>
                <li>Timer starts immediately when you begin</li>
                <li>You cannot pause or skip questions</li>
                <li>Final score is based on average performance</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/challenges')}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={startChallenge}
                className="flex-2 btn-primary flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results Screen
  if (showResults && results) {
    const passed = results.average_scores.overall_score >= 70
    
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="card animate-fade-in">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${
                passed ? 'from-green-400 to-emerald-500' : 'from-gray-400 to-gray-500'
              } flex items-center justify-center mx-auto mb-4`}>
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {passed ? 'Challenge Completed!' : 'Challenge Attempted'}
              </h1>
              <p className="text-xl text-gray-600">
                {passed ? `You earned ${challenge.points} points!` : 'Keep practicing to improve!'}
              </p>
            </div>

            {/* Average Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Technical</p>
                <p className="text-3xl font-bold text-amber-700">
                  {Math.round(results.average_scores.technical_score)}%
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Structure</p>
                <p className="text-3xl font-bold text-purple-700">
                  {Math.round(results.average_scores.structure_score)}%
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Communication</p>
                <p className="text-3xl font-bold text-blue-700">
                  {Math.round(results.average_scores.communication_score)}%
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Confidence</p>
                <p className="text-3xl font-bold text-green-700">
                  {Math.round(results.average_scores.confidence_score)}%
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 text-center border-2 border-yellow-400">
                <p className="text-sm text-gray-600 mb-1 font-semibold">Overall</p>
                <p className="text-3xl font-bold text-orange-700">
                  {Math.round(results.average_scores.overall_score)}%
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/challenges')}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Challenges
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Question Screen
  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with Timer */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
            <p className="text-white text-sm mt-1 opacity-90">
              Question {currentQuestionIndex + 1} of {challenge.totalQuestions}
            </p>
          </div>

          {/* Timer */}
          <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-lg ${getTimerBgColor()}`}>
            <Clock className={`w-6 h-6 ${getTimerColor()}`} />
            <div className="text-center">
              <div className={`text-3xl font-bold ${getTimerColor()} tabular-nums`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-600">remaining</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Progress: {answers.length} / {challenge.totalQuestions} answered
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((answers.length / challenge.totalQuestions) * 100)}%
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(answers.length / challenge.totalQuestions) * 100}%` }}
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
            question={challenge.questions[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={challenge.totalQuestions}
          />

          {!evaluating && (
            <Recorder onRecordingComplete={handleRecordingComplete} />
          )}

          {evaluating && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Evaluating your challenge performance...</p>
              <p className="text-gray-500 text-sm mt-2">
                Analyzing all {challenge.totalQuestions} answers...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChallengeSession
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import { ChevronRight, Home } from 'lucide-react'
import api from '../services/api'

const InterviewSession = ({ user, onLogout }) => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await api.getQuestions(category)
        setQuestions(data)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Failed to load questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [category])

  const handleRecordingComplete = async (answerText) => {
    if (!answerText || !questions[currentQuestionIndex]) {
      alert('Please provide an answer')
      return
    }

    setEvaluating(true)
    setError('')
    
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // Call API with question, answer, AND keywords
      const evaluation = await api.evaluateAnswer(
        currentQuestion.question,
        answerText,
        currentQuestion.keywords || []
      )
      
      setResults(evaluation)
      setShowResults(true)
    } catch (err) {
      console.error('Evaluation error:', err)
      setError('Failed to evaluate answer. Make sure Ollama is running.')
      alert('Evaluation failed. Please check if Ollama is running on http://localhost:11434')
    } finally {
      setEvaluating(false)
    }
  }

  const handleNextQuestion = () => {
    setShowResults(false)
    setResults(null)
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      alert('Interview session complete! Check your progress page for detailed analytics.')
      navigate('/dashboard')
    }
  }

  const handleGoHome = () => {
    navigate('/dashboard')
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

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            {category.replace(/_/g, ' ').toUpperCase()} Interview
          </h1>
          <button
            onClick={handleGoHome}
            className="btn-secondary flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <QuestionCard
            question={questions[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          {!showResults && (
            <Recorder onRecordingComplete={handleRecordingComplete} />
          )}

          {evaluating && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Analyzing your response with AI...</p>
              <p className="text-gray-500 text-sm mt-2">Checking keywords, filler words, and overall quality...</p>
            </div>
          )}

          {showResults && !evaluating && results && (
            <>
              <ResultPanel results={results} />
              
              <div className="card text-center">
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary inline-flex items-center gap-2"
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterviewSession
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import QuestionCard from './QuestionCard'
import Recorder from './Recorder'
import ResultPanel from './ResultPanel'
import { ChevronRight, Home } from 'lucide-react'

const InterviewSession = ({ user, onLogout }) => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching questions from backend
    // In production, this will be: fetch(`/api/questions/${category}`)
    setTimeout(() => {
      // Mock data - replace with actual API call
      const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        question: `Sample ${category.replace('_', ' ')} question ${i + 1}?`,
        keywords: ['keyword1', 'keyword2', 'keyword3']
      }))
      setQuestions(mockQuestions)
      setLoading(false)
    }, 1000)
  }, [category])

  const handleRecordingComplete = async (audioBlob) => {
    // Simulate API call for evaluation
    setLoading(true)
    
    // Mock evaluation - replace with actual API call
    setTimeout(() => {
      const mockResults = {
        technicalScore: Math.floor(Math.random() * 30) + 70,
        confidenceScore: Math.floor(Math.random() * 30) + 70,
        communicationScore: Math.floor(Math.random() * 30) + 70,
        overallScore: Math.floor(Math.random() * 30) + 70
      }
      
      setResults(mockResults)
      setShowResults(true)
      setLoading(false)
    }, 2000)
  }

  const handleNextQuestion = () => {
    setShowResults(false)
    setResults(null)
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Interview complete
      alert('Interview session complete! Check your progress page for detailed analytics.')
      navigate('/dashboard')
    }
  }

  const handleGoHome = () => {
    navigate('/dashboard')
  }

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
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
            {category.replace('_', ' ').toUpperCase()} Interview
          </h1>
          <button
            onClick={handleGoHome}
            className="btn-secondary flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-6">
          <QuestionCard
            question={questions[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          {!showResults && (
            <Recorder onRecordingComplete={handleRecordingComplete} />
          )}

          {loading && showResults && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your response...</p>
            </div>
          )}

          {showResults && !loading && (
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
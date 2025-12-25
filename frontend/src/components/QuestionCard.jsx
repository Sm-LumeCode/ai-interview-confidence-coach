import React from 'react'
import { MessageSquare, AlertCircle } from 'lucide-react'

const QuestionCard = ({ question, currentQuestion, totalQuestions }) => {
  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <span className="text-sm font-semibold text-gray-600">
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
        <div className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          Interview Question
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
          {question?.question || 'Loading question...'}
        </h2>
      </div>

      {question?.keywords && question.keywords.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Key topics to cover: </span>
            <span>{question.keywords.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
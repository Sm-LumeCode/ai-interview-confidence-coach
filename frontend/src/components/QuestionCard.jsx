import React from 'react'
import { MessageSquare } from 'lucide-react'

const QuestionCard = ({ question, currentQuestion, totalQuestions }) => {
  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-700" />
          <span className="text-sm font-semibold text-gray-600">
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
        <div className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
          Interview Question
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-beige-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
          {question?.question || 'Loading question...'}
        </h2>
      </div>
    </div>
  )
}

export default QuestionCard

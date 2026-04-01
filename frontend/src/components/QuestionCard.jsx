import React from 'react'
import { MessageSquare } from 'lucide-react'

const QuestionCard = ({ question, currentQuestion, totalQuestions }) => {
  return (
    <div className="card animate-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageSquare size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
        <span className="badge badge-blue">Interview Q</span>
      </div>

      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '20px 24px'
      }}>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.5
        }}>
          {question?.question || 'Loading question…'}
        </p>
      </div>
    </div>
  )
}

export default QuestionCard
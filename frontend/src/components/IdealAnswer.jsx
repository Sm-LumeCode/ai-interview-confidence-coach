import React, { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'

const IdealAnswer = ({ idealAnswer }) => {
  const [showBullets, setShowBullets] = useState(false)
  if (!idealAnswer) return null

  const { full_answer, bullets, word_count } = idealAnswer

  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
        }}>
          <Lightbulb size={20} color="white" />
        </div>
        <div>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 16, color: '#0f172a'
          }}>
            Ideal Answer
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            {word_count} words · how to say it in an interview
          </p>
        </div>
      </div>

      {/* Full paragraph answer */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 10,
        padding: '18px 20px'
      }}>
        <p style={{
          fontSize: 14.5,
          color: '#0f172a',
          lineHeight: 1.8,
          margin: 0
        }}>
          {full_answer}
        </p>
      </div>

      {/* Tip */}
      <div style={{
        background: '#fefbeb',
        border: '1px solid #fde68a',
        borderRadius: 8,
        padding: '11px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
          <strong>Tip:</strong> Practice saying this out loud. Speak naturally — don't memorise word for word,
          just make sure you cover all the key ideas in a confident, flowing way.
        </p>
      </div>

      {/* Key Points toggle */}
      {bullets && bullets.length > 0 && (
        <div>
          <button
            onClick={() => setShowBullets(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
              color: '#475569',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            {showBullets
              ? <ChevronDown size={15} />
              : <ChevronRight size={15} />
            }
            {showBullets ? 'Hide' : 'Show'} Key Points to Remember
          </button>

          {showBullets && (
            <div style={{
              marginTop: 14,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                marginBottom: 4
              }}>
                Quick recall — cover these points in your answer
              </p>

              {bullets.map((point, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 14px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    transition: 'border-color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <CheckCircle2
                    size={16}
                    color="#10b981"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span style={{
                    fontSize: 13.5,
                    color: '#1e293b',
                    lineHeight: 1.55
                  }}>
                    {point}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default IdealAnswer
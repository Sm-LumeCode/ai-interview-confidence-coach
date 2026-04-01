import React, { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronRight } from 'lucide-react'

const IdealAnswer = ({ idealAnswer }) => {
  const [showDPMA, setShowDPMA] = useState(false)
  if (!idealAnswer) return null
  const { full_answer, sections, word_count } = idealAnswer

  const dpma = [
    { key: 'definition', label: 'D — Definition', color: '#3b82f6', bg: '#dbeafe' },
    { key: 'process', label: 'P — Process', color: '#8b5cf6', bg: '#ede9fe' },
    { key: 'method', label: 'M — Method', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'application', label: 'A — Application', color: '#10b981', bg: '#d1fae5' },
  ]

  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Lightbulb size={20} color="white" />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
            Ideal Answer
          </h3>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>{word_count} words · how to say it in an interview</p>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px' }}>
        <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.7 }}>{full_answer}</p>
      </div>

      <div style={{ background: '#fefbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#92400e' }}>
          <strong>💡 Tip:</strong> Practice saying this out loud. Speak naturally — don't memorise word for word, just cover all the key ideas confidently.
        </p>
      </div>

      <div>
        <button
          onClick={() => setShowDPMA(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
            fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer'
          }}
        >
          {showDPMA ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {showDPMA ? 'Hide' : 'View'} DPMA Structure Breakdown
        </button>

        {showDPMA && sections && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How the answer is structured
            </p>
            {dpma.map(({ key, label, color, bg }) =>
              sections[key] ? (
                <div key={key} style={{
                  background: bg, borderLeft: `3px solid ${color}`,
                  borderRadius: '0 8px 8px 0', padding: '12px 16px'
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{sections[key]}</p>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IdealAnswer
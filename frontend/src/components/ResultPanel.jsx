import React from 'react'
import {
  TrendingUp, MessageCircle, Award, Target, AlertTriangle, CheckCircle,
  XCircle, List, Lightbulb, BookOpen, TrendingDown, Plus, Loader, Volume2
} from 'lucide-react'

const ResultPanel = ({ results, aiFeedback, generatingFeedback }) => {
  const scores = results ? {
    technicalScore: results.technical_score ?? 0,
    structureScore: results.structure_score ?? 0,
    confidenceScore: results.confidence_score ?? 0,
    communicationScore: results.communication_score ?? 0,
    overallScore: results.overall_score ?? 0,
    feedback: results.brief_feedback ?? '',
    strengths: Array.isArray(results.strengths) ? results.strengths : [],
    improvements: Array.isArray(results.improvements) ? results.improvements : [],
    fillerWords: results.filler_words_analysis || null,
    keywordCoverage: results.keyword_coverage || null,
    hardGateFailed: results.hard_gate_failed || false,
    gateReason: results.gate_reason || null,
  } : null

  if (!scores) return null

  const scoreMetrics = [
    { label: 'Technical',     value: scores.technicalScore,     color: '#3b82f6', bg: '#dbeafe', icon: Target },
    { label: 'Structure',     value: scores.structureScore,     color: '#8b5cf6', bg: '#ede9fe', icon: List },
    { label: 'Confidence',    value: scores.confidenceScore,    color: '#10b981', bg: '#d1fae5', icon: TrendingUp },
    { label: 'Communication', value: scores.communicationScore, color: '#f59e0b', bg: '#fef3c7', icon: MessageCircle },
    { label: 'Overall',       value: scores.overallScore,       color: '#6366f1', bg: '#e0e7ff', icon: Award },
  ]

  // Filler word helpers
  const fillerTotal   = scores.fillerWords?.total_count ?? 0
  const fillerDetails = scores.fillerWords?.filler_details ?? {}
  const fillerLevel   = fillerTotal > 10 ? 'high' : fillerTotal > 5 ? 'medium' : fillerTotal > 0 ? 'low' : 'none'

  const fillerConfig = {
    high:   { bg: '#fef2f2', border: '#fecaca', labelColor: '#991b1b', tagBg: '#fee2e2',   tagColor: '#991b1b',  icon: '🔴', msg: 'High filler word usage — practice speaking without these to sound more confident.' },
    medium: { bg: '#fefbeb', border: '#fde68a', labelColor: '#92400e', tagBg: '#fef3c7',   tagColor: '#92400e',  icon: '🟡', msg: 'Moderate filler word usage — try to reduce these for a more polished delivery.' },
    low:    { bg: '#f0fdf4', border: '#bbf7d0', labelColor: '#166534', tagBg: '#dcfce7',   tagColor: '#166534',  icon: '🟢', msg: 'Low filler word usage — great job keeping your speech clean and confident!' },
    none:   { bg: '#f0fdf4', border: '#bbf7d0', labelColor: '#166534', tagBg: '#dcfce7',   tagColor: '#166534',  icon: '✅', msg: 'No filler words detected — excellent fluency and confidence!' },
  }
  const fc = fillerConfig[fillerLevel]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-in">

      {/* Hard gate */}
      {scores.hardGateFailed && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14 }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>Answer Quality Check Failed</p>
            <p style={{ fontSize: 14, color: '#b91c1c' }}>
              {scores.gateReason === 'too_short'            && 'Your answer is too short. Please provide a more detailed response.'}
              {scores.gateReason === 'excessive_repetition' && 'Too much repetition detected. Try using varied vocabulary.'}
              {scores.gateReason === 'no_verb'              && 'Your answer lacks proper sentence structure. Include complete sentences.'}
            </p>
          </div>
        </div>
      )}

      {/* Score cards */}
      <div className="card">
        <h2 className="card-title">Performance Analysis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {scoreMetrics.map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '16px 12px', textAlign: 'center'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4
              }}>
                {value}%
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</p>
              <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 999, height: 4, overflow: 'hidden' }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 1s ease-out' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword coverage */}
      {scores.keywordCoverage && (
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="#3b82f6" /> Keyword Coverage · {scores.keywordCoverage.coverage_percentage ?? 0}%
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(scores.keywordCoverage.covered || []).length > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={14} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Covered</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {scores.keywordCoverage.covered.slice(0, 5).map((kw, i) => (
                    <span key={i} className="badge badge-green">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {(scores.keywordCoverage.missing || []).length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <XCircle size={14} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Missing</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {scores.keywordCoverage.missing.slice(0, 5).map((kw, i) => (
                    <span key={i} className="badge badge-red">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filler Words — always shown, redesigned ── */}
      <div className="card" style={{ border: `1.5px solid ${fc.border}`, background: fc.bg }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'white', border: `1.5px solid ${fc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Volume2 size={18} color={fc.labelColor} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0
              }}>
                Filler Words
              </h3>
              {/* Count badge */}
              <span style={{
                fontSize: 13, fontWeight: 800,
                background: fillerTotal === 0 ? '#dcfce7' : fillerLevel === 'high' ? '#fee2e2' : fillerLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                color: fc.labelColor,
                padding: '2px 10px', borderRadius: 999,
                border: `1px solid ${fc.border}`
              }}>
                {fillerTotal} detected
              </span>
            </div>
            <p style={{ fontSize: 13, color: fc.labelColor, marginTop: 3, fontWeight: 500 }}>
              {fc.icon} {fc.msg}
            </p>
          </div>
        </div>

        {/* Filler word pills — only if any detected */}
        {fillerTotal > 0 && Object.keys(fillerDetails).length > 0 ? (
          <>
            <div style={{
              height: 1, background: fc.border, marginBottom: 14
            }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(fillerDetails)
                .sort((a, b) => b[1] - a[1])   // highest count first
                .map(([word, count]) => (
                  <div
                    key={word}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 0,
                      background: 'white',
                      border: `1.5px solid ${fc.border}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                  >
                    {/* Word label */}
                    <span style={{
                      padding: '6px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#374151',
                      borderRight: `1.5px solid ${fc.border}`,
                    }}>
                      "{word}"
                    </span>
                    {/* Count pill */}
                    <span style={{
                      padding: '6px 12px',
                      fontSize: 14,
                      fontWeight: 800,
                      color: fc.labelColor,
                      background: fc.tagBg,
                    }}>
                      ×{count}
                    </span>
                  </div>
                ))}
            </div>

            {/* Progress bar showing filler rate */}
            {(() => {
              const totalWords = results?.word_count || 1
              const rate = Math.min(Math.round((fillerTotal / Math.max(totalWords, 20)) * 100), 100)
              return (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: fc.labelColor, fontWeight: 600, marginBottom: 5 }}>
                    <span>Filler word rate</span>
                    <span>{fillerTotal} out of ~{Math.max(totalWords, 20)} words</span>
                  </div>
                  <div style={{ background: 'white', borderRadius: 999, height: 7, overflow: 'hidden', border: `1px solid ${fc.border}` }}>
                    <div style={{
                      width: `${rate}%`, height: '100%', borderRadius: 999,
                      background: fillerLevel === 'high' ? '#ef4444' : fillerLevel === 'medium' ? '#f59e0b' : '#10b981',
                      transition: 'width 1s ease-out'
                    }} />
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', borderRadius: 8, padding: '12px 16px',
            border: `1px solid ${fc.border}`
          }}>
            <CheckCircle size={18} color="#16a34a" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>
              No filler words detected in your answer — keep it up!
            </span>
          </div>
        )}
      </div>

      {/* Quick Feedback */}
      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={16} color="#3b82f6" /> Quick Feedback
        </h3>
        {scores.feedback && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: '#1e40af', fontWeight: 500 }}>{scores.feedback}</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {scores.strengths.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <CheckCircle size={14} color="#16a34a" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Strengths</span>
              </div>
              {scores.strengths.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {scores.improvements.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertTriangle size={14} color="#d97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Improvements</span>
              </div>
              {scores.improvements.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Feedback loading */}
      {generatingFeedback && !aiFeedback && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #c4b5fd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: '#8b5cf6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Loader size={20} color="white" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b' }}>Generating AI Feedback…</p>
              <p style={{ fontSize: 13, color: '#6d28d9' }}>Personalised insights on your answer</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {aiFeedback && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #c4b5fd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lightbulb size={20} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#1e1b4b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                AI Structured Feedback
              </p>
              <p style={{ fontSize: 13, color: '#7c3aed' }}>Based on your specific answer</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'what_you_covered',    icon: CheckCircle,  color: '#16a34a', bg: 'white', border: '#bbf7d0', label: 'What You Covered',   symbol: '✓' },
              { key: 'what_you_missed',     icon: TrendingDown, color: '#dc2626', bg: 'white', border: '#fecaca', label: 'What You Missed',     symbol: '✗' },
              { key: 'how_to_improve',      icon: Lightbulb,    color: '#2563eb', bg: 'white', border: '#bfdbfe', label: 'How to Improve',      symbol: '→' },
              { key: 'suggested_additions', icon: Plus,         color: '#7c3aed', bg: 'white', border: '#c4b5fd', label: 'Suggested Additions', symbol: '+' },
            ].map(({ key, icon: Icon, color, bg, border, label, symbol }) =>
              aiFeedback[key]?.length > 0 ? (
                <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon size={14} color={color} />
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                  </div>
                  {aiFeedback[key].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                      <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{symbol}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>

          <div style={{
            marginTop: 14, background: 'white', border: '1px solid #c4b5fd',
            borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10
          }}>
            <BookOpen size={16} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: '#4c1d95' }}>
              <strong>💡 Pro Tip:</strong> Focus on the "What You Missed" section when preparing your next answer. Adding those concepts will noticeably strengthen your technical depth.
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default ResultPanel
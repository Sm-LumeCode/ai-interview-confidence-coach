import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import { 
  Bookmark, AlertTriangle, Lightbulb, Play, Eye, 
  ChevronRight, Star, Clock, Target, ArrowUpRight 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSavedReviewQuestions, getWeakQuestions, getRecommendations } from '../utils/improvementsManager'

const Improvements = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [savedQuestions, setSavedQuestions] = useState([])
  const [weakQuestions, setWeakQuestions] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('all') // 'all', 'saved', 'weak'

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [saved, weak, recs] = await Promise.all([
          getSavedReviewQuestions(user.email),
          getWeakQuestions(user.email),
          getRecommendations(user.email)
        ])
        setSavedQuestions(saved)
        setWeakQuestions(weak)
        setRecommendations(recs)
      } catch (err) {
        console.error("Failed to load improvements data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user.email])

  const handlePracticeAgain = () => {
    // Navigate to a special interview session with combined questions
    navigate('/interview/improvements/practice-again')
  }

  const QuestionCard = ({ q, type }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'white',
        borderRadius: 20,
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          background: type === 'saved' ? '#ecfdf5' : '#fff7ed', 
          color: type === 'saved' ? '#10b981' : '#f97316',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          {q.category?.replace('_', ' ')}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} />
          {new Date(q.savedAt || q.detectedAt).toLocaleDateString()}
        </div>
      </div>

      <p style={{ 
        fontSize: 16, 
        fontWeight: 700, 
        color: '#0f172a', 
        lineHeight: 1.5,
        margin: 0 
      }}>
        {q.question}
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 12,
        padding: '12px',
        background: '#f8fafc',
        borderRadius: 12
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>Technical</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{q.technicalScore}%</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600 }}>Confidence</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{q.confidenceScore}%</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={{ 
          flex: 1, 
          padding: '10px', 
          borderRadius: 10, 
          border: '1px solid #e2e8f0', 
          background: 'white',
          fontSize: 13,
          fontWeight: 600,
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer'
        }}>
          <Eye size={14} /> Details
        </button>
        <button style={{ 
          flex: 1, 
          padding: '10px', 
          borderRadius: 10, 
          background: '#0f172a',
          fontSize: 13,
          fontWeight: 600,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer'
        }}>
          <Play size={14} fill="white" /> Practice
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="app-layout">
      <Navbar user={user} onLogout={onLogout} />

      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '24px' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: '#10b981', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={18} color="white" />
            </div>
            <h1 className="page-title" style={{ fontSize: 24, margin: 0 }}>Improvements</h1>
          </div>
          <p className="page-subtitle" style={{ fontSize: 15 }}>Personalized revision zone to master your weak areas</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
          
          {/* Main Content Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Quick Stats & Action */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: 24,
              padding: '32px',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Ready for a Revision?</h2>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Practice {savedQuestions.length + weakQuestions.length} questions from your personalized pool.</p>
              </div>
              <button 
                onClick={handlePracticeAgain}
                className="btn-primary" 
                style={{ 
                  background: '#10b981', 
                  padding: '14px 28px', 
                  fontSize: 15,
                  boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
                }}
              >
                <Play size={18} fill="white" /> Practice Again
              </button>
            </div>

            {/* Saved Review Questions */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Star size={20} color="#10b981" fill="#10b981" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Saved Review Questions</h3>
                  <span style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    {savedQuestions.length}
                  </span>
                </div>
              </div>
              
              {savedQuestions.length === 0 ? (
                <div style={{ 
                  background: 'white', border: '2px dashed #e2e8f0', borderRadius: 20, 
                  padding: '40px', textAlign: 'center', color: '#64748b' 
                }}>
                  <p>No questions saved for review yet. Click "Review Later" during an interview to add them here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  <AnimatePresence>
                    {savedQuestions.map(q => <QuestionCard key={q.question} q={q} type="saved" />)}
                  </AnimatePresence>
                </div>
              )}
            </section>

            {/* Weak Performance Questions */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={20} color="#f97316" />
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Weak Performance Areas</h3>
                  <span style={{ background: '#fff7ed', color: '#f97316', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    {weakQuestions.length}
                  </span>
                </div>
              </div>

              {weakQuestions.length === 0 ? (
                <div style={{ 
                  background: 'white', border: '2px dashed #e2e8f0', borderRadius: 20, 
                  padding: '40px', textAlign: 'center', color: '#64748b' 
                }}>
                  <p>Great job! No weak performance areas detected yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  <AnimatePresence>
                    {weakQuestions.map(q => <QuestionCard key={q.question} q={q} type="weak" />)}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar / Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ 
              background: 'white', 
              borderRadius: 24, 
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Lightbulb size={20} color="#10b981" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>AI Recommended</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendations.map((topic, i) => (
                  <motion.div 
                    key={topic}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      background: '#f8fafc',
                      padding: '14px 16px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    whileHover={{ scale: 1.02, background: 'white', borderColor: '#10b981', color: '#10b981' }}
                  >
                    {topic}
                    <ArrowUpRight size={14} />
                  </motion.div>
                ))}
              </div>

              <div style={{ 
                marginTop: 24, 
                padding: '16px', 
                background: '#ecfdf5', 
                borderRadius: 16,
                fontSize: 12,
                color: '#065f46',
                lineHeight: 1.6
              }}>
                <strong>Pro Tip:</strong> Focusing on these specific topics will help you improve your overall confidence score significantly.
              </div>
            </div>

            {/* Mastery Progress Card */}
            <div style={{ 
              background: 'white', 
              borderRadius: 24, 
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Mastery Status</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: 'Technical Mastery', val: 68, color: '#3b82f6' },
                  { label: 'Communication Flow', val: 82, color: '#10b981' },
                  { label: 'Problem Solving', val: 45, color: '#f59e0b' }
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      <span style={{ color: '#64748b' }}>{m.label}</span>
                      <span style={{ color: '#0f172a' }}>{m.val}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999 }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.val}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: m.color, borderRadius: 999 }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </main>

      <style>{`
        .btn-primary {
          display: flex;
          alignItems: center;
          gap: 10px;
          border: none;
          borderRadius: 12px;
          cursor: pointer;
          fontWeight: 700;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  )
}

export default Improvements

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, ChevronRight, MessageSquare, Zap, Target, Users, Code, Database, Brain, Cloud, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const categories = [
  { id: 'software_development', name: 'Software Development', icon: Code, color: '#3b82f6' },
  { id: 'data_analytics', name: 'Data & Analytics', icon: Database, color: '#8b5cf6' },
  { id: 'data_science_ml', name: 'Data Science & ML', icon: Brain, color: '#10b981' },
  { id: 'cloud_devops', name: 'Cloud & DevOps', icon: Cloud, color: '#f59e0b' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: Shield, color: '#6366f1' },
  { id: 'hr_round', name: 'HR Round', icon: Users, color: '#ec4899' }
]

const BrowseQuestions = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (selectedCategory) {
      fetchQuestions(selectedCategory.id)
    }
  }, [selectedCategory])

  const fetchQuestions = async (categoryId) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/questions/${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => selectedCategory ? setSelectedCategory(null) : navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            <ArrowLeft size={20} />
            {selectedCategory ? 'Back to Categories' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Browse <span className="text-[hsl(168,60%,36%)]">Questions</span>
            </span>
          </div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!selectedCategory ? (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-black tracking-tight">Select a Domain</h1>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Explore hundreds of interview questions across different technical and behavioral tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-500/20 transition-all text-left"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors`} 
                       style={{ backgroundColor: `${cat.color}10`, color: cat.color }}>
                    <cat.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-teal-600 transition-colors">{cat.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Practice specialized questions for {cat.name} roles.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-teal-600">
                    Explore Questions <ChevronRight size={16} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black mb-2">{selectedCategory.name}</h1>
                <p className="text-slate-500">Practice behavioral and situational questions for this role.</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Loading questions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 mt-1">
                        <MessageSquare size={18} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 leading-snug">{q.question}</h3>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {q.keywords?.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase rounded-full border border-slate-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-teal-500/10 text-teal-600 font-bold rounded-xl hover:bg-teal-500 hover:text-white transition-all text-sm"
                      >
                        Practice Now
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No questions found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-slate-200 text-center text-slate-400 text-sm font-medium">
        <p>© 2024 InterviewCoach AI. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default BrowseQuestions

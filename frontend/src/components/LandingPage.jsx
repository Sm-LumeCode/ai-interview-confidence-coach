import React, { useEffect, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { 
  Mic2, 
  Brain, 
  Zap, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Trophy, 
  Star, 
  Target,
  MessageSquare,
  Sparkles,
  Search
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate = useNavigate()

  const handleStart = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  const handleSignIn = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const handleBrowse = () => {
    window.dispatchEvent(new CustomEvent('open-app-support'))
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-inter overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[hsl(168,60%,36%)] rounded-lg flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Mic2 size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              <span className="text-[hsl(168,60%,36%)]">Interview</span>Coach
            </span>
          </div>
          <button 
            onClick={handleSignIn}
            className="text-sm font-semibold text-slate-600 hover:text-[hsl(168,60%,36%)] transition-colors px-4 py-2"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
          <div 
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(hsl(168, 60%, 36%) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Floating Intelligence Tags */}
        <motion.div 
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 left-12 hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-100 z-10"
        >
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-600">Confidence Analysis</span>
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-60 right-12 hidden lg:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-100 z-10"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-xs font-bold text-slate-600">Communication Score</span>
        </motion.div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(168,60%,94%)] border border-[hsl(168,60%,85%)] text-[hsl(168,60%,36%)] text-[11px] font-bold mb-8 uppercase tracking-widest">
              <Sparkles size={14} /> AI-Powered Confidence Building
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Master Your Next <br />
              <span className="text-[hsl(168,60%,36%)] italic">Big Interview</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
              Practice real-world behavioral questions with our AI coach. Get instant feedback on your 
              confidence, clarity, and tone to land your dream role.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={handleStart}
                className="group flex items-center gap-2 px-8 py-4 bg-[hsl(168,60%,36%)] text-white rounded-2xl font-bold shadow-xl shadow-teal-900/10 hover:bg-[hsl(168,60%,32%)] transition-all hover:-translate-y-1"
              >
                Start Free Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={handleBrowse}
                className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Search size={18} /> Browse Questions
              </button>
            </div>

            <div className="flex items-center justify-center gap-10 text-sm text-slate-400 font-medium lowercase">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[hsl(168,60%,36%)]" /> voice enabled
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[hsl(168,60%,36%)]" /> instant feedback
              </div>
            </div>
          </motion.div>

          {/* AI Feedback Session Mockup (NOT CODING) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 max-w-4xl mx-auto px-4"
          >
            <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.08)] border border-slate-100 p-2 group hover:scale-[1.01] transition-transform duration-500">
              <div className="bg-[#161b22] rounded-[1.5rem] overflow-hidden min-h-[400px] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/30">
                      <Mic2 className="text-teal-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Behavioral Interview</div>
                      <div className="text-xs text-slate-400">Practicing: Conflict Resolution</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded-full border border-teal-500/20">LIVE ANALYSIS</div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 flex flex-col lg:flex-row gap-8">
                  {/* AI Response Area */}
                  <div className="flex-1 space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 }}
                      className="bg-white/5 rounded-2xl p-6 border border-white/5"
                    >
                      <div className="text-[10px] text-teal-500 font-bold uppercase tracking-wider mb-2">Interviewer</div>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        "Tell me about a time you had a conflict with a team member. How did you handle it?"
                      </p>
                    </motion.div>

                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                        className="flex gap-3"
                      >
                        <div className="w-2 h-full bg-teal-500/50 rounded-full" />
                        <div className="text-slate-400 text-sm italic">"Transcribing your response..."</div>
                      </motion.div>
                      
                      {/* AI Feedback Snippets */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 4 }}
                        className="p-4 bg-teal-500/10 rounded-xl border border-teal-500/20"
                      >
                        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs mb-2">
                          <Sparkles size={14} /> AI TIP
                        </div>
                        <p className="text-teal-50 text-xs leading-relaxed">
                          Great structure! Try adding more emphasis on the 'Result' of your STAR response.
                        </p>
                      </motion.div>
                    </div>
                  </div>

                  {/* Sidebar stats */}
                  <div className="w-full lg:w-64 space-y-4">
                    {[
                      { label: 'Technical Accuracy', val: 0, target: 82, color: 'bg-blue-500' },
                      { label: 'Communication Tone', val: 0, target: 94, color: 'bg-teal-500' },
                      { label: 'Confidence Level', val: 0, target: 78, color: 'bg-amber-500' }
                    ].map((s, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">{s.label}</div>
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${s.target}%` }}
                               transition={{ delay: 5 + idx * 0.2, duration: 1 }}
                               className={`h-full ${s.color}`} 
                             />
                           </div>
                           <div className="text-white text-xs font-bold">{s.target}%</div>
                        </div>
                      </div>
                    ))}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 6 }}
                      className="bg-teal-600 rounded-xl p-4 text-center shadow-lg shadow-teal-900/40"
                    >
                      <Trophy className="text-white mx-auto mb-2" size={24} />
                      <div className="text-[10px] text-teal-200 uppercase font-bold">Overall Rating</div>
                      <div className="text-2xl font-black text-white">8.4</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-slate-400 text-sm font-bold uppercase tracking-tighter mb-10">Real Results, Exceptional Feedback</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'AI Feedback Accuracy', value: '95%' },
              { label: 'Common Questions', value: '500+' },
              { label: 'Avg User Growth', value: '45%' },
              { label: 'Practice Sessions', value: '1,000+' }
            ].map((stat, idx) => (
              <StatItem key={idx} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4">Elevate Your Narrative</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Master the art of the behavioral interview with precision data and AI feedback.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Mic2, title: 'Voice Recognition', desc: 'State-of-the-art speech-to-text ensures every word of your response is analyzed for impact.' },
              { icon: Brain, title: 'AI Behavioral Engine', desc: 'Identify your weak spots in conflict resolution, leadership, and collaboration questions.' },
              { icon: MessageSquare, title: 'Structural Feedback', desc: 'Our AI checks for STAR method compliance and suggests improvements for better clarity.' },
              { icon: TrendingUp, title: 'Confidence Roadmap', desc: 'Visually track your improvement across technical, emotional, and social dimensions.' }
            ].map((feature, idx) => (
              <FeatureCard key={idx} {...feature} index={idx} />
            ))}
          </div>
        </div>
      </section>



      <footer className="py-12 border-t border-slate-200 text-center text-slate-400 text-sm font-medium">
        <p>© 2024 InterviewCoach AI. All rights reserved.</p>
      </footer>
    </div>
  )
}

const StatItem = ({ label, value }) => {
  const controls = useAnimation()
  const ref = React.useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      controls.start({ scale: 1, opacity: 1 })
    }
  }, [inView, controls])

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={controls}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</div>
    </motion.div>
  )
}

const FeatureCard = ({ icon: Icon, title, desc, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="p-10 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
    >
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[hsl(168,60%,36%)] mb-8 transition-colors group-hover:bg-[hsl(168,60%,36%)] group-hover:text-white">
        <Icon size={28} />
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

const TestimonialCard = ({ name, role, initial, content, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-left"
    >
      <div className="flex gap-1 mb-8">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill="currentColor" className="text-teal-500" />
        ))}
      </div>
      <p className="text-slate-700 font-medium italic mb-10 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-teal-500/10 rounded-full flex items-center justify-center text-teal-600 font-bold">
          {initial}
        </div>
        <div>
          <div className="font-bold text-slate-900 text-sm">{name}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default LandingPage

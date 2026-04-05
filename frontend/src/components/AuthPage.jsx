import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic2, 
  ArrowLeft, 
  Github, 
  Chrome, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  MessageSquare,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const AuthPage = ({ onLogin }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [mode, setMode] = useState(location.pathname === '/login' ? 'login' : 'signup')
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  
  // Dynamic users list from local storage
  const [registeredUsers, setRegisteredUsers] = useState([])
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // Sync with local storage on mount
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    setRegisteredUsers(users)
    
    if (location.pathname === '/login') setMode('login')
    else if (location.pathname === '/signup') setMode('signup')
    setError('')
    setSuccessMsg('')
  }, [location.pathname])

  // Clear success notification after it "elapses"
  useEffect(() => {
    if (successMsg && successMsg.includes('sent')) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
      }, 10000) // matches the 10s progress bar
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const handleToggle = () => {
    const newMode = mode === 'login' ? 'signup' : 'login'
    setMode(newMode)
    navigate(newMode === 'login' ? '/login' : '/signup')
  }

  const handleSocialClick = (provider) => {
    if (provider === 'Google') {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      setRegisteredUsers(users)
      setShowGoogleModal(true)
    } else {
      setLoading(true)
      setTimeout(() => {
        onLogin({ id: `gh_${Date.now()}`, username: 'github_user', email: 'github@demo.com' })
        setLoading(false)
        navigate('/dashboard')
      }, 1000)
    }
  }

  const handleGoogleSelect = (user) => {
    setLoading(true)
    setShowGoogleModal(false)
    setTimeout(() => {
      onLogin({ id: user.id, username: user.username, email: user.email })
      setLoading(false)
      navigate('/dashboard')
    }, 1200)
  }

  const handleNewSocialAccount = () => {
    setShowGoogleModal(false)
    setMode('signup')
    // Pre-select Google icon or something but we'll just let them sign up
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      if (mode === 'login') {
        const u = users.find(u => u.email === email)
        if (!u) throw new Error('No account found with this email.')
        if (u.password !== password) throw new Error('Incorrect password.')
        
        onLogin({ id: u.id, username: u.username, email: u.email })
        navigate('/dashboard')
      } 
      else if (mode === 'signup') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        if (users.find(u => u.email === email)) throw new Error('Account already exists.')

        const newUser = {
          id: Date.now().toString(),
          username: fullName.split(' ')[0].toLowerCase() + Math.round(Math.random() * 100),
          fullName, email, password, createdAt: new Date().toISOString()
        }
        users.push(newUser)
        localStorage.setItem('users', JSON.stringify(users))
        setRegisteredUsers(users)
        onLogin({ id: newUser.id, username: newUser.username, email: newUser.email })
        navigate('/dashboard')
      }
      else if (mode === 'forgotPassword') {
        const u = users.find(u => u.email === email)
        if (!u) throw new Error('No account found with this email.')
        
        const response = await fetch('http://localhost:8002/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const data = await response.json()
        
        if (data.status === 'sent' || data.status === 'simulated') {
          setSuccessMsg(data.message)
          setMode('otpVerification')
        } else {
          throw new Error('Failed to send verification code. Please try again later.')
        }
      }
      else if (mode === 'otpVerification') {
        const response = await fetch('http://localhost:8002/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        })
        const data = await response.json()
        
        if (data.status === 'verified') {
          setMode('resetPassword')
          setSuccessMsg('Identity verified! Create your new password below.')
        } else {
          throw new Error(data.detail || 'Invalid verification code.')
        }
      }
      else if (mode === 'resetPassword') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        if (password !== confirmPassword) throw new Error('Passwords do not match.')
        
        const idx = users.findIndex(u => u.email === email)
        if (idx !== -1) {
          users[idx].password = password
          localStorage.setItem('users', JSON.stringify(users))
          setSuccessMsg('Password updated! Redirecting to Sign In...')
          setTimeout(() => setMode('login'), 2000)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(220,20%,10%)] text-white font-inter flex flex-col md:flex-row">
      <AnimatePresence>
        {showGoogleModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl text-slate-900 border border-slate-100"
            >
              <div className="p-8 pb-4 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                  <Chrome className="text-blue-500" size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Choose an account</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">to continue to <span className="text-teal-600 font-bold">InterviewCoach</span></p>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto px-6 pb-8">
                {registeredUsers.length > 0 ? (
                  registeredUsers.slice(-4).map((acc, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleGoogleSelect(acc)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all text-left border border-transparent hover:border-slate-100 group mb-1 last:mb-0"
                    >
                      <div className="w-10 h-10 rounded-full border border-slate-200 bg-teal-500 flex items-center justify-center text-white font-black text-sm">
                        {acc.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-800 group-hover:text-teal-600 transition-colors truncate">{acc.fullName || acc.username}</div>
                        <div className="text-xs text-slate-400 truncate">{acc.email}</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 text-xs italic font-medium">No accounts stored yet. Register to see them here.</p>
                )}
                
                <button 
                  onClick={handleNewSocialAccount}
                  className="w-full mt-4 flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all text-left font-black text-slate-600 text-xs border border-slate-200"
                >
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                     <User size={18} />
                   </div>
                   Use another account
                </button>
              </div>
              <div className="p-5 bg-slate-50 text-[10px] text-slate-400 leading-relaxed text-center border-t border-slate-100 font-semibold uppercase tracking-wider">
                Google Login Simulation Enabled
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-teal-500 rounded-full blur-[120px]" />
        {['?', '!', '✓', 'AI', 'Ok', '...', '★'].map((s, i) => (
          <motion.div key={i} initial={{ y: '110vh', x: `${10 + i * 15}vw`, opacity: 0.1 }} animate={{ y: '-10vh' }} transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }} className="absolute font-mono text-3xl text-teal-500/20">{s}</motion.div>
        ))}
      </div>

      <button onClick={() => navigate('/')} className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1" /> <span className="text-sm font-semibold">Back to Home</span>
      </button>

      <div className="relative z-10 w-full md:w-[45%] flex flex-col justify-center p-12 lg:p-24 border-r border-white/5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-12 uppercase tracking-tighter">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30"><Mic2 size={22} className="text-white" /></div>
            <span className="text-2xl font-black italic"><span className="text-teal-500">Interview</span>Coach</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Instant Feedback. <br /><span className="text-teal-500">Total Confidence.</span></h1>
          <p className="text-slate-400 text-lg font-medium mb-10 max-w-md">Practice real scenarios with AI voice analysis and structured STAR method feedback.</p>
          <ul className="space-y-4 mb-16">
            {['AI Tone Analysis', 'STAR Method Guidance', 'Dynamic Account Storage', 'Timed OTP Security'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-300 font-bold text-sm tracking-tight"><div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20"><CheckCircle2 size={14} className="text-teal-500" /></div> {f}</li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <motion.div key={mode} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden text-slate-900 border-t-8 border-teal-600">
            <div className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : mode === 'forgotPassword' ? 'Forgot PW' : mode === 'otpVerification' ? 'Verify OTP' : 'Reset PW'}
                </h2>
                <p className="text-slate-400 font-medium">{mode === 'login' ? 'Welcome back, Coach!' : 'Join the next generation of leaders.'}</p>
              </div>

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-2xl font-bold flex gap-3 items-center"><AlertCircle size={18} /> {error}</div>}
              {successMsg && <div className="mb-6 p-4 bg-teal-50 border border-teal-100 text-teal-600 text-xs rounded-2xl font-bold flex gap-3 items-center animate-pulse"><CheckCircle2 size={18} /> {successMsg}</div>}

              {(mode === 'login' || mode === 'signup') && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button onClick={() => handleSocialClick('GitHub')} type="button" className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black text-slate-700 text-sm shadow-sm group">
                    <Github size={20} className="group-hover:rotate-12 transition-transform" /> GitHub
                  </button>
                  <button onClick={() => handleSocialClick('Google')} type="button" className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-black text-slate-700 text-sm shadow-sm group">
                    <Chrome size={20} className="text-blue-500 group-hover:scale-110 transition-transform" /> Google
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 ml-1">Full Name</label>
                    <div className="relative group"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={20} /><input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white transition-all outline-none font-medium" placeholder="Ex: John Smith" /></div>
                  </div>
                )}
                
                {(mode !== 'otpVerification' && mode !== 'resetPassword') && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 ml-1">Email Address</label>
                    <div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={20} /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white transition-all outline-none font-medium" placeholder="name@domain.com" /></div>
                  </div>
                )}

                {mode === 'otpVerification' && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 ml-1 text-center font-bold">Verification Required</label>
                    <div className="relative group"><KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="text" required maxLength={4} value={otp} onChange={e => setOtp(e.target.value)} className="w-full pl-12 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 transition-all outline-none font-black text-2xl tracking-[1.5em] text-center" placeholder="••••" /></div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'resetPassword') && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 ml-1">Password</label>
                    <div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={20} /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white transition-all outline-none font-medium" placeholder="••••••••" /></div>
                  </div>
                )}

                {(mode === 'signup' || mode === 'resetPassword') && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-2 ml-1">Confirm Identity</label>
                    <div className="relative group"><ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={20} /><input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white transition-all outline-none font-medium" placeholder="••••••••" /></div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end"><button type="button" onClick={() => setMode('forgotPassword')} className="text-xs font-black text-teal-600 hover:text-teal-700 transition-colors">Forgot your password?</button></div>
                )}

                <button type="submit" disabled={loading} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black shadow-xl shadow-teal-500/20 hover:bg-teal-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    mode === 'login' ? 'Coach Me' :
                    mode === 'signup' ? 'Create Account' :
                    mode === 'forgotPassword' ? 'Send OTP' :
                    mode === 'otpVerification' ? 'Verify Identity' :
                    'Update Password'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center pt-8 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-400">
                  {mode === 'login' ? "New to the platform?" : "Back to coach mode?"}
                  <button onClick={handleToggle} type="button" className="ml-2 text-teal-600 font-black hover:underline underline-offset-4">
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
                {mode === 'forgotPassword' && (
                  <button onClick={() => setMode('login')} className="mt-4 text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft size={16} /> Back to Sign In</button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'

const InputField = ({ icon: Icon, type, placeholder, value, onChange, onFocus, onBlur, showToggle, onToggle, showPass, name }) => (
  <div style={{ position: 'relative' }}>
    <Icon size={16} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
    <input
      type={showToggle ? (showPass ? 'text' : 'password') : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required
      style={{
        width: '100%', padding: `10px ${showToggle ? '40px' : '14px'} 10px 38px`,
        background: '#0f1117', border: '1px solid #1e2430',
        borderRadius: 8, fontSize: 14, color: '#f1f5f9',
        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
      }}
      onFocus={e => { e.target.style.borderColor = '#10b981'; onFocus?.() }}
      onBlur={e => { e.target.style.borderColor = '#1e2430'; onBlur?.() }}
    />
    {showToggle && (
      <button type="button" onClick={onToggle} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0
      }}>
        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    )}
  </div>
)

const Signup = ({ onLogin }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' })
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUsernamePopup, setShowUsernamePopup] = useState(false)
  const [tempUserData, setTempUserData] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.email.trim()) { setError('Please enter your email address'); return }
    if (!formData.password) { setError('Please enter a password'); return }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
      if (existingUsers.find(u => u.email === formData.email)) {
        setError('An account with this email already exists.')
        setLoading(false); return
      }
      setTempUserData({ email: formData.email, password: formData.password })
      setShowUsernamePopup(true)
      setLoading(false)
    } catch {
      setError('Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const handleUsernameSubmit = () => {
    if (!username.trim()) { setError('Please enter a username'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return }
    setLoading(true)
    try {
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]')
      if (existingUsers.find(u => u.username === username)) {
        setError('Username already taken. Please choose another.'); setLoading(false); return
      }
      const newUser = { id: Date.now().toString(), username, email: tempUserData.email, password: tempUserData.password, createdAt: new Date().toISOString() }
      existingUsers.push(newUser)
      localStorage.setItem('users', JSON.stringify(existingUsers))
      onLogin({ id: newUser.id, username: newUser.username, email: newUser.email })
      navigate('/dashboard')
    } catch {
      setError('Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const cardStyle = {
    background: '#161b27',
    border: '1px solid #1e2430',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.35s ease forwards'
  }

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'Inter', sans-serif"
    }}>
      {/* Glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, ...cardStyle }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
          }}>
            <UserPlus size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Start your interview preparation journey</p>
        </div>

        {error && !showUsernamePopup && (
          <div style={{ background: '#1f0f0f', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email Address</label>
            <InputField icon={Mail} type="email" name="email" placeholder="your@email.com" value={formData.email}
              onChange={e => { handleChange(e) }} />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <InputField icon={Lock} type="password" placeholder="Min. 6 characters" value={formData.password}
              onChange={e => { setFormData(f => ({ ...f, password: e.target.value })); setError('') }}
              showToggle showPass={showPass} onToggle={() => setShowPass(p => !p)} />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <InputField icon={Lock} type="password" placeholder="Repeat password" value={formData.confirmPassword}
              onChange={e => { setFormData(f => ({ ...f, confirmPassword: e.target.value })); setError('') }}
              showToggle showPass={showConfirm} onToggle={() => setShowConfirm(p => !p)} />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', padding: '11px 20px',
              borderRadius: 8, fontSize: 14, fontWeight: 600,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.3)'
            }}
          >
            {loading
              ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <><UserPlus size={16} /> Sign Up</>
            }
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: '#475569' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>

      {/* Username Popup */}
      {showUsernamePopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 20
        }}>
          <div style={{
            background: '#161b27', border: '1px solid #1e2430',
            borderRadius: 16, padding: '36px 32px',
            width: '100%', maxWidth: 380,
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            animation: 'slideUp 0.25s ease forwards'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 8px 20px rgba(59,130,246,0.3)'
              }}>
                <User size={22} color="white" />
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                Choose Username
              </h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Pick a unique display name</p>
            </div>

            {error && (
              <div style={{ background: '#1f0f0f', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  placeholder="e.g. alex_chen"
                  autoFocus
                  minLength={3}
                  style={{
                    width: '100%', padding: '10px 14px 10px 38px',
                    background: '#0f1117', border: '1px solid #1e2430',
                    borderRadius: 8, fontSize: 14, color: '#f1f5f9',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#1e2430'}
                  onKeyDown={e => e.key === 'Enter' && handleUsernameSubmit()}
                />
              </div>
            </div>

            <button
              onClick={handleUsernameSubmit}
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', padding: '11px 20px',
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
              }}
            >
              {loading
                ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : 'Create Account →'
              }
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  )
}

export default Signup
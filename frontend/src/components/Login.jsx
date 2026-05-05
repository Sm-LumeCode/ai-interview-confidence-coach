import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.login({ email, password })
      const { user } = response
      
      // user object from backend usually contains id, username, email
      onLogin({ id: user.id, username: user.username, email: user.email })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)'
        }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        background: '#161b27',
        border: '1px solid #1e2430',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.35s ease forwards'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
          }}>
            <LogIn size={24} color="white" />
          </div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 6
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Sign in to continue your practice</p>
        </div>

        {error && (
          <div style={{
            background: '#1f0f0f', border: '1px solid #7f1d1d',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  background: '#0f1117', border: '1px solid #1e2430',
                  borderRadius: 8, fontSize: 14, color: '#f1f5f9',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#1e2430'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#475569" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '10px 40px 10px 38px',
                  background: '#0f1117', border: '1px solid #1e2430',
                  borderRadius: 8, fontSize: 14, color: '#f1f5f9',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#1e2430'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0
              }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {loading ? (
              <div style={{
                width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
              }} />
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#475569' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  )
}

export default Login
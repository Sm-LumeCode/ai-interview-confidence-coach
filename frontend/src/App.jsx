import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import InterviewSession from './components/InterviewSession'
import SessionList from './components/SessionList'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Challenges from './components/Challenges'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    // Save first-login date if not already set
    const joinKey = `join_date_${userData.email}`
    if (!localStorage.getItem(joinKey)) {
      localStorage.setItem(joinKey, new Date().toISOString())
    }
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #1e2430', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/signup"    element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />} />
        <Route path="/login"     element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />

        {/* Session list for a category — shows sessions of 5 questions each */}
        <Route path="/sessions/:category"
          element={user ? <SessionList user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />

        {/* Actual interview — now receives sessionIndex via URL */}
        <Route path="/interview/:category/:sessionIndex"
          element={user ? <InterviewSession user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />

        {/* Legacy route kept for backward compat */}
        <Route path="/interview/:category"
          element={user ? <InterviewSession user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />

        <Route path="/profile"    element={user ? <Profile user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />
        <Route path="/progress"   element={user ? <Progress user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />
        <Route path="/challenges" element={user ? <Challenges user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/signup"} />} />
      </Routes>
    </Router>
  )
}

export default App
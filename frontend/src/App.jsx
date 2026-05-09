import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import InterviewSession from './components/InterviewSession'
import SessionList from './components/SessionList'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Challenges from './components/Challenges'
import Improvements from './components/Improvements'
import ChallengeSession from './components/ChallengeSession'
import BrowseQuestions from './components/BrowseQuestions'
import FloatingHelpBot from './components/FloatingHelpBot'

import { syncProgressFromBackend } from './utils/progressManager'
import { syncDailyProgressFromBackend } from './utils/dailyProgressManager'
import { syncCategoryProgressFromBackend } from './utils/categoryProgressManager'

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

  const handleLogin = async (userData) => {
    // Save first-login date if not already set
    const joinKey = `join_date_${userData.email}`
    if (!localStorage.getItem(joinKey)) {
      localStorage.setItem(joinKey, new Date().toISOString())
    }
    
    // Set user first so UI updates
    setUser(userData)
    if (userData.email && !userData.email.startsWith('guest_')) {
      Promise.all([
        syncProgressFromBackend(userData.email),
        syncDailyProgressFromBackend(userData.email),
        syncCategoryProgressFromBackend(userData.email)
      ]).catch(err => console.error("Initial login sync failed:", err))
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const handleUpdateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/browse" element={<BrowseQuestions />} />
        <Route path="/signup" element={<AuthPage onLogin={handleLogin} />} />
        <Route path="/login"  element={<AuthPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* Session list for a category — shows sessions of 5 questions each */}
        <Route path="/sessions/:category"
          element={user ? <SessionList user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* Actual interview — now receives sessionIndex via URL */}
        <Route path="/interview/:category/:sessionIndex"
          element={user ? <InterviewSession user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />

        <Route path="/profile"    element={user ? <Profile user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
        <Route path="/progress"   element={user ? <Progress user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/improvements" element={user ? <Improvements user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/challenges" element={user ? <Challenges user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/challenge/:challengeId" element={user ? <ChallengeSession user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
      <FloatingHelpBot />
    </Router>
  )
}

export default App
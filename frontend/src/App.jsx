import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import InterviewSession from './components/InterviewSession'
import Profile from './components/Profile'
import Progress from './components/Progress'
import Challenges from './components/Challenges'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-700"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <Signup onLogin={handleLogin} />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
        />
        <Route 
          path="/interview/:category" 
          element={user ? <InterviewSession user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
        />
        <Route 
          path="/progress" 
          element={user ? <Progress user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
        />
        <Route 
          path="/challenges" 
          element={user ? <Challenges user={user} onLogout={handleLogout} /> : <Navigate to="/signup" />} 
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/signup"} />} />
      </Routes>
    </Router>
  )
}

export default App
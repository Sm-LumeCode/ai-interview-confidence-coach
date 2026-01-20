import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import RoleSelector from './RoleSelector'
import { getAllProgress } from '../utils/progressManager'

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const [userProgress, setUserProgress] = useState({})

  useEffect(() => {
    // Load user progress
    const progress = getAllProgress(user.email)
    setUserProgress(progress)
  }, [user.email])

  const handleSelectRole = (category) => {
    navigate(`/interview/${category}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome back, {user.username}!
          </h1>
          <p className="text-xl text-white opacity-90">
            Choose a category to start your interview practice
          </p>
        </div>

        <RoleSelector onSelectRole={handleSelectRole} userProgress={userProgress} />
      </div>
    </div>
  )
}

export default Dashboard
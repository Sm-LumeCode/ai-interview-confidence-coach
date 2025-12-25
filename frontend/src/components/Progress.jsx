import React from 'react'
import Navbar from './Navbar'
import { TrendingUp, Award, Target, CheckCircle } from 'lucide-react'

const Progress = ({ user, onLogout }) => {
  // Mock data - replace with actual API data
  const stats = {
    totalInterviews: 45,
    completedChallenges: 12,
    averageScore: 82,
    bestCategory: 'Software Development'
  }

  const categoryProgress = [
    { name: 'Software Development', completed: 15, total: 20, score: 85 },
    { name: 'Data & Analytics', completed: 10, total: 20, score: 78 },
    { name: 'Data Science & ML', completed: 8, total: 20, score: 80 },
    { name: 'Cloud & DevOps', completed: 7, total: 20, score: 82 },
    { name: 'Cybersecurity', completed: 5, total: 20, score: 79 }
  ]

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8 animate-fade-in">Progress Tracking</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Interviews</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalInterviews}</p>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Challenges Done</p>
                <p className="text-2xl font-bold text-gray-800">{stats.completedChallenges}</p>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Best Category</p>
                <p className="text-lg font-bold text-gray-800">{stats.bestCategory}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="card animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-6">Category Progress</h2>
          
          <div className="space-y-6">
            {categoryProgress.map((category, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <span className="text-sm text-gray-600">
                    {category.completed}/{category.total} completed • Score: {category.score}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out"
                    style={{ width: `${(category.completed / category.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Progress
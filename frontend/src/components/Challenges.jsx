import React from 'react'
import Navbar from './Navbar'
import { Trophy, Clock, Star, Lock } from 'lucide-react'
import { getChallengeData } from '../utils/ChallengeManager'

const Challenges = ({ user, onLogout }) => {
  
  const challenges = [
    {
      id: 1,
      title: 'Speed Demon',
      description: 'Complete 10 questions in under 2 minutes each',
      progress: 7,
      total: 10,
      points: 500,
      locked: false
    },
    {
      id: 2,
      title: 'Perfect Score',
      description: 'Achieve 100% score in any category',
      progress: 0,
      total: 1,
      points: 1000,
      locked: false
    },
    {
      id: 3,
      title: 'Category Master',
      description: 'Complete all questions in one category',
      progress: 27,
      total: 831,
      points: 750,
      locked: false
    },
    {
      id: 4,
      title: 'Consistency King',
      description: 'Complete interviews for 7 consecutive days',
      progress: 3,
      total: 7,
      points: 600,
      locked: false
    },
    {
      id: 5,
      title: 'Grand Master',
      description: 'Complete all categories with 90%+ average',
      progress: 0,
      total: 5,
      points: 2000,
      locked: true
    },
    {
      id: 6,
      title: 'Communication Expert',
      description: 'Achieve 95%+ communication score in 5 interviews',
      progress: 0,
      total: 5,
      points: 800,
      locked: false
    }
  ]

  return (
    <div className="min-h-screen">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">Challenges</h1>
          <p className="text-xl text-white opacity-90">Complete challenges to earn rewards!</p>
        </div>

        {/* Total Points Card */}
        <div className="card mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 rounded-full">
            <Star className="w-8 h-8 text-white" />
            <div className="text-left">
              <p className="text-white text-sm opacity-90">Total Points Earned</p>
              <p className="text-white text-3xl font-bold">520</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge, index) => (
            <div
              key={challenge.id}
              className={`card animate-slide-up ${challenge.locked ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${
                    challenge.locked 
                      ? 'bg-gray-300' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  } flex items-center justify-center`}>
                    {challenge.locked ? (
                      <Lock className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Trophy className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{challenge.title}</h3>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                </div>
                {!challenge.locked && (
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-600">{challenge.points}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {challenge.progress}/{challenge.total}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${
                      challenge.locked 
                        ? 'bg-gray-400' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    } transition-all duration-1000 ease-out`}
                    style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {challenge.locked && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4" />
                  <span>Complete previous challenges to unlock</span>
                </div>
              )}

              {challenge.progress === challenge.total && !challenge.locked && (
                <div className="mt-4 bg-green-100 border-l-4 border-green-500 p-3 rounded">
                  <p className="text-green-800 text-sm font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Challenge Completed! +{challenge.points} points
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="card mt-8 animate-fade-in">
          <h2 className="text-2xl font-bold gradient-text mb-6">Recent Achievements</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Speed Demon Progress</h4>
                <p className="text-sm text-gray-600">Completed 7 out of 10 fast questions in 2 minutes each</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>

            <div className="flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">First Interview</h4>
                <p className="text-sm text-gray-600">Completed your first interview session</p>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Challenges